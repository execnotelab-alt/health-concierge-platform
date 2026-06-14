'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, ChatMessage } from '@/lib/hooks/useChat'
import ChatInput from './ChatInput'

type Props = {
  clientId: string | null
}

const BADGE_COLORS: Record<string, string> = {
  gray: 'bg-gray-700 text-gray-300',
  violet: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  red: 'bg-red-500/20 text-red-300 border border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

const TYPE_BORDER: Record<string, string> = {
  reasoning: 'border-l-violet-500/60',
  tool_call: 'border-l-blue-500/60',
  tool_result: 'border-l-emerald-500/60',
  action: 'border-l-amber-500/60',
  system: 'border-l-gray-600',
  user: 'border-l-blue-400/60',
  error: 'border-l-red-500/60',
}

type BtsItem = {
  id: string
  type: string
  icon: string
  title: string
  detail: string
  timestamp: string
  badge?: string
  badgeColor?: string
}

function msgToBts(msg: ChatMessage): BtsItem {
  const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })

  if (msg.role === 'user') {
    return {
      id: msg.id,
      type: 'user',
      icon: '💬',
      title: msg.source === 'admin_chat' ? 'Admin message' : `Client message`,
      detail: msg.content,
      timestamp: time,
      badge: msg.source === 'admin_chat' ? 'admin' : 'client',
      badgeColor: msg.source === 'admin_chat' ? 'orange' : 'blue',
    }
  }

  const mtype = msg.message_type || 'text'

  if (mtype === 'reasoning') {
    return {
      id: msg.id,
      type: 'reasoning',
      icon: '🧠',
      title: 'AI reasoning',
      detail: msg.content,
      timestamp: time,
      badge: 'reasoning',
      badgeColor: 'violet',
    }
  }

  if (mtype === 'tool_call') {
    return {
      id: msg.id,
      type: 'tool_call',
      icon: '🔧',
      title: msg.tool_name ? `${msg.tool_name}()` : 'Tool call',
      detail: msg.content,
      timestamp: time,
      badge: 'tool',
      badgeColor: 'blue',
    }
  }

  if (mtype === 'tool_result') {
    return {
      id: msg.id,
      type: 'tool_result',
      icon: '✅',
      title: msg.tool_name ? `Result: ${msg.tool_name}` : 'Tool result',
      detail: msg.content,
      timestamp: time,
      badge: 'result',
      badgeColor: 'emerald',
    }
  }

  if (msg.status === 'error') {
    return {
      id: msg.id,
      type: 'error',
      icon: '❌',
      title: 'Error processing message',
      detail: msg.content,
      timestamp: time,
      badge: 'error',
      badgeColor: 'red',
    }
  }

  // Default: text response from assistant
  return {
    id: msg.id,
    type: 'action',
    icon: '💬',
    title: 'Pixel responded',
    detail: msg.content,
    timestamp: time,
    badge: msg.visibility === 'internal' ? 'internal' : 'sent',
    badgeColor: 'emerald',
  }
}

export default function BehindTheScenes({ clientId }: Props) {
  const { messages, sendMessage, isProcessing } = useChat(clientId, 'all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-expand new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastId = messages[messages.length - 1].id
      setExpanded((prev) => new Set([...prev, lastId]))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdminSend(text: string) {
    if (!clientId || !text.trim()) return
    await sendMessage(text, true)
  }

  const items = messages.map(msgToBts)

  return (
    <div className="flex flex-col h-full">
      {/* Feed */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {items.length === 0 && !clientId && (
          <div className="text-center text-gray-600 text-xs pt-8">Select a client to view the AI work feed</div>
        )}
        {items.length === 0 && clientId && (
          <div className="flex items-center gap-2 pl-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500">No messages yet — send one to get started</span>
          </div>
        )}

        {items.map((item) => {
          const isEx = expanded.has(item.id)
          return (
            <div
              key={item.id}
              className={`bts-item pl-3 border-l-2 ${TYPE_BORDER[item.type] ?? 'border-l-gray-600'} cursor-pointer group`}
              onClick={() => toggleExpanded(item.id)}
            >
              <div className="flex items-start justify-between gap-2 py-1">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-xs font-medium">{item.title}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${BADGE_COLORS[item.badgeColor || 'gray']}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isEx && (
                      <div className="mt-1.5 text-[11px] text-gray-400 leading-relaxed font-mono bg-gray-900/40 rounded-lg p-2 border border-gray-800/50 whitespace-pre-wrap animate-slide-up">
                        {item.detail || '(empty)'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-600">{item.timestamp}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-gray-600 transition-transform ${isEx ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}

        {isProcessing && (
          <div className="pl-3 border-l-2 border-l-violet-500/40 py-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚙️</span>
              <span className="text-white text-xs font-medium">Pixel is thinking</span>
              <div className="flex items-center gap-0.5 ml-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-violet-400"
                    style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-2 pt-4 pl-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-500">Live — {isProcessing ? 'processing…' : 'waiting for next message'}</span>
          </div>
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Admin send bar */}
      {clientId && (
        <div className="border-t border-gray-800/60 bg-gray-950/80 px-3 py-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-orange-400 font-medium">ADMIN →</span>
            <span className="text-[10px] text-gray-600">Send as admin (internal visibility)</span>
          </div>
          <ChatInput
            onSend={handleAdminSend}
            loading={isProcessing}
            placeholder="Send admin message…"
          />
        </div>
      )}
    </div>
  )
}
