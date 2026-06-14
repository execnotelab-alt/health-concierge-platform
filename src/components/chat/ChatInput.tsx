'use client'

type ChatInputProps = {
  value: string
  onChange: (v: string) => void
  onSend: (text: string) => void
}

export default function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(value)
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
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="iMessage"
          className="w-full bg-[#3a3a3c] text-white text-[13px] placeholder-gray-500 rounded-full px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
        />
      </div>

      {/* Send / mic button */}
      {value.trim() ? (
        <button
          onClick={() => onSend(value)}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-400 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/>
          </svg>
        </button>
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
