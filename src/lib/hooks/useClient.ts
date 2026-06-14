'use client'
import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type Client = {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  status: string
  date_of_birth: string
  address_city: string
  address_state: string
  address_street: string
  address_zip: string
  telegram_chat_id: string | null
  telegram_username: string | null
  notes: string | null
  metadata: any
  created_at: string
}

export function useClient() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  )

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('last_name')

      if (error) console.error('[useClient] fetchClients:', error)

      if (data && data.length > 0) {
        setClients(data)
        setSelectedClient(data[0]) // Select first client by default
      }
      setLoading(false)
    }

    fetchClients()
  }, [supabase])

  return { clients, selectedClient, setSelectedClient, loading }
}
