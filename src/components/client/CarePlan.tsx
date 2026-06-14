type CarePlanItem = {
  name: string
  frequency: string
  lastCompleted?: string
  nextDue: string
  status: 'scheduled' | 'upcoming' | 'overdue' | 'pending' | 'future'
  provider?: string
  notes?: string
}

const CARE_PLAN: CarePlanItem[] = [
  {
    name: 'Eye Exam',
    frequency: 'Annual',
    lastCompleted: 'Jul 2, 2025',
    nextDue: 'Jun 26, 2026',
    status: 'scheduled',
    provider: 'Kimberly Vang — Total Eyecare Denton',
  },
  {
    name: 'Dental Cleaning',
    frequency: 'Every 6 months',
    nextDue: 'Sep 25, 2026',
    status: 'scheduled',
    provider: 'Divine Dental — Lewisville',
  },
  {
    name: 'Dermatology Skin Check',
    frequency: 'Annual',
    lastCompleted: 'Sep 18, 2025',
    nextDue: '~Sep 2026',
    status: 'upcoming',
    provider: 'Dawn Wells PA-C — U.S. Derm Flower Mound',
    notes: '3 no-shows Mar 2026 — schedule Aug 2026',
  },
  {
    name: 'Annual Physical (PCP)',
    frequency: 'Annual',
    lastCompleted: 'Sep 25, 2025',
    nextDue: '~Sep 2026',
    status: 'upcoming',
    provider: 'Dr. Jimenez-Lawson — Questcare Flower Mound',
  },
  {
    name: 'Fasting Blood Panel',
    frequency: 'Annual',
    nextDue: 'At PCP visit',
    status: 'pending',
    notes: 'Order at annual physical',
  },
  {
    name: 'Cholesterol (Lipid Panel)',
    frequency: 'Every 4-6 years',
    nextDue: 'Discuss at physical',
    status: 'pending',
  },
  {
    name: 'Blood Glucose / A1C',
    frequency: 'Every 3 years (age 35+)',
    nextDue: 'Discuss at physical',
    status: 'pending',
  },
  {
    name: 'Flu Shot',
    frequency: 'Annual (fall)',
    nextDue: 'Fall 2026',
    status: 'upcoming',
    notes: 'Reminder set for Sep 15',
  },
  {
    name: 'Tetanus / Tdap Booster',
    frequency: 'Every 10 years',
    nextDue: 'TBD — check at PCP',
    status: 'pending',
  },
]

const MILESTONES = [
  { name: 'Baseline Cardiac Risk Assessment', triggerAge: 40, currentAge: 38, yearsOut: 2 },
  { name: 'Colorectal Cancer Screening', triggerAge: 45, currentAge: 38, yearsOut: 7 },
  { name: 'Lung Cancer Screening', triggerAge: 50, currentAge: 38, yearsOut: 12, note: 'Only if smoking history' },
]

const STATUS_STYLES = {
  scheduled: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', label: '🟢 Scheduled' },
  upcoming: { dot: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', label: '🟡 Coming due' },
  overdue: { dot: 'bg-red-400', badge: 'bg-red-500/20 text-red-300', label: '🔴 Overdue' },
  pending: { dot: 'bg-gray-500', badge: 'bg-gray-700 text-gray-400', label: '⏳ Pending' },
  future: { dot: 'bg-blue-400', badge: 'bg-blue-500/20 text-blue-300', label: '🔮 Future' },
}

export default function CarePlan({ clientId }: { clientId?: string | null }) {
  return (
    <div className="p-4 space-y-4">
      {/* Active care items */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Care Schedule</div>
        <div className="space-y-2">
          {CARE_PLAN.map((item, i) => {
            const s = STATUS_STYLES[item.status]
            return (
              <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold">{item.name}</div>
                      <div className="text-gray-500 text-[10px]">{item.frequency}</div>
                      {item.provider && (
                        <div className="text-gray-400 text-[10px] mt-0.5">{item.provider}</div>
                      )}
                      {item.notes && (
                        <div className="text-gray-600 text-[10px] mt-0.5 italic">{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-gray-300 text-[11px] font-medium">{item.nextDue}</div>
                    {item.lastCompleted && (
                      <div className="text-gray-600 text-[9px]">Last: {item.lastCompleted}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Age milestones */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Age Milestones</div>
        <div className="space-y-2">
          {MILESTONES.map((m, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 flex items-center gap-3">
              <div className="text-center min-w-[36px]">
                <div className="text-white font-bold text-lg">{m.triggerAge}</div>
                <div className="text-gray-600 text-[9px]">age</div>
              </div>
              <div className="flex-1">
                <div className="text-white text-xs font-semibold">{m.name}</div>
                {m.note && <div className="text-gray-500 text-[10px] italic">{m.note}</div>}
              </div>
              <div className="text-gray-500 text-[10px] text-right">
                <span className="text-gray-400 font-medium">{m.yearsOut}y</span> out
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Self-monitoring */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Monthly Self-Monitoring</div>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 space-y-1.5">
          {['Testicular Self-Exam', 'Skin Self-Check (new moles, changes)', 'Weight Tracking'].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
              <span className="text-gray-400 text-xs">{item}</span>
              <span className="text-gray-600 text-[10px] ml-auto">Not tracked</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
