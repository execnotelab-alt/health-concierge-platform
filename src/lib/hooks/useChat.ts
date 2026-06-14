'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type ChatMessage = {
  id: string
  role: string
  content: string
  visibility: string
  message_type: string | null
  source: string | null
  status: string
  tool_name: string | null
  metadata: any
  created_at: string
}

export function useChat(clientId: string | null, visibilityFilter: 'client' | 'all') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const channelRef = useRef<any>(null)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  )

  // Fetch initial messages
  useEffect(() => {
    if (!clientId) return

    async function fetchMessages() {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (visibilityFilter === 'client') {
        query = query.eq('visibility', 'client')
      }

      // Exclude processing placeholder messages from initial load
      query = query.neq('status', 'processing')

      const { data, error } = await query
      if (error) console.error('[useChat] fetchMessages:', error)
      if (data) setMessages(data)
    }

    fetchMessages()
  }, [clientId, visibilityFilter, supabase])

  // Subscribe to realtime
  useEffect(() => {
    if (!clientId) return

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`chat-${clientId}-${visibilityFilter}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage

          // Apply visibility filter
          if (visibilityFilter === 'client' && newMsg.visibility !== 'client') return

          // Processing rows = typing indicator only, don't add to message list
          if (newMsg.status === 'processing') {
            setIsProcessing(true)
            return
          }

          setIsProcessing(false)
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage
          // When the bridge delivers a response, clear processing state
          if (updated.status === 'delivered') {
            setIsProcessing(false)
          }
          // Update existing message in state (e.g. pending → delivered)
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          )
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          // Placeholder deleted → clear processing
          setIsProcessing(false)
          const deleted = payload.old as { id: string }
          setMessages((prev) => prev.filter((m) => m.id !== deleted.id))
        },
      )
      .subscribe((status, err) => {
        if (err) console.error('[useChat] realtime error:', err)
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [clientId, visibilityFilter, supabase])

  const sendMessage = useCallback(
    async (content: string, isAdmin = false) => {
      if (!clientId || !content.trim()) return { error: 'Missing clientId or content' }
      const endpoint = isAdmin ? '/api/chat/admin-send' : '/api/chat/send'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, message: content }),
      })
      return res.json()
    },
    [clientId],
  )

  return { messages, sendMessage, isProcessing }
}
