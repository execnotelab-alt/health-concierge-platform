'use client'

import { useState } from 'react'

type ChatInputProps = {
  onSend: (text: string) => void | Promise<void>
  placeholder?: string
  loading?: boolean
  /** If provided, component acts as controlled input */
  value?: string
  onChange?: (v: string) => void
}

export default function ChatInput({ onSend, placeholder = 'iMessage', loading = false, value: controlledValue, onChange }: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('')

  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = onChange !== undefined ? onChange : setInternalValue

  async function handleSend() {
    const text = value.trim()
    if (!text || loading) return
    setValue('')
    await onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Camera icon (iOS style) */}
      <button className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3a3a3c] flex items-center justify-center text-gray-400 hover:bg-[#4a4a4c] transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {/* Input */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Pixel is typing…' : placeholder}
          disabled={loading}
          className="w-full bg-[#3a3a3c] text-white text-[13px] placeholder-gray-500 rounded-full px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-60"
        />
      </div>

      {/* Send / mic button */}
      {value.trim() && !loading ? (
        <button
          onClick={handleSend}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-400 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
      ) : loading ? (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3a3a3c] flex items-center justify-center">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-gray-400"
                style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <button className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3a3a3c] flex items-center justify-center text-gray-400 hover:bg-[#4a4a4c] transition">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        </button>
      )}
    </div>
  )
}
