'use client'

import ViewToggle from './ViewToggle'
import ClientSwitcher from '@/components/client/ClientSwitcher'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TopNav() {
  const router = useRouter()
  const supabase = createClient()

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

      {/* Right: Client switcher + sign out */}
      <div className="flex items-center gap-3">
        <ClientSwitcher />
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
