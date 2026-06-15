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

// ─── Deduplication ──────────────────────────────────────────────────────────
const processingIds = new Set()

// ─── Response Parser: split [INTERNAL] and [CLIENT] lines ─────────────────
function parseAgentResponse(rawContent) {
  const clientMessages = []
  const internalMessages = []

  if (!rawContent || !rawContent.trim()) {
    return { clientMessages: [], internalMessages: [] }
  }

  // Check if the response uses the [INTERNAL]/[CLIENT] format
  const hasFormat = /\[(CLIENT|INTERNAL)\]/i.test(rawContent)

  if (!hasFormat) {
    // Agent didn't use the format — treat entire response as client-facing
    clientMessages.push(rawContent.trim())
    return { clientMessages, internalMessages }
  }

  // Split by lines and categorize
  const lines = rawContent.split('\n')
  let currentType = null
  let currentBuffer = []

  function flush() {
    const text = currentBuffer.join('\n').trim()
    if (!text) return
    if (currentType === 'internal') {
      internalMessages.push(text)
    } else if (currentType === 'client') {
      clientMessages.push(text)
    }
    currentBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Check for [CLIENT] prefix
    const clientMatch = trimmed.match(/^\[CLIENT\]\s*(.*)/i)
    if (clientMatch) {
      flush()
      currentType = 'client'
      if (clientMatch[1]) currentBuffer.push(clientMatch[1])
      continue
    }

    // Check for [INTERNAL] or [INTERNAL: ...] prefix
    const internalMatch = trimmed.match(/^\[INTERNAL(?::\s*(.*))?\]\s*(.*)/i)
    if (internalMatch) {
      flush()
      currentType = 'internal'
      const content = internalMatch[2] || internalMatch[1] || ''
      if (content) currentBuffer.push(content)
      continue
    }

    // Continuation of current block
    if (currentType) {
      currentBuffer.push(line)
    } else {
      // Lines before any marker — treat as client
      currentType = 'client'
      currentBuffer.push(line)
    }
  }
  flush()

  // If no client messages were produced, fall back to raw content
  if (clientMessages.length === 0 && rawContent.trim()) {
    clientMessages.push(rawContent.replace(/\[(?:INTERNAL|CLIENT)\][^\n]*/gi, '').trim() || rawContent.trim())
  }

  return { clientMessages, internalMessages }
}

// ─── Clean client response: strip technical leakage ───────────────────────
function cleanClientResponse(text) {
  if (!text) return text
  
  // Remove lines that reference internal tools/systems
  const techPatterns = [
    /\b(gog|openclaw|exec|supabase|api|endpoint|webhook|plugin|gateway)\b/i,
    /\b(npm|node|bash|curl|ssh|docker|git)\b/i,
    /\b(tool|command|script|function|database|query|schema)\b/i,
    /`[^`]+`/, // backtick code references
    /\bgog auth\b/i,
    /\bGoogle account.*linked\b/i,
    /\bset up.*integration\b/i,
    /\bconnect.*calendar\b/i,
    /\bsync.*calendar\b/i,
  ]
  
  const lines = text.split('\n')
  const cleaned = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return true // keep blank lines
    // Only remove lines that are primarily technical
    const techHits = techPatterns.filter(p => p.test(trimmed)).length
    return techHits < 2 // allow one incidental match, remove if 2+ patterns hit
  })
  
  let result = cleaned.join('\n').trim()
  
  // If we stripped too much, fall back to original
  if (result.length < 20 && text.length > 50) {
    result = text.trim()
  }
  
  return result
}

// ─── Build rich system prompt with ALL client data ──────────────────────────
async function buildSystemPrompt(client) {
  const name = client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim()
  const firstName = client.first_name || name.split(' ')[0] || 'there'
  const location = [client.address_city, client.address_state].filter(Boolean).join(', ')
  const clientId = client.id

  // Fetch ALL related data in parallel
  const [
    { data: providers },
    { data: appointments },
    { data: insurance },
    { data: carePlan },
    { data: immunizations },
    { data: rules },
  ] = await Promise.all([
    supabase.from('providers').select('*').eq('client_id', clientId).order('specialty'),
    supabase.from('appointments').select('*').eq('client_id', clientId).order('scheduled_date'),
    supabase.from('insurance_policies').select('*').eq('client_id', clientId),
    supabase.from('care_plan_items').select('*').eq('client_id', clientId).order('next_due'),
    supabase.from('immunizations').select('*').eq('client_id', clientId),
    supabase.from('rules').select('*').eq('enabled', true).order('priority', { ascending: false }),
  ])

  // Format providers
  const providerSection = (providers || []).map(p => {
    const parts = [`  - ${p.name}${p.credentials ? ', ' + p.credentials : ''} — ${p.specialty}`]
    if (p.practice_name) parts.push(`    Practice: ${p.practice_name}`)
    if (p.address) parts.push(`    Address: ${p.address}`)
    if (p.phone) parts.push(`    Phone: ${p.phone}`)
    if (p.last_visit) parts.push(`    Last visit: ${p.last_visit}`)
    if (p.next_due) parts.push(`    Next due: ${p.next_due}${p.next_due_notes ? ' — ' + p.next_due_notes : ''}`)
    if (p.website_url) parts.push(`    Website: ${p.website_url}`)
    if (p.scheduling_url) parts.push(`    Scheduling URL: ${p.scheduling_url}`)
    if (p.insurance_to_use) parts.push(`    Insurance to use: ${p.insurance_to_use}`)
    if (p.scheduling_notes) parts.push(`    Scheduling Notes: ${p.scheduling_notes}`)
    if (p.notes) parts.push(`    Notes: ${p.notes}`)
    return parts.join('\n')
  }).join('\n') || '  No providers on file yet.'

  // Format appointments
  const now = new Date()
  const upcoming = (appointments || []).filter(a => {
    if (a.status === 'cancelled') return false
    if (!a.scheduled_date) return false
    return new Date(a.scheduled_date) >= new Date(now.toDateString())
  })
  const past = (appointments || []).filter(a => {
    if (!a.scheduled_date) return false
    return new Date(a.scheduled_date) < new Date(now.toDateString()) || a.status === 'completed'
  })

  const upcomingSection = upcoming.length > 0
    ? upcoming.map(a => {
      const date = new Date(a.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      const time = a.scheduled_time ? new Date('2000-01-01T' + a.scheduled_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
      return `  - ${date}${time ? ' at ' + time : ''} — ${a.appointment_type || 'Appointment'} with ${a.provider_name || 'TBD'}${a.practice_name ? ' at ' + a.practice_name : ''}${a.prep_notes ? '\n    Prep: ' + a.prep_notes : ''}`
    }).join('\n')
    : '  No upcoming appointments.'

  const pastSection = past.length > 0
    ? past.slice(-5).map(a => {
      const date = new Date(a.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `  - ${date} — ${a.appointment_type || 'Appointment'} with ${a.provider_name || 'Unknown'}${a.outcome ? ' — ' + a.outcome : ''}`
    }).join('\n')
    : '  No past appointments recorded.'

  // Format insurance
  const insuranceSection = (insurance || []).map(i => {
    const parts = [`  - ${i.type.toUpperCase()}: ${i.carrier}${i.plan_name ? ' — ' + i.plan_name : ''}`]
    if (i.member_id) parts.push(`    Member ID: ${i.member_id}`)
    if (i.group_number) parts.push(`    Group #: ${i.group_number}`)
    if (i.network) parts.push(`    Network: ${i.network}`)
    return parts.join('\n')
  }).join('\n') || '  No insurance on file.'

  // Format care plan
  const carePlanSection = (carePlan || []).map(c => {
    const status = c.status === 'scheduled' ? '📅' : c.status === 'overdue' ? '🔴' : c.status === 'upcoming' ? '🟡' : '⬜'
    const due = c.next_due ? `Due: ${new Date(c.next_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : (c.next_due_notes || '')
    return `  ${status} ${c.item_name} (${c.frequency || 'as needed'}) — ${c.status}${due ? ' — ' + due : ''}${c.provider_name ? ' — ' + c.provider_name : ''}`
  }).join('\n') || '  No care plan items.'

  // Format immunizations
  const immunizationSection = (immunizations || []).map(i => {
    const last = i.last_received ? new Date(i.last_received).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : (i.last_received_approx || 'Unknown')
    return `  - ${i.vaccine_name}: Last ${last} (${i.frequency || 'schedule unknown'})${i.notes ? ' — ' + i.notes : ''}`
  }).join('\n') || '  No immunization records.'

  // Format operational rules
  const rulesSection = (rules || []).map(r => `  - ${r.name}: ${r.rule_text}`).join('\n')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return `You are Pixel 🌿, ${firstName}'s personal health concierge assistant. Today is ${today}.

You work directly for ${firstName}. You know their complete health profile, all their providers, every appointment (past and upcoming), their insurance details, and their care plan. You helped set all of this up together. Reference this information naturally in conversation — you should already know these things, never ask for information you already have.

═══ CLIENT PROFILE ═══
Name: ${name}
Date of Birth: ${client.date_of_birth || 'Unknown'} (Age ${client.date_of_birth ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / 31557600000) : '?'})
Sex: ${client.sex || 'Unknown'}
Phone: ${client.phone || 'Unknown'}
Email: ${client.email || 'Unknown'}
Address: ${client.address_line1 || ''}${client.address_city ? ', ' + client.address_city : ''}${client.address_state ? ', ' + client.address_state : ''} ${client.address_zip || ''}
Exercise: ${client.exercise_routine || 'Unknown'}
Health Goals: ${(client.health_goals || []).join('; ') || 'None specified'}
Known Conditions: ${(client.known_conditions || []).join('; ') || 'None'}
Medications: ${(client.medications || []).length > 0 ? client.medications.join(', ') : 'None'}
Supplements: ${(client.supplements || []).length > 0 ? client.supplements.join(', ') : 'None'}
Allergies: ${(client.allergies || []).length > 0 ? client.allergies.join(', ') : 'None'}
Family History: ${client.family_history || 'Unknown'}
Scheduling Preferences: ${client.scheduling_pref_times || 'Flexible'}; max ${client.scheduling_max_drive_minutes || '?'} min drive from ${client.scheduling_location_pref || 'home'}

═══ PROVIDERS ═══
${providerSection}

═══ UPCOMING APPOINTMENTS ═══
${upcomingSection}

═══ PAST APPOINTMENTS ═══
${pastSection}

═══ INSURANCE ═══
${insuranceSection}

═══ CARE PLAN ═══
${carePlanSection}

═══ IMMUNIZATIONS ═══
${immunizationSection}

═══ YOUR PERSONALITY ═══
- Warm, laid back, zen, knowledgeable
- Concise — don't over-explain unless asked
- Use emojis sparingly (1-2 per message max)
- Proactive — mention upcoming items naturally
- You ALREADY KNOW all of the above information. Never ask ${firstName} for info you already have.
- When referencing appointments, providers, or care plan items, speak about them naturally as if you personally helped arrange them.
- If ${firstName} asks about something you don't have data for, say you'll look into it.

═══ OUTPUT FORMAT — CRITICAL ═══
You have TWO output channels. You MUST use the correct prefix for each line of your response:

[INTERNAL] — Behind-the-scenes narration. The client NEVER sees this. Use it to narrate what you're doing while browsing websites, filling forms, checking availability, etc. Keep these short and factual.

[CLIENT] — Messages sent directly to ${firstName}. These must be short, warm, conversational — like a real text message. Never mention browsers, tools, forms, websites, or technical details. Never narrate what you're seeing on screen. The client should feel like you just "checked" and came back with an answer.

Example of correct output when scheduling:
[CLIENT] Let me check on that for you — give me a few minutes.
[INTERNAL] Navigating to USDP Flower Mound provider page to find self-scheduling widget...
[INTERNAL] Found online scheduling option. Selecting "Existing Patient" and "Annual Skin Exam"...
[INTERNAL] Calendar loaded. Available slots: Jul 8 at 9:00 AM, Jul 10 at 2:30 PM, Jul 15 at 10:15 AM.
[CLIENT] I found a few openings with Dawn Wells at Flower Mound — July 8th at 9am, July 10th at 2:30pm, or July 15th at 10:15am. Which works best?

RULES:
- Every line of output MUST start with either [CLIENT] or [INTERNAL]
- [CLIENT] messages must be 1-3 sentences max — like a real text message
- [INTERNAL] messages are for your work narration only
- NEVER put browser narration, form details, or technical steps in [CLIENT] lines
- NEVER tell the client to visit a website, check a form, or do anything on a computer — YOU are doing the work for them
- If you need something from the client (verification code, preference), ask in a [CLIENT] line naturally
- Multiple [CLIENT] lines in one response become separate messages to the client

═══ SCHEDULING BEHAVIOR ═══
You are a human health assistant who browses the web and books appointments on behalf of ${firstName}. You work exactly like a skilled human personal assistant would.

SCHEDULING PRIORITY — always try in this order:
1. SELF-SCHEDULING WIDGETS — Look for interactive scheduling tools with real-time availability calendars. These are usually embedded on the provider's page or location page (not the main homepage). Look for "Book Online", "Schedule Now", "Book Appointment" buttons that open a calendar picker.
2. THIRD-PARTY SCHEDULING — Check if the provider is on Zocdoc, Solv, or similar platforms that offer instant booking with real availability.
3. REQUEST FORMS — Generic "Request an Appointment" forms that just submit a contact request are a LAST RESORT. They don't show real availability and require a callback. Only use these if no self-scheduling option exists.

When ${firstName} asks to schedule something:
1. Send a [CLIENT] acknowledgment — "Let me check on that for you."
2. Navigate to the provider's specific page (provider bio page or location page, NOT the homepage)
3. Look for a self-scheduling widget with a real calendar showing available time slots
4. If you find one, use it — select existing patient, fill in ${firstName}'s info, browse available dates
5. Present 2-3 specific slots in a [CLIENT] message
6. When ${firstName} picks one, complete the booking
7. Confirm in a [CLIENT] message

FILLING FORMS:
- Use ${firstName}'s profile data (name, DOB, phone, email, insurance) — you already have it all above
- Select "existing patient" when asked
- Take the simplest path — skip optional fields
- Narrate form-filling in [INTERNAL] lines, never in [CLIENT] lines

WHEN YOU NEED THE CLIENT'S HELP:
- Verification codes: [CLIENT] "They just sent a code to your phone — can you share it when you get it?"
- Security questions or unknown preferences: ask naturally in a [CLIENT] line

WHEN YOU HIT A WALL:
- CAPTCHA: [CLIENT] "I'm having a bit of trouble getting through — let me try again in a moment."
- No online scheduling: [CLIENT] "They don't have online scheduling. Want me to give you their number to call, or should I try another approach?"
- Site down: [CLIENT] "Their site seems to be having issues. I'll try again shortly."

CRITICAL: NEVER ask if ${firstName} wants to connect a calendar app, sync Google Calendar, or set up any calendar integration. This service does NOT connect to calendar apps. You work conversationally — you find slots, ${firstName} picks one, you book it.

═══ RULES ═══
${rulesSection}
- NEVER mention internal tools, systems, commands, file paths, plugins, browsers, or technical infrastructure in [CLIENT] messages.
- NEVER suggest the client visit a website, check a form, or do anything technical.
- NEVER narrate what you see on screen to the client — that goes in [INTERNAL] lines.
- You are a polished, client-facing health concierge. The client should have NO idea there is a technical system behind you.
- Always address ${firstName} by first name.
- [CLIENT] messages must be under 3 sentences unless the client asked for detail.`
}

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

  // Helper: write an internal (behind-the-scenes) message
  async function writeInternal(text) {
    await supabase.from('chat_messages').insert({
      client_id,
      role: 'assistant',
      content: text,
      visibility: 'internal',
      status: 'delivered',
      source: 'system',
      message_type: 'text',
    })
    log(`  ↳ [BTS] ${text}`)
  }

  try {
    // 1. Mark as processing
    await supabase.from('chat_messages').update({ status: 'processing' }).eq('id', id)
    await writeInternal(`📨 New message from client: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`)

    // 2. Look up client info
    await writeInternal('🔍 Loading client health records from database...')
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      throw new Error(`Client ${client_id} not found: ${clientErr?.message}`)
    }
    const firstName = client.first_name || client.full_name?.split(' ')[0] || 'Client'
    await writeInternal(`✅ Loaded profile for ${firstName} — checking providers, appointments, care plan...`)

    // 3. Fetch recent chat history (last 20 delivered client-visible messages)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content, visibility, status')
      .eq('client_id', client_id)
      .eq('status', 'delivered')
      .in('visibility', source === 'admin_chat' ? ['client', 'internal'] : ['client'])
      .order('created_at', { ascending: false })
      .limit(20)

    const recentMessages = (history || []).reverse()

    // 4. Build rich system prompt with ALL client data from Supabase
    const systemPrompt = await buildSystemPrompt(client)
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
    await writeInternal('🤖 Thinking about response...')
    log(`Calling gateway (concierge agent, session: concierge-${client_id})...`)

    // 6. Call the OpenClaw gateway — using the dedicated concierge agent with session persistence
    // Passing `user` ensures each client gets a stable persistent session so browser state
    // (tabs, bookings in progress) survives across messages in the same conversation.
    const gatewayRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        // Use a date-based session key so sessions don't accumulate stale history forever
        'x-openclaw-session-key': `session:concierge-${client_id}-${new Date().toISOString().slice(0, 10)}`,
      },
      body: JSON.stringify({
        model: 'openclaw/concierge',
        user: `concierge-${client_id}`,
        messages,
        stream: true,
      }),
    })

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text().catch(() => '')
      throw new Error(`Gateway ${gatewayRes.status}: ${errText}`)
    }

    // 7. Parse SSE stream and accumulate content
    let fullContent = ''
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
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) fullContent += delta
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

    log(`Stream complete: ${fullContent.length} chars`)

    // 8. Parse response into [INTERNAL] and [CLIENT] segments
    const { clientMessages, internalMessages } = parseAgentResponse(fullContent)

    // 9. Store any agent-produced internal messages
    for (const msg of internalMessages) {
      await writeInternal(msg)
    }

    // 10. Clean the client response — strip technical leakage
    let clientContent = clientMessages.length > 0
      ? clientMessages.join('\n\n')
      : fullContent || '(no response)'
    
    clientContent = cleanClientResponse(clientContent)
    
    // 11. Store client-facing message
    const finalVisibility = source === 'admin_chat' ? 'internal' : 'client'
    await supabase.from('chat_messages').insert({
      client_id,
      role: 'assistant',
      content: clientContent,
      visibility: finalVisibility,
      status: 'delivered',
      source: 'system',
      message_type: 'text',
    })
    await writeInternal(`💬 Sent response to ${firstName}`)

    // 11. Delete the typing placeholder
    if (placeholderId) {
      await supabase.from('chat_messages').delete().eq('id', placeholderId)
    }

    // 12. Mark the original message as delivered
    await supabase.from('chat_messages').update({ status: 'delivered' }).eq('id', id)

    log(`✓ Delivered response for message ${id}`)
  } catch (err) {
    log(`✗ Error processing message ${id}: ${err.message}`)
    console.error(err)
    await supabase.from('chat_messages').update({ status: 'error' }).eq('id', id).catch(() => {})
  } finally {
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
  log('  Health Concierge Bridge Worker v2.0  ')
  log('═══════════════════════════════════════')
  log(`  Gateway: ${GATEWAY_URL}`)
  log(`  Supabase: ${SUPABASE_URL}`)
  log(`  Agent: openclaw/concierge (browser + web)`)
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
