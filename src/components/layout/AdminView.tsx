import RulesList from '@/components/admin/RulesList'

export default function AdminView() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Configure operational rules and system settings for Pixel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules panel - takes up 2/3 */}
        <div className="lg:col-span-2">
          <RulesList />
        </div>

        {/* Config panel - 1/3 */}
        <div className="space-y-4">
          {/* System Config Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-sm">⚙️</span>
              </div>
              <h3 className="font-semibold text-white">System Config</h3>
            </div>
            <div className="space-y-3">
              <ConfigRow label="AI Model" value="Claude Sonnet 4" />
              <ConfigRow label="Channel" value="Telegram Concierge01" />
              <ConfigRow label="Nudge Mode" value="Proactive" />
              <ConfigRow label="Cron Jobs" value="Active" badge="green" />
              <ConfigRow label="Data Storage" value="Supabase" />
            </div>
          </div>

          {/* Active Clients Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-sm">👥</span>
              </div>
              <h3 className="font-semibold text-white">Active Clients</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">1</div>
              <div className="text-right">
                <div className="text-sm text-emerald-400 font-medium">Leon Kosker</div>
                <div className="text-xs text-gray-500">Onboarding 85% complete</div>
              </div>
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-sm">📅</span>
              </div>
              <h3 className="font-semibold text-white">Upcoming</h3>
            </div>
            <div className="space-y-2.5">
              <UpcomingItem
                date="Jun 26"
                label="Eye Exam — Kimberly Vang"
                urgency="soon"
              />
              <UpcomingItem
                date="Sep 25"
                label="Dental — Divine Dental"
                urgency="later"
              />
              <UpcomingItem
                date="Sep 2026"
                label="Annual Physical — Dr. Jimenez-Lawson"
                urgency="later"
              />
              <UpcomingItem
                date="Sep 2026"
                label="Derm Check — Dawn Wells PA-C"
                urgency="later"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {badge === 'green' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
        <span className="text-white text-sm font-medium">{value}</span>
      </div>
    </div>
  )
}

function UpcomingItem({ date, label, urgency }: { date: string; label: string; urgency: 'soon' | 'later' }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`text-xs font-bold px-2 py-1 rounded-lg min-w-[44px] text-center ${
        urgency === 'soon' ? 'bg-orange-500/20 text-orange-300' : 'bg-gray-800 text-gray-400'
      }`}>
        {date}
      </div>
      <span className="text-sm text-gray-300 leading-tight pt-0.5">{label}</span>
    </div>
  )
}
