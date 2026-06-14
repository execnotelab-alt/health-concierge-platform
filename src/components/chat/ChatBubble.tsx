type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Simple markdown-ish parser: bold **text**, newlines
  function renderContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Bold text: **text**
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
          )}
          {i < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div
          className="max-w-[75%] text-white text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-br-sm"
          style={{ background: 'linear-gradient(135deg, #007AFF, #0055D4)' }}
        >
          {renderContent(message.content)}
          <div className="text-[10px] text-blue-200/60 mt-1 text-right">{message.timestamp}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1.5 animate-slide-up">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs flex-shrink-0">
        🌿
      </div>
      <div
        className="max-w-[80%] text-white text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-bl-sm"
        style={{ background: '#2c2c2e' }}
      >
        {renderContent(message.content)}
        <div className="text-[10px] text-gray-500 mt-1">{message.timestamp}</div>
      </div>
    </div>
  )
}
