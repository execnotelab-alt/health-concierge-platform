# Health Concierge Bridge Worker

The bridge is a long-running Node.js worker that connects the Supabase database to the OpenClaw AI gateway. It watches for new pending chat messages and routes them through the AI, writing the response back to Supabase Realtime.

## Architecture

```
Client (browser) → Next.js API → Supabase (chat_messages)
                                        ↓ Realtime INSERT
                               Bridge Worker (this)
                                        ↓ fetch + SSE stream
                              OpenClaw Gateway (/v1/chat/completions)
                                        ↓ assistant response
                               Supabase (chat_messages INSERT)
                                        ↓ Realtime
                               Client (browser) ← live update
```

## Setup

```bash
cd bridge
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=<gateway-token>
```

**⚠️ Never commit `.env` — it contains secrets.**

## Running

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

## How It Works

1. **Startup recovery**: On boot, queries for any `status='pending'` user messages and processes them (handles crashes/restarts cleanly).

2. **Realtime subscription**: Subscribes to Supabase Realtime on the `chat_messages` table for INSERT events. Filters to `role='user' AND status='pending'`.

3. **Message processing**:
   - Updates message status to `'processing'`
   - Fetches client profile from `clients` table
   - Fetches last 20 delivered messages for conversation history
   - Inserts a typing-indicator placeholder row (`role='assistant', status='processing', content=''`)
   - Calls OpenClaw gateway with SSE streaming
   - Accumulates the streamed response
   - Inserts the complete response as `status='delivered'`
   - Deletes the typing placeholder
   - Marks the original user message as `status='delivered'`

4. **Response routing**:
   - `source='client_chat'` → response gets `visibility='client'`
   - `source='admin_chat'` → response gets `visibility='internal'`

## Logs

All activity is logged to stdout with ISO timestamps:
```
[2026-06-14T16:00:00.000Z] Bridge ready — listening for incoming messages...
[2026-06-14T16:00:05.123Z] Processing message abc-123 (client: xyz-456, source: client_chat)
[2026-06-14T16:00:07.456Z] Stream complete: 142 chars
[2026-06-14T16:00:07.500Z] ✓ Delivered response for message abc-123
```

## Running as a macOS Background Service

You can keep the bridge running persistently with launchd:

```xml
<!-- ~/Library/LaunchAgents/com.healthconcierge.bridge.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.healthconcierge.bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/path/to/health-concierge-platform/bridge/index.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/path/to/health-concierge-platform/bridge</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/health-concierge-bridge.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/health-concierge-bridge-error.log</string>
</dict>
</plist>
```
