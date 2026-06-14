'use client'

import { useState } from 'react'
import RulesList from '@/components/admin/RulesList'

const CRON_JOBS = [
  { name: 'Weekly Health Scan', schedule: 'Mon 9:00 AM CT', status: 'active' as const, lastRun: '2 days ago', nextRun: 'Tomorrow' },
  { name: 'Monthly Self-Check Reminder', schedule: '1st of month', status: 'active' as const, lastRun: 'Jun 1', nextRun: 'Jul 1' },
  { name: 'Pre-Appointment Prep', schedule: 'Day before appt', status: 'active' as const, lastRun: 'N/A', nextRun: 'Jun 25' },
  { name: 'Post-Appointment Follow-Up', schedule: '3 days after appt', status: 'active' as const, lastRun: 'N/A', nextRun: 'Jun 29' },
  { name: 'Flu Shot Reminder', schedule: 'Sep 15 annually', status: 'idle' as const, lastRun: 'Sep 15, 2025', nextRun: 'Sep 15, 2026' },
  { name: 'Insurance Open Enrollment', schedule: 'Nov 1 annually', status: 'idle' as const, lastRun: 'Nov 1, 2025', nextRun: 'Nov 1, 2026' },
]

export default function AdminView() {
  const [cronExpanded, setCronExpanded] = useState(false)

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
              <ConfigRow label="Data Storage" value="Supabase" />
            </div>
          </div>

          {/* Cron Jobs Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <button
              onClick={() => setCronExpanded(!cronExpanded)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm">⏱️</span>
                </div>
                <h3 className="font-semibold text-white">Scheduled Jobs</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">{CRON_JOBS.filter(j => j.status === 'active').length} active</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-500 transition-transform duration-200 ${cronExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {cronExpanded && (
              <div className="mt-4 space-y-2">
                {CRON_JOBS.map((job) => (
                  <div key={job.name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-800/40 border border-gray-700/30">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        job.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'
                      }`} />
                      <div>
                        <div className="text-sm text-white font-medium">{job.name}</div>
                        <div className="text-[10px] text-gray-500">{job.schedule}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Next: {job.nextRun}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Clients Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 cursor-pointer hover:border-gray-700 transition">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
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

          {/* Platform Overview Card (multi-client focused) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <h3 className="font-semibold text-white">Platform Overview</h3>
            </div>
            <div className="space-y-3">
              <OverviewRow label="Appointments This Month" value="1" accent="orange" />
              <OverviewRow label="Overdue Items" value="0" accent="green" />
              <OverviewRow label="Pending Intake Steps" value="2" accent="yellow" />
              <OverviewRow label="Providers on File" value="5" accent="blue" />
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/50">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Next Actions (All Clients)</div>
              <div className="space-y-1.5">
                <ActionItem client="Leon K." action="Eye Exam" date="Jun 26" />
                <ActionItem client="Leon K." action="Dental Cleaning" date="Sep 25" />
                <ActionItem client="Leon K." action="Annual Physical" date="~Sep" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

function OverviewRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, string> = {
    green: 'text-emerald-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  }
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-bold ${colors[accent] || 'text-white'}`}>{value}</span>
    </div>
  )
}

function ActionItem({ client, action, date }: { client: string; action: string; date: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{client}</span>
        <span className="text-gray-300">{action}</span>
      </div>
      <span className="text-gray-500">{date}</span>
    </div>
  )
}
