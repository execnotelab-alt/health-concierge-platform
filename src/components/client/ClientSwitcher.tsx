'use client'

export default function ClientSwitcher() {
  return (
    <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-gray-800 transition">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
        L
      </div>
      <span className="text-sm text-white font-medium">Leon Kosker</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}
