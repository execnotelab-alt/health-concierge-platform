'use client'

import { useState, useEffect, useMemo } from 'react'
import ViewToggle from './ViewToggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name)
      } else if (user?.email) {
        setUserName(user.email.split('@')[0])
      }
    }
    getUser()
  }, [supabase])

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-gray-950/80 backdrop-blur border-b border-gray-800/60">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center shadow shadow-violet-500/30">
          <span className="text-sm">🌿</span>
        </div>
        <div>
          <span className="font-semibold text-white text-sm">Health Concierge</span>
          <span className="text-gray-500 text-xs ml-1">by Pixel</span>
        </div>
      </div>

      {/* Center: View toggle */}
      <ViewToggle />

      {/* Right: User info + sign out */}
      <div className="flex items-center gap-3">
        {userName && (
          <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="text-sm text-white font-medium">{userName}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
