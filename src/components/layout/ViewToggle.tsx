'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ViewToggle() {
  const pathname = usePathname()

  return (
    <div className="flex items-center bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
      <Link
        href="/showcase"
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
          pathname === '/showcase'
            ? 'bg-violet-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Showcase
      </Link>
      <Link
        href="/admin"
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
          pathname === '/admin'
            ? 'bg-violet-600 text-white shadow-sm'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Admin
      </Link>
    </div>
  )
}
