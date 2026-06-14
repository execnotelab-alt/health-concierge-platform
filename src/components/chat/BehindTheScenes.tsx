'use client'

import { useState } from 'react'

type BTSItem = {
  id: string
  type: 'reasoning' | 'tool_call' | 'tool_result' | 'action' | 'system'
  icon: string
  title: string
  detail: string
  timestamp: string
  expanded?: boolean
  badge?: string
  badgeColor?: string
}

const BTS_FEED: BTSItem[] = [
  {
    id: '1',
    type: 'system',
    icon: '🌿',
    title: 'Pixel started session',
    detail: 'Loaded Leon Kosker profile, care plan, and provider directory. Session context ready.',
    timestamp: '9:41:02 AM',
    badge: 'init',
    badgeColor: 'gray',
  },
  {
    id: '2',
    type: 'reasoning',
    icon: '🧠',
    title: 'Thinking: What does Leon need to know?',
    detail: 'Checking care plan... Eye exam Jun 26 is most urgent. Dental Sep 25 further out. Annual physical ~Sep 2026. Derm overdue. Lead with eye exam since it\'s this Friday.',
    timestamp: '9:41:04 AM',
    badge: 'reasoning',
    badgeColor: 'violet',
  },
  {
    id: '3',
    type: 'tool_call',
    icon: '🔧',
    title: 'read_file("health-concierge/care-plan.md")',
    detail: '{"path": "health-concierge/care-plan.md"}\n→ Read 4.2KB, found 2 scheduled appointments, 3 upcoming items',
    timestamp: '9:41:05 AM',
    badge: 'tool',
    badgeColor: 'blue',
  },
  {
    id: '4',
    type: 'tool_result',
    icon: '✅',
    title: 'File read complete',
    detail: 'care-plan.md loaded. Eye exam Jun 26 @ 2:00 PM confirmed scheduled. Dental Sep 25 @ 2:30 PM confirmed.',
    timestamp: '9:41:05 AM',
    badge: 'result',
    badgeColor: 'emerald',
  },
  {
    id: '5',
    type: 'action',
    icon: '💬',
    title: 'Composing message to Leon',
    detail: 'Sent welcome + eye exam reminder. Including appointment details, location, and insurance info (EyeMed Member ID 256797197).',
    timestamp: '9:41:06 AM',
    badge: 'sent',
    badgeColor: 'emerald',
  },
  {
    id: '6',
    type: 'reasoning',
    icon: '🧠',
    title: 'Leon asked: "What should I bring?"',
    detail: 'Looking up EyeMed insurance details and Total Eyecare appointment specifics. No fasting required. Bring current glasses/contacts.',
    timestamp: '9:42:12 AM',
    badge: 'reasoning',
    badgeColor: 'violet',
  },
  {
    id: '7',
    type: 'tool_call',
    icon: '🔧',
    title: 'read_file("health-concierge/profile.md")',
    detail: '{"path": "health-concierge/profile.md", "section": "vision_insurance"}\n→ Found EyeMed Insight Network Member ID 256797197',
    timestamp: '9:42:13 AM',
    badge: 'tool',
    badgeColor: 'blue',
  },
  {
    id: '8',
    type: 'action',
    icon: '💬',
    title: 'Sent prep checklist to Leon',
    detail: 'EyeMed card, glasses/contacts, address confirmed: 3111 Unicorn Lake Blvd Ste 100 Denton TX 76210.',
    timestamp: '9:42:14 AM',
    badge: 'sent',
    badgeColor: 'emerald',
  },
  {
    id: '9',
    type: 'reasoning',
    icon: '🧠',
    title: 'Leon asked: "What\'s coming up after that?"',
    detail: 'Pulling full appointment queue from care plan. Dental Sep 25, Annual Physical ~Sep 2026, Derm ~Sep 2026. Plan to proactively reach out in August for the latter two.',
    timestamp: '9:45:30 AM',
    badge: 'reasoning',
    badgeColor: 'violet',
  },
  {
    id: '10',
    type: 'action',
    icon: '💬',
    title: 'Sent appointment queue summary',
    detail: 'Dental Sep 25 → Annual Physical Sep 2026 → Derm Sep 2026. Set internal flag to schedule derm + PCP outreach in August.',
    timestamp: '9:45:32 AM',
    badge: 'sent',
    badgeColor: 'emerald',
  },
  {
    id: '11',
    type: 'system',
    icon: '📝',
    title: 'Session context saved',
    detail: 'No changes to care-plan.md needed. Next cron check: Monday 9:00 AM CT (weekly health scan).',
    timestamp: '9:45:35 AM',
    badge: 'done',
    badgeColor: 'gray',
  },
]

const BADGE_COLORS: Record<string, string> = {
  gray: 'bg-gray-700 text-gray-300',
  violet: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
}

const TYPE_COLORS: Record<string, string> = {
  reasoning: 'border-l-violet-500/60',
  tool_call: 'border-l-blue-500/60',
  tool_result: 'border-l-emerald-500/60',
  action: 'border-l-amber-500/60',
  system: 'border-l-gray-600',
}

export default function BehindTheScenes() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['2', '5']))

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-4 space-y-2">
      {BTS_FEED.map((item) => {
        const isExpanded = expanded.has(item.id)
        return (
          <div
            key={item.id}
            className={`bts-item pl-3 border-l-2 ${TYPE_COLORS[item.type]} cursor-pointer group`}
            onClick={() => toggleExpanded(item.id)}
          >
            <div className="flex items-start justify-between gap-2 py-1">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-xs font-medium">{item.title}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${BADGE_COLORS[item.badgeColor || 'gray']}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-1.5 text-[11px] text-gray-400 leading-relaxed font-mono bg-gray-900/40 rounded-lg p-2 border border-gray-800/50 whitespace-pre-wrap animate-slide-up">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-gray-600">{item.timestamp}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        )
      })}

      {/* Live indicator */}
      <div className="flex items-center gap-2 pt-4 pl-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500">Live — waiting for next message</span>
        </div>
      </div>
    </div>
  )
}
