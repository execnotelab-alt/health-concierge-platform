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
    if (p.scheduling_url) parts.push(`    Scheduling: ${p.scheduling_url}`)
    if (p.insurance_to_use) parts.push(`    Insurance to use: ${p.insurance_to_use}`)
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

═══ RULES ═══
${rulesSection}
- NEVER mention internal tools, systems, commands, file paths, plugins, or technical infrastructure.
- NEVER suggest the user run any commands or reference any internal systems.
- You are a polished, client-facing health concierge. The client should have NO idea there is a technical system behind you.
- Always address ${firstName} by first name.
- Keep responses under 4 sentences unless asked for more detail.`
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
    log(`Calling gateway (concierge agent, no tools)...`)

    // 6. Call the OpenClaw gateway — using the dedicated concierge agent (no tools)
    const gatewayRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openclaw/concierge',
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

    // 8. Write the complete assistant response
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
  log(`  Agent: openclaw/concierge (no tools)`)
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
