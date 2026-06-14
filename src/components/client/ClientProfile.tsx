export default function ClientProfile({ clientId }: { clientId?: string | null }) {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
          L
        </div>
        <div>
          <div className="text-white font-semibold text-base">Leon Kosker</div>
          <div className="text-emerald-400 text-xs font-medium">Active client</div>
          <div className="text-gray-500 text-xs mt-0.5">Age 38 • Male • Denton, TX</div>
        </div>
      </div>

      {/* Personal Info */}
      <InfoSection title="Personal Info" icon="👤">
        <InfoRow label="DOB" value="May 11, 1988 (Age 38)" />
        <InfoRow label="Phone" value="814-525-4900" />
        <InfoRow label="Email" value="koskerleon@gmail.com" />
        <InfoRow label="Address" value="1513 Parker Stone Blvd, Denton TX 76210" />
        <InfoRow label="Channel" value="Telegram → Concierge01" />
      </InfoSection>

      {/* Health Baseline */}
      <InfoSection title="Health Baseline" icon="💪">
        <InfoRow label="Exercise" value="CrossFit 3-5x/week" />
        <InfoRow label="Medications" value="None" />
        <InfoRow label="Supplements" value="None" />
        <InfoRow label="Allergies" value="Cats; mild seasonal (TX)" />
        <InfoRow label="Family Hx" value="Unknown" />
      </InfoSection>

      {/* Known Conditions */}
      <InfoSection title="Conditions & History" icon="📋">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <div className="text-emerald-300 text-xs font-medium mb-1">✅ Resolved</div>
          <div className="text-gray-300 text-xs">Digestive health concern — Colonoscopy 02/27/2026 came back clear (Dr. Mehul Shah)</div>
        </div>
      </InfoSection>

      {/* Health Goals */}
      <InfoSection title="Health Goals" icon="🎯">
        <div className="space-y-1.5">
          {[
            'Stay on top of preventive care',
            'Manage stress',
            'Keep getting stronger (CrossFit 3-5x/week)',
          ].map((goal, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
              <span className="text-gray-300 text-xs">{goal}</span>
            </div>
          ))}
        </div>
      </InfoSection>

      {/* Scheduling Prefs */}
      <InfoSection title="Scheduling Preferences" icon="⚙️">
        <InfoRow label="Times" value="Mornings preferred" />
        <InfoRow label="Avoid" value="None" />
        <InfoRow label="Max drive" value="~20 min from Denton" />
        <InfoRow label="Calendar" value="None — conversational only" />
      </InfoSection>

      {/* Onboarding status */}
      <InfoSection title="Onboarding Status" icon="📊">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Completion</span>
            <span className="text-emerald-400 font-semibold">85%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '85%' }} />
          </div>
          <div className="text-gray-500 text-[10px] mt-1">Pending: nudge style preference</div>
        </div>
      </InfoSection>
    </div>
  )
}

function InfoSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-sm">{icon}</span>
        <span className="text-white text-xs font-semibold">{title}</span>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1 border-b border-gray-800/30 last:border-0">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <span className="text-gray-300 text-xs text-right">{value}</span>
    </div>
  )
}
