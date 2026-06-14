type Appointment = {
  date: string
  time: string
  provider: string
  type: string
  location: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'overdue'
  insurance?: string
  notes?: string
}

const UPCOMING: Appointment[] = [
  {
    date: 'Fri Jun 26, 2026',
    time: '2:00 PM',
    provider: 'Kimberly Vang',
    type: 'Eye Exam for Glasses',
    location: 'Total Eyecare & Eyewear — Denton',
    status: 'scheduled',
    insurance: 'EyeMed (Member ID 256797197)',
    notes: 'Booked via aegvision.com',
  },
  {
    date: 'Fri Sep 25, 2026',
    time: '2:30 PM',
    provider: 'Divine Dental',
    type: 'Dental Cleaning',
    location: 'Divine Dental — Lewisville',
    status: 'scheduled',
  },
]

const HISTORY: Appointment[] = [
  {
    date: 'Mar 18, 2026',
    time: '—',
    provider: 'Dawn Wells, PA-C',
    type: 'Dermatology',
    location: 'U.S. Derm Flower Mound',
    status: 'cancelled',
    notes: '3 cancelled/no-show — overdue',
  },
  {
    date: 'Feb 27, 2026',
    time: '—',
    provider: 'Dr. Mehul Shah',
    type: 'Colonoscopy (Surgery)',
    location: 'Texas Health FM GI Lab',
    status: 'completed',
    notes: '✅ Clear — next due ~2036',
  },
  {
    date: 'Sep 26, 2025',
    time: '—',
    provider: 'Dr. Amanda Jimenez-Lawson',
    type: 'Lab Only Visit',
    location: 'Questcare Flower Mound',
    status: 'completed',
    notes: 'GI referral issued',
  },
  {
    date: 'Sep 25, 2025',
    time: '—',
    provider: 'Dr. Amanda Jimenez-Lawson',
    type: 'New Patient Visit',
    location: 'Questcare Flower Mound',
    status: 'completed',
  },
  {
    date: 'Sep 18, 2025',
    time: '—',
    provider: 'Dawn Wells, PA-C',
    type: 'Full-Body Skin Check',
    location: 'U.S. Derm Flower Mound',
    status: 'completed',
  },
]

const STATUS_STYLES = {
  scheduled: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
  completed: 'bg-gray-800 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-300',
  overdue: 'bg-orange-500/20 text-orange-300',
}

const STATUS_DOTS = {
  scheduled: 'bg-emerald-400',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-400',
  overdue: 'bg-orange-400',
}

export default function AppointmentList({ clientId }: { clientId?: string | null }) {
  return (
    <div className="p-4 space-y-4">
      {/* Upcoming */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Upcoming</div>
        <div className="space-y-2">
          {UPCOMING.map((appt, i) => (
            <AppointmentCard key={i} appt={appt} />
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">History</div>
        <div className="space-y-2">
          {HISTORY.map((appt, i) => (
            <AppointmentCard key={i} appt={appt} compact />
          ))}
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ appt, compact }: { appt: Appointment; compact?: boolean }) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 ${compact ? '' : 'hover:border-gray-700/50 transition'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${STATUS_DOTS[appt.status]}`} />
          <div>
            <div className="text-white text-xs font-semibold">{appt.type}</div>
            <div className="text-gray-400 text-[11px] mt-0.5">{appt.provider}</div>
            <div className="text-gray-500 text-[10px]">{appt.location}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-white text-[11px] font-medium">{appt.date}</div>
          {appt.time !== '—' && (
            <div className="text-violet-400 text-[11px] font-semibold">{appt.time}</div>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${STATUS_STYLES[appt.status]}`}>
            {appt.status}
          </span>
        </div>
      </div>

      {(appt.insurance || appt.notes) && !compact && (
        <div className="mt-2 pt-2 border-t border-gray-800/30 space-y-0.5">
          {appt.insurance && <div className="text-gray-500 text-[10px]">🪪 {appt.insurance}</div>}
          {appt.notes && <div className="text-gray-500 text-[10px]">{appt.notes}</div>}
        </div>
      )}
      {appt.notes && compact && (
        <div className="text-gray-600 text-[10px] mt-1">{appt.notes}</div>
      )}
    </div>
  )
}
