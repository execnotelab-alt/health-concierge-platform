import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { clientId, message } = await req.json()

    if (!clientId || !message) {
      return NextResponse.json({ error: 'Missing clientId or message' }, { status: 400 })
    }

    // Use service role key for server-side operations (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        client_id: clientId,
        role: 'user',
        content: message,
        visibility: 'client',
        status: 'pending',
        source: 'client_chat',
        message_type: 'text',
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, messageId: data.id })
  } catch (err: any) {
    console.error('[/api/chat/send]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
