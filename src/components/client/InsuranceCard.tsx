export default function InsuranceCard() {
  return (
    <div className="p-4 space-y-4">
      {/* Medical - Cigna */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Medical</div>
        <div
          className="relative rounded-2xl p-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a4080 0%, #1565c0 50%, #0a4080 100%)',
            boxShadow: '0 8px 24px rgba(21, 101, 192, 0.3)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Health Insurance</div>
                <div className="text-white font-bold text-lg leading-tight">CIGNA</div>
              </div>
              <div className="bg-white/10 rounded-xl px-2.5 py-1.5 text-right">
                <div className="text-white/60 text-[9px]">Network</div>
                <div className="text-white text-[11px] font-semibold">Open Access Plus</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CardField label="Member Name" value="Leon Kosker" />
              <CardField label="Member ID" value="U79313820 01" />
              <CardField label="Group #" value="3345327" />
              <CardField label="Plan Codes" value="C-19 / C-20" />
              <CardField label="Effective" value="01/01/2023" />
              <CardField label="Customer Svc" value="1-800-244-6224" />
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
              <CostField label="PCP" value="25%" />
              <CostField label="Specialist" value="25%" />
              <CostField label="ER" value="25%" />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <CostField label="INN Ded." value="$4,500" />
              <CostField label="INN OOP Max" value="$6,000" />
            </div>
          </div>
        </div>

        {/* Rx section */}
        <div className="mt-2 bg-gray-900/50 border border-gray-800/50 rounded-xl p-3">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Rx Info</div>
          <div className="grid grid-cols-3 gap-2">
            <CardFieldDark label="RxBIN" value="017010" />
            <CardFieldDark label="RxPCN" value="0215COMM" />
            <CardFieldDark label="RxGroup" value="3345327" />
          </div>
        </div>
      </div>

      {/* Vision - EyeMed */}
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Vision</div>
        <div
          className="relative rounded-2xl p-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a3a2a 0%, #0f5132 50%, #1a3a2a 100%)',
            boxShadow: '0 8px 24px rgba(15, 81, 50, 0.3)',
          }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Vision Insurance</div>
                <div className="text-white font-bold text-lg leading-tight">EyeMed</div>
              </div>
              <div className="bg-white/10 rounded-xl px-2.5 py-1.5 text-right">
                <div className="text-white/60 text-[9px]">Network</div>
                <div className="text-white text-[11px] font-semibold">Insight</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CardField label="Member Name" value="Leon Kosker" />
              <CardField label="Member ID" value="256797197" />
              <CardField label="Group #" value="1027261" />
              <CardField label="Effective" value="03/01/2021" />
              <CardField label="Portal" value="eyemed.com" />
              <CardField label="Member Svc" value="(866) 800-5457" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/50 text-[9px] uppercase tracking-wider">{label}</div>
      <div className="text-white text-[11px] font-semibold mt-0.5">{value}</div>
    </div>
  )
}

function CardFieldDark({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 text-[9px] uppercase tracking-wider">{label}</div>
      <div className="text-white text-[11px] font-mono font-medium mt-0.5">{value}</div>
    </div>
  )
}

function CostField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-white font-bold text-base">{value}</div>
      <div className="text-white/50 text-[9px] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}
