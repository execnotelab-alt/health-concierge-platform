'use client'

import { useState } from 'react'

type Rule = {
  id: string
  category: string
  name: string
  description: string
  rule_text: string
  enabled: boolean
  priority: number
}

const DEMO_RULES: Rule[] = [
  {
    id: '1',
    category: 'security',
    name: 'No Portal Credentials in Chat',
    description: 'Never ask for login credentials through any chat interface',
    rule_text: 'Never ask for usernames or passwords in chat — not Telegram, not webchat, not anywhere. If a portal requires login, first check if credentials are already on file in the provider\'s record. If not on file: skip the portal and go directly to the provider\'s public website to find scheduling options.',
    enabled: true,
    priority: 100,
  },
  {
    id: '2',
    category: 'scheduling',
    name: 'Website First, Zocdoc Last',
    description: 'Always check provider website before marketplace tools',
    rule_text: 'Always check in this order: (1) Provider\'s own website / native scheduling tool, (2) Provider\'s patient portal if creds are on file, (3) Zocdoc or other marketplace sites — last resort only. Never lead with Zocdoc. It may show partial availability and miss days/slots that the provider\'s own system has.',
    enabled: true,
    priority: 90,
  },
  {
    id: '3',
    category: 'communication',
    name: 'One Question at a Time',
    description: 'Never dump multiple questions in a single message during intake',
    rule_text: 'Warm, conversational, one question at a time. Never dump a wall of questions. During intake, ask one question, wait for the answer, update the relevant file, then ask the next question.',
    enabled: true,
    priority: 80,
  },
  {
    id: '4',
    category: 'scheduling',
    name: 'Conversational Scheduling Only',
    description: 'Propose appointment slots conversationally, no automated calendar writes',
    rule_text: 'No calendar integration. Propose slots conversationally (e.g., "How about Tuesday at 10am or Wednesday at 9am?"), Leo confirms, then follow up with confirmation details. Never write to calendar automatically.',
    enabled: true,
    priority: 70,
  },
  {
    id: '5',
    category: 'general',
    name: 'Proactive Health Scan',
    description: 'Weekly review of care plan to surface due/overdue items',
    rule_text: 'Every Monday at 9am CT, review care-plan.md and surface anything due or overdue to Leon. Format as a brief, friendly summary — not an alarm. Example: "Hey Leon! Quick check-in: your derm visit is coming up in September. Want me to start looking at times?"',
    enabled: true,
    priority: 60,
  },
  {
    id: '6',
    category: 'general',
    name: 'Post-Appointment Follow-Up',
    description: 'Follow up 3 days after any scheduled appointment',
    rule_text: 'Three days after any scheduled appointment, send a follow-up message: "Hey! How did [appointment type] go? Want to log the outcome and set the next due date." Then update history.md and care-plan.md based on Leon\'s response.',
    enabled: true,
    priority: 50,
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  security: 'bg-red-500/20 text-red-300 border border-red-500/20',
  scheduling: 'bg-blue-500/20 text-blue-300 border border-blue-500/20',
  communication: 'bg-violet-500/20 text-violet-300 border border-violet-500/20',
  general: 'bg-gray-700 text-gray-300',
}

const CATEGORY_ICONS: Record<string, string> = {
  security: '🔒',
  scheduling: '📅',
  communication: '💬',
  general: '⚙️',
}

export default function RulesList() {
  const [rules, setRules] = useState(DEMO_RULES)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Operational Rules</h3>
          <p className="text-gray-400 text-xs mt-0.5">Rules that govern how Pixel operates</p>
        </div>
        <button className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-xl transition font-medium">
          + Add Rule
        </button>
      </div>

      <div className="divide-y divide-gray-800/50">
        {rules.map((rule) => (
          <div key={rule.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              {/* Toggle */}
              <div className="flex-shrink-0 mt-0.5">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    rule.enabled ? 'bg-violet-600' : 'bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={rule.enabled}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                      rule.enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
                    }`}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{rule.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[rule.category]}`}>
                        {CATEGORY_ICONS[rule.category]} {rule.category}
                      </span>
                      {!rule.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-800 text-gray-500">
                          disabled
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-gray-600 text-xs">P{rule.priority}</span>
                    <button
                      onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                      className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-transform ${expandedId === rule.id ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    <button className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedId === rule.id && (
                  <div className="mt-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/40 animate-slide-up">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Rule Text</div>
                    <p className="text-gray-300 text-xs leading-relaxed">{rule.rule_text}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
