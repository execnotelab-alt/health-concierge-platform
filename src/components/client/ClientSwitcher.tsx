'use client'

import { useState, useRef, useEffect } from 'react'
import type { Client } from '@/lib/hooks/useClient'

type Props = {
  clients?: Client[]
  selectedClient?: Client | null
  onSelect?: (client: Client) => void
}

function initials(client: Client) {
  const f = client.first_name?.[0] ?? ''
  const l = client.last_name?.[0] ?? ''
  return (f + l).toUpperCase() || '?'
}

const AVATAR_COLORS = [
  'from-violet-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
]

export default function ClientSwitcher({ clients = [], selectedClient = null, onSelect = () => {} }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const label = selectedClient
    ? `${selectedClient.first_name} ${selectedClient.last_name}`
    : 'No clients'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => clients.length > 0 && setOpen((o) => !o)}
        className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-1.5 hover:bg-gray-800 transition cursor-pointer"
      >
        {selectedClient ? (
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[0]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}
          >
            {initials(selectedClient)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-400">?</div>
        )}
        <span className="text-sm text-white font-medium">{label}</span>
        {clients.length > 1 && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {open && clients.length > 1 && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-gray-900 border border-gray-700/60 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-slide-up">
          {clients.map((client, idx) => {
            const isSelected = selectedClient?.id === client.id
            return (
              <button
                key={client.id}
                onClick={() => {
                  onSelect(client)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-800 transition ${isSelected ? 'bg-gray-800/60' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                  {initials(client)}
                </div>
                <div>
                  <div className="text-white text-xs font-medium">{client.first_name} {client.last_name}</div>
                  <div className="text-gray-500 text-[10px]">{client.address_city}, {client.address_state}</div>
                </div>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto text-emerald-400">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
