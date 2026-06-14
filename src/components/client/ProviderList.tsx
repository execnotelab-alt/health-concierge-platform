type Provider = {
  name: string
  credentials?: string
  specialty: string
  practice: string
  address?: string
  phone?: string
  lastVisit?: string
  nextDue?: string
  status: 'active' | 'needed' | 'established'
  priority?: 'high' | 'medium' | 'low'
  notes?: string
  icon: string
}

const PROVIDERS: Provider[] = [
  {
    name: 'Dr. Amanda Jimenez-Lawson',
    credentials: 'MD',
    specialty: 'Primary Care (PCP)',
    practice: 'Questcare Medical Clinics — Flower Mound',
    lastVisit: 'Sep 25, 2025',
    nextDue: '~Sep 2026',
    status: 'established',
    priority: 'medium',
    icon: '🩺',
  },
  {
    name: 'Dawn Wells',
    credentials: 'PA-C',
    specialty: 'Dermatology',
    practice: 'U.S. Dermatology Partners — Flower Mound',
    address: '4921 Long Prairie Rd, Ste 110, Flower Mound TX',
    phone: '(469) 931-0944',
    lastVisit: 'Sep 18, 2025',
    nextDue: '~Sep 2026',
    status: 'active',
    priority: 'medium',
    notes: '3 no-shows Mar 2026 — overdue',
    icon: '🔬',
  },
  {
    name: 'Dr. Mehul Shah',
    credentials: 'MD',
    specialty: 'Gastroenterology',
    practice: 'Texas Health Flower Mound GI Lab',
    lastVisit: 'Feb 27, 2026',
    nextDue: '~2036',
    status: 'established',
    priority: 'low',
    notes: 'Colonoscopy clear. 10-yr follow-up.',
    icon: '🏥',
  },
  {
    name: 'Divine Dental',
    specialty: 'Dentist',
    practice: 'Divine Dental — Lewisville',
    address: '966 N Garden Ridge Blvd #510, Lewisville TX 75077',
    nextDue: 'Sep 25, 2026',
    status: 'established',
    priority: 'medium',
    icon: '🦷',
  },
  {
    name: 'Jodie May / Kimberly Vang',
    credentials: 'O.D.',
    specialty: 'Optometry',
    practice: 'Total Eyecare & Eyewear — Denton (#1263)',
    address: '3111 Unicorn Lake Blvd, Ste 100, Denton TX 76210',
    phone: '(940) 891-3937',
    lastVisit: 'Jul 2, 2025',
    nextDue: 'Jun 26, 2026',
    status: 'established',
    priority: 'high',
    notes: 'Eye exam scheduled with Kimberly Vang',
    icon: '👁️',
  },
]

const STATUS_COLORS = {
  active: 'bg-emerald-500/20 text-emerald-300',
  established: 'bg-blue-500/20 text-blue-300',
  needed: 'bg-orange-500/20 text-orange-300',
}

const PRIORITY_COLORS = {
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-500',
}

export default function ProviderList({ clientId }: { clientId?: string | null }) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500">5 providers on file</div>

      {PROVIDERS.map((provider, i) => (
        <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 hover:border-gray-700/50 transition">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
              {provider.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="text-white text-xs font-semibold leading-tight">
                    {provider.name}
                    {provider.credentials && <span className="text-gray-400 font-normal ml-1">{provider.credentials}</span>}
                  </div>
                  <div className="text-violet-300 text-[11px] mt-0.5">{provider.specialty}</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${STATUS_COLORS[provider.status]}`}>
                  {provider.status}
                </span>
              </div>

              <div className="text-gray-400 text-[11px] mt-1">{provider.practice}</div>
              {provider.address && (
                <div className="text-gray-500 text-[10px] mt-0.5">{provider.address}</div>
              )}
              {provider.phone && (
                <div className="text-gray-500 text-[10px]">{provider.phone}</div>
              )}

              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-800/30">
                {provider.lastVisit && (
                  <div className="text-[10px]">
                    <span className="text-gray-600">Last: </span>
                    <span className="text-gray-400">{provider.lastVisit}</span>
                  </div>
                )}
                {provider.nextDue && (
                  <div className="text-[10px]">
                    <span className="text-gray-600">Due: </span>
                    <span className={provider.priority === 'high' ? 'text-orange-300 font-semibold' : 'text-gray-400'}>
                      {provider.nextDue}
                    </span>
                  </div>
                )}
              </div>

              {provider.notes && (
                <div className="text-[10px] text-gray-500 mt-1 italic">{provider.notes}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
