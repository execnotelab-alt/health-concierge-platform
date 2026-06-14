'use client'

import { useState, useRef, useEffect } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey Leon! 👋 I'm Pixel, your health concierge. I've got your care plan loaded and everything looks on track.\n\nQuick heads-up: your eye exam with Kimberly Vang is coming up this **Friday Jun 26 at 2:00 PM** at Total Eyecare Denton. Ready for it?",
    timestamp: '9:41 AM',
  },
  {
    id: '2',
    role: 'user',
    content: "Yes! Thanks for the reminder. Do I need to bring anything?",
    timestamp: '9:42 AM',
  },
  {
    id: '3',
    role: 'assistant',
    content: "Perfect! Here's what to bring:\n\n• Your EyeMed insurance card (Member ID 256797197)\n• Any current glasses or contacts\n• List of questions if you have any\n\nThey're at 3111 Unicorn Lake Blvd, Ste 100, Denton. I've got them on file. See you on the other side! 👁️✨",
    timestamp: '9:42 AM',
  },
  {
    id: '4',
    role: 'user',
    content: "What's coming up after that?",
    timestamp: '9:45 AM',
  },
  {
    id: '5',
    role: 'assistant',
    content: "After your eye exam, here's the queue:\n\n📅 **Sep 25** — Dental cleaning at Divine Dental (Lewisville) @ 2:30 PM\n\n📅 **~Sep 2026** — Annual physical with Dr. Jimenez-Lawson + full-body skin check with Dawn Wells PA-C\n\nI'll start reaching out about the derm and PCP appointments in August so we're ahead of it. You're in good shape! 💪",
    timestamp: '9:45 AM',
  },
]

export default function IPhoneFrame() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend(text: string) {
    if (!text.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Simulate Pixel response
    setTimeout(() => {
      const pixelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Got it! I'm on it 🌿 Let me check your records and get back to you shortly.",
        timestamp: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, pixelMsg])
      setIsTyping(false)
    }, 1800)
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* iPhone outer shell */}
      <div
        className="iphone-frame relative w-[300px] bg-[#1c1c1e] select-none"
        style={{
          borderRadius: '44px',
          padding: '10px',
          boxShadow: `
            inset 0 0 0 2px #3a3a3c,
            0 40px 80px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255,255,255,0.05),
            0 2px 0 rgba(255,255,255,0.08)
          `,
        }}
      >
        {/* Side buttons (decorative) */}
        <div className="absolute left-[-3px] top-[100px] w-[3px] h-[32px] bg-[#3a3a3c] rounded-l" />
        <div className="absolute left-[-3px] top-[144px] w-[3px] h-[56px] bg-[#3a3a3c] rounded-l" />
        <div className="absolute left-[-3px] top-[210px] w-[3px] h-[56px] bg-[#3a3a3c] rounded-l" />
        <div className="absolute right-[-3px] top-[150px] w-[3px] h-[80px] bg-[#3a3a3c] rounded-r" />

        {/* Screen */}
        <div
          className="iphone-screen relative overflow-hidden bg-black"
          style={{
            borderRadius: '38px',
            height: '600px',
          }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <div
              className="bg-black"
              style={{
                width: '110px',
                height: '32px',
                borderRadius: '16px',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-2" style={{ height: '52px' }}>
            <span className="text-white text-xs font-semibold" style={{ paddingTop: '8px' }}>{timeStr}</span>
            <div className="flex items-center gap-1 pt-2">
              {/* Signal */}
              <div className="flex items-end gap-[2px] h-3">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className="w-[3px] bg-white rounded-sm" style={{ height: `${h}px` }} />
                ))}
              </div>
              {/* WiFi */}
              <svg width="15" height="12" viewBox="0 0 15 12" className="text-white fill-current ml-1">
                <path d="M7.5 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3.5c1.1 0 2.1.45 2.83 1.17l1.06-1.06A5.5 5.5 0 0 0 7.5 4.5a5.5 5.5 0 0 0-3.89 1.61l1.06 1.06A3.5 3.5 0 0 1 7.5 6zm0-3.5c2.2 0 4.19.89 5.63 2.34l1.07-1.07A8.5 8.5 0 0 0 7.5 1a8.5 8.5 0 0 0-6.7 3.27l1.07 1.07A6.5 6.5 0 0 1 7.5 2.5z"/>
              </svg>
              {/* Battery */}
              <div className="relative flex items-center ml-1">
                <div className="w-[22px] h-[11px] rounded-[3px] border border-white/70 relative">
                  <div className="absolute inset-[1.5px] right-[1.5px] bg-white rounded-[1.5px]" style={{ right: '3px' }} />
                </div>
                <div className="w-[2px] h-[5px] bg-white/70 rounded-r-sm ml-[1px]" />
              </div>
            </div>
          </div>

          {/* Chat header */}
          <div
            className="absolute left-0 right-0 z-10 flex items-center px-4 pb-2 border-b border-white/5"
            style={{ top: '52px', paddingTop: '8px', background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm shadow">
                  🌿
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#1c1c1e]" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold leading-tight">Pixel</div>
                <div className="text-emerald-400 text-[10px]">Health Concierge • Online</div>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div
            className="absolute left-0 right-0 overflow-y-auto"
            style={{ top: '108px', bottom: '60px', padding: '12px 10px' }}
          >
            <div className="space-y-2">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}

              {isTyping && (
                <div className="flex items-end gap-1.5 animate-slide-up">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs flex-shrink-0">
                    🌿
                  </div>
                  <div className="bg-[#2c2c2e] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex items-center gap-1 h-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gray-400"
                          style={{
                            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: 'rgba(28,28,30,0.95)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '8px',
            }}
          >
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
            />
          </div>
        </div>
      </div>

      {/* Label below */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500 font-medium">Leon Kosker</div>
        <div className="text-[10px] text-gray-600 mt-0.5">Active client • Denton, TX</div>
      </div>
    </div>
  )
}
