# Milestone 2: Live Chat Integration — Complete Plan

## The Core Challenge

The OpenClaw gateway runs locally on your Mac mini (`127.0.0.1:18789`, loopback-only). The web app runs on Vercel (cloud). They can't talk to each other directly. We need a bridge.

---

## Architecture: How Messages Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Cloud)                               │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ iPhone Chat   │───▶│ /api/chat    │───▶│ Supabase             │  │
│  │ (client)      │    │ send         │    │ chat_messages table  │  │
│  └──────────────┘    └──────────────┘    │ (message queue)      │  │
│                                          └──────────┬───────────┘  │
│  ┌──────────────┐    ┌──────────────┐               │              │
│  │ Admin Panel   │───▶│ /api/chat    │───────────────┘              │
│  │ (operator)    │    │ admin-send   │                              │
│  └──────────────┘    └──────────────┘                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐  │
│  │ Both Panels   │◀──│ Supabase Realtime subscription           │  │
│  │ (live update)  │    │ on chat_messages table                   │  │
│  └──────────────┘    └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    Supabase (Cloud DB)
                    chat_messages table
                                │
                     ┌──────────┴───────────┐
                     │  Polling / Realtime   │
                     │  (new pending msgs)   │
                     └──────────┬───────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────┐
│                     MAC MINI (Local)                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Bridge Worker (Node.js process)                              │  │
│  │                                                                │  │
│  │  1. Subscribes to Supabase Realtime for new pending messages  │  │
│  │  2. Picks up message, calls OpenClaw Gateway API              │  │
│  │  3. Streams response (tool calls, reasoning, final answer)    │  │
│  │  4. Writes each step to Supabase chat_messages with tags:     │  │
│  │     - tool calls → visibility: 'internal'                     │  │
│  │     - reasoning → visibility: 'internal'                      │  │
│  │     - final response → visibility: 'client'                   │  │
│  │     - admin responses → visibility: 'internal'                │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │  OpenClaw Gateway (127.0.0.1:18789)                           │  │
│  │  - /v1/chat/completions (needs enabling)                      │  │
│  │  - /tools/invoke                                              │  │
│  │  - Full agent with tools, browser, files, etc.                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Bridge Worker

A lightweight Node.js process that runs on the Mac mini alongside OpenClaw. This is the key piece that connects the cloud web app to the local gateway.

### What it does:
1. **Listens** — Subscribes to Supabase Realtime for new `chat_messages` with `status = 'pending'`
2. **Routes** — Picks up pending messages, determines if they're client or admin messages
3. **Calls OpenClaw** — Sends the message to the gateway's `/v1/chat/completions` endpoint (streaming)
4. **Tags & Stores** — As the response streams back, writes each chunk to Supabase with proper visibility:
   - Tool calls → `visibility: 'internal'`, `message_type: 'tool_call'`
   - Tool results → `visibility: 'internal'`, `message_type: 'tool_result'`
   - Reasoning → `visibility: 'internal'`, `message_type: 'reasoning'`
   - Final assistant response → `visibility: 'client'`, `message_type: 'text'`
   - Admin-triggered responses → `visibility: 'internal'`
5. **Updates status** — Marks the original pending message as `status = 'processed'`

### Why a bridge worker instead of direct API calls:
- Gateway is local-only (loopback) — Vercel can't reach it
- We get full streaming of intermediate steps (tool calls, browser actions)
- The bridge handles the visibility tagging logic in one place
- It can be managed as a simple background service or OpenClaw cron job
- No need to expose the gateway to the internet

---

## Database Schema Changes

Add `status` column to `chat_messages`:

```sql
ALTER TABLE chat_messages ADD COLUMN status text DEFAULT 'delivered';
-- Values: 'pending' (waiting for bridge), 'processing', 'delivered', 'error'
```

Add `source` column to distinguish message origin:

```sql
ALTER TABLE chat_messages ADD COLUMN source text DEFAULT 'system';
-- Values: 'client_chat' (iPhone), 'admin_chat' (operator panel), 'system' (OpenClaw)
```

---

## Session Management

Each client gets a dedicated OpenClaw session:
- Session key format: `session:concierge-{clientId}`
- The bridge worker passes `x-openclaw-session-key` header to route to the right session
- Sessions persist conversation context across messages
- System prompt loaded per-client with their profile, rules, and concierge instructions

---

## Gateway Configuration Changes

Enable the chat completions endpoint:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true }
      }
    }
  }
}
```

No need to change bind/remote — the bridge runs locally and accesses via loopback.

---

## Frontend Changes

### iPhone Chat Panel (left)
- Real `<ChatInput>` that POSTs to `/api/chat/send`
- API route writes message to Supabase `chat_messages` with `status: 'pending'`, `source: 'client_chat'`, `visibility: 'client'`
- Subscribe to Supabase Realtime filtered by `client_id` AND `visibility = 'client'`
- Render only client-visible messages as iOS-style bubbles
- Show typing indicator while `status = 'processing'` exists

### Behind-the-Scenes Panel (right)
- Real `<ChatInput>` that POSTs to `/api/chat/admin-send`
- API route writes message to Supabase with `status: 'pending'`, `source: 'admin_chat'`, `visibility: 'internal'`
- Subscribe to Supabase Realtime filtered by `client_id` (ALL messages, no visibility filter)
- Render with appropriate icons:
  - 🧠 Reasoning steps
  - 🔧 Tool calls (with expandable args/results)
  - 💬 Client-visible messages (highlighted differently)
  - 📝 Admin messages
  - ✅ Completions

### Client Info Panel (right sidebar)
- Already pulling from Supabase — just needs real-time refresh after appointments are booked, etc.

---

## Implementation Steps

### Step 1: Schema updates
- Add `status` and `source` columns to `chat_messages`
- Update TypeScript types

### Step 2: Gateway config
- Enable `/v1/chat/completions` endpoint
- Test locally with curl

### Step 3: Build the Bridge Worker
- Create `bridge/` directory in the project
- Node.js script that:
  - Connects to Supabase Realtime
  - Listens for pending messages
  - Calls OpenClaw gateway with streaming
  - Parses SSE stream, tags, and writes back to Supabase
- Include a startup script and instructions for running as a service
- Include health check / status endpoint

### Step 4: Build API routes
- `POST /api/chat/send` — client message handler
- `POST /api/chat/admin-send` — admin message handler
- Both validate auth, write to Supabase, return immediately (async processing by bridge)

### Step 5: Wire up frontend
- Replace placeholder chat components with real Supabase Realtime subscriptions
- iPhone panel: filtered view (client messages only)
- Admin panel: full view (all messages)
- Typing/processing indicators
- Auto-scroll, timestamps, message grouping

### Step 6: Test end-to-end
- Client sends message in iPhone chat
- Bridge picks it up, sends to OpenClaw
- Behind-the-scenes panel shows tool calls and reasoning in real-time
- Client gets the polished response in the iPhone chat
- Admin sends a DM, response appears only in admin panel

### Step 7: Deploy & verify
- Push frontend changes to Vercel
- Start bridge worker on Mac mini
- Full integration test on live deployment

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bridge worker goes down | Messages queue up as 'pending', no responses | Health monitoring + auto-restart via launchd/pm2. Pending messages processed on restart. |
| Supabase Realtime latency | Slight delay in UI updates | Acceptable for demo; can add optimistic UI updates |
| Gateway token exposure | Security risk if token leaks | Token stays on Mac mini only, never in Vercel env vars |
| Streaming parse complexity | Tool calls may have complex formats | Parse OpenAI streaming format carefully; log unparseable chunks |
| Session context limits | Long conversations hit token limits | OpenClaw handles context management internally |

---

## What's NOT in This Milestone

- Client self-service portal (Milestone 5)
- Rules editing from admin UI (Milestone 4)
- New client onboarding from UI (Milestone 5)
- Encrypted credential vault (Milestone 5)

---

## Estimated Complexity

- **Schema updates:** Simple (30 min)
- **Gateway config:** Simple (15 min)
- **Bridge worker:** Medium-high — this is the core piece (~3-4 hours)
- **API routes:** Simple (1 hour)
- **Frontend wiring:** Medium (~2-3 hours)
- **Testing:** Medium (1-2 hours)

Total: ~8-10 hours of focused work

---

## Open Questions for Leo

1. **Bridge worker hosting:** Should it run as a launchd service on the Mac mini, or managed via pm2, or as an OpenClaw background process? I'd recommend pm2 for easy management.

2. **Multi-session:** When we add more clients, each gets their own OpenClaw session. Should all clients share the same concierge system prompt, or should it be customizable per client?

3. **Message retention:** How long should we keep chat messages in Supabase? Forever, or rolling window?
