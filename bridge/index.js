import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GATEWAY_URL || !GATEWAY_TOKEN) {
  console.error('[bridge] Missing required env vars. Check bridge/.env')
  process.exit(1)
}

// ─── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function buildSystemPrompt(client) {
  const name = client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim()
  const firstName = client.first_name || name.split(' ')[0] || 'there'
  const location = [client.address_city, client.address_state].filter(Boolean).join(', ')

  return `You are Pixel 🌿, a warm and proactive AI health concierge for ${name}.

Your job is to help ${firstName} stay on top of their preventive care, upcoming appointments, health goals, and any questions they have.

Key information about ${firstName}:
- Full name: ${name}
- Location: ${location || 'Unknown'}
- Date of Birth: ${client.date_of_birth || 'Unknown'}
- Email: ${client.email || 'Unknown'}

Personality:
- Warm, laid back, zen, smart
- Concise — don't over-explain
- Use emojis sparingly but naturally (1-2 per message max)
- Proactive — mention upcoming items even when not asked
- When you don't know something specific, say so and offer to follow up

CRITICAL RULES:
- NEVER mention internal tools, skills, plugins, commands, or system details. No references to "gog", "openclaw", "memory index", "skills", "SKILL.md", file paths, or any technical infrastructure.
- NEVER suggest the user run commands or reference internal systems.
- Respond as a polished, client-facing health concierge. The user should have NO idea there is any technical system behind you.
- If you cannot do something, simply say "I'll look into that and get back to you" — never explain WHY in technical terms.
- Do NOT read or reference any workspace files, MEMORY.md, AGENTS.md, or skill files. You are a standalone concierge.
- Keep responses under 4 sentences unless the user asked for details.
- Always address ${firstName} by first name.`
}

// ─── Deduplication ──────────────────────────────────────────────────────────
const processingIds = new Set()

// ─── Core: process a single pending message ─────────────────────────────────
async function processMessage(message) {
  const { id, client_id, content, source } = message

  // Prevent duplicate processing
  if (processingIds.has(id)) {
    log(`Skipping duplicate message ${id}`)
    return
  }
  processingIds.add(id)

  log(`Processing message ${id} (client: ${client_id}, source: ${source})`)

  try {
    // 1. Mark as processing
    await supabase.from('chat_messages').update({ status: 'processing' }).eq('id', id)

    // 2. Look up client info
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      throw new Error(`Client ${client_id} not found: ${clientErr?.message}`)
    }

    // 3. Fetch recent chat history (last 20 delivered client-visible messages)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content, status, created_at')
      .eq('client_id', client_id)
      .eq('visibility', 'client')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(20)

    const recentMessages = (history || []).reverse()

    // 4. Build system prompt + message array
    const systemPrompt = buildSystemPrompt(client)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content },
    ]

    // 5. Insert processing placeholder (typing indicator)
    const responseVisibility = source === 'admin_chat' ? 'internal' : 'client'
    const { data: placeholder } = await supabase
      .from('chat_messages')
      .insert({
        client_id,
        role: 'assistant',
        content: '',
        visibility: responseVisibility,
        status: 'processing',
        source: 'system',
        message_type: 'text',
      })
      .select('id')
      .single()

    const placeholderId = placeholder?.id
    log(`Inserted typing placeholder ${placeholderId}, calling gateway...`)

    // 6. Call the OpenClaw gateway with streaming
    const gatewayRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'x-openclaw-session-key': `concierge-${client_id}`,
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages,
        stream: true,
      }),
    })

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text().catch(() => '')
      throw new Error(`Gateway ${gatewayRes.status}: ${errText}`)
    }

    // 7. Parse SSE stream — capture tool calls AND content
    let fullContent = ''
    const toolCalls = [] // { name, arguments }
    let currentToolCalls = {} // accumulate streaming tool call deltas
    const reader = gatewayRes.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const choice = parsed.choices?.[0]
          if (!choice) continue

          // Accumulate content
          const contentDelta = choice.delta?.content
          if (contentDelta) fullContent += contentDelta

          // Capture tool calls
          const tcDeltas = choice.delta?.tool_calls
          if (tcDeltas) {
            for (const tc of tcDeltas) {
              const idx = tc.index ?? 0
              if (!currentToolCalls[idx]) {
                currentToolCalls[idx] = { name: '', arguments: '' }
              }
              if (tc.function?.name) currentToolCalls[idx].name = tc.function.name
              if (tc.function?.arguments) currentToolCalls[idx].arguments += tc.function.arguments
            }
          }

          // If finish_reason is 'tool_calls', finalize accumulated tool calls
          if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
            for (const [, tc] of Object.entries(currentToolCalls)) {
              if (tc.name) toolCalls.push({ name: tc.name, arguments: tc.arguments })
            }
            currentToolCalls = {}
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    // Handle remaining buffer
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim()
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) fullContent += delta
        } catch { /* ignore */ }
      }
    }

    // Finalize any remaining tool calls
    for (const [, tc] of Object.entries(currentToolCalls)) {
      if (tc.name) toolCalls.push({ name: tc.name, arguments: tc.arguments })
    }

    log(`Stream complete: ${fullContent.length} chars, ${toolCalls.length} tool call(s)`)

    // 8a. Write tool call entries to BTS (internal visibility)
    for (const tc of toolCalls) {
      let argSummary = tc.arguments
      try {
        const parsed = JSON.parse(tc.arguments)
        argSummary = JSON.stringify(parsed, null, 2)
      } catch { /* use raw */ }

      await supabase.from('chat_messages').insert({
        client_id,
        role: 'assistant',
        content: argSummary || '(no args)',
        visibility: 'internal',
        status: 'delivered',
        source: 'system',
        message_type: 'tool_call',
        tool_name: tc.name,
      })
      log(`  → Tool call: ${tc.name}`)
    }

    // 8b. Write the complete assistant response
    await supabase.from('chat_messages').insert({
      client_id,
      role: 'assistant',
      content: fullContent || '(no response)',
      visibility: responseVisibility,
      status: 'delivered',
      source: 'system',
      message_type: 'text',
    })

    // 9. Delete the typing placeholder
    if (placeholderId) {
      await supabase.from('chat_messages').delete().eq('id', placeholderId)
    }

    // 10. Mark the original message as delivered
    await supabase.from('chat_messages').update({ status: 'delivered' }).eq('id', id)

    log(`✓ Delivered response for message ${id}`)
  } catch (err) {
    log(`✗ Error processing message ${id}: ${err.message}`)
    console.error(err)
    await supabase.from('chat_messages').update({ status: 'error' }).eq('id', id).catch(() => {})
  } finally {
    // Clean up dedup set after a delay (in case of realtime replay)
    setTimeout(() => processingIds.delete(id), 30000)
  }
}

// ─── Recovery: pick up any pending messages from before startup ─────────────
async function recoverPendingMessages() {
  log('Checking for pending messages to recover...')
  const { data: pending, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('role', 'user')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    log(`Recovery query error: ${error.message}`)
    return
  }

  if (!pending || pending.length === 0) {
    log('No pending messages found.')
    return
  }

  log(`Found ${pending.length} pending message(s) — recovering...`)
  for (const msg of pending) {
    await processMessage(msg)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════')
  log('  Health Concierge Bridge Worker v1.0  ')
  log('═══════════════════════════════════════')
  log(`  Gateway: ${GATEWAY_URL}`)
  log(`  Supabase: ${SUPABASE_URL}`)
  log('═══════════════════════════════════════')

  // Recover any messages that arrived before we started
  await recoverPendingMessages()

  // Subscribe to realtime inserts on chat_messages
  const channel = supabase
    .channel('bridge-chat-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      async (payload) => {
        const msg = payload.new
        // Only process user messages with pending status
        if (msg.role === 'user' && msg.status === 'pending') {
          await processMessage(msg)
        }
      },
    )
    .subscribe((status, err) => {
      if (err) {
        log(`Realtime error: ${err.message}`)
      } else {
        log(`Realtime subscription: ${status}`)
      }
    })

  log('Bridge ready — listening for incoming messages...')

  // Graceful shutdown
  async function shutdown(signal) {
    log(`\nReceived ${signal}. Shutting down gracefully...`)
    try {
      await supabase.removeChannel(channel)
    } catch {}
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  console.error('[bridge] Fatal error:', err)
  process.exit(1)
})
