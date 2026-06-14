'use client'

import { useState } from 'react'
import IPhoneFrame from '@/components/chat/IPhoneFrame'
import BehindTheScenes from '@/components/chat/BehindTheScenes'
import ClientProfile from '@/components/client/ClientProfile'
import InsuranceCard from '@/components/client/InsuranceCard'
import ProviderList from '@/components/client/ProviderList'
import AppointmentList from '@/components/client/AppointmentList'
import CarePlan from '@/components/client/CarePlan'
import ClientSwitcher from '@/components/client/ClientSwitcher'
import { useClient } from '@/lib/hooks/useClient'

type Tab = 'profile' | 'insurance' | 'providers' | 'appointments' | 'careplan'

export default function ShowcaseView() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  const { clients, selectedClient, setSelectedClient } = useClient()

  const clientId = selectedClient?.id ?? null
  const clientName = selectedClient
    ? `${selectedClient.first_name} ${selectedClient.last_name}`
    : 'No client'
  const clientLocation = selectedClient
    ? [selectedClient.address_city, selectedClient.address_state].filter(Boolean).join(', ')
    : ''

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'insurance', label: 'Insurance', icon: '🪪' },
    { id: 'providers', label: 'Providers', icon: '👨‍⚕️' },
    { id: 'appointments', label: 'Appts', icon: '📅' },
    { id: 'careplan', label: 'Care Plan', icon: '📋' },
  ]

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Left: iPhone Frame (~1/3) */}
      <div className="w-[380px] flex-shrink-0 flex items-center justify-center py-6 px-4 bg-gray-950/50 border-r border-gray-800/50">
        <IPhoneFrame clientId={clientId} clientName={clientName} clientLocation={clientLocation} />
      </div>

      {/* Right: BTS + Info Panel (~2/3) */}
      <div className="flex-1 flex overflow-hidden">
        {/* BTS feed */}
        <div className={`flex-1 overflow-hidden flex flex-col ${infoPanelOpen ? '' : 'flex-1'}`}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">Behind the Scenes</span>
                <span className="text-xs text-gray-500">— AI work feed</span>
              </div>
              {/* Client switcher in BTS header */}
              <ClientSwitcher
                clients={clients}
                selectedClient={selectedClient}
                onSelect={setSelectedClient}
              />
            </div>
            <button
              onClick={() => setInfoPanelOpen(!infoPanelOpen)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition"
            >
              {infoPanelOpen ? 'Hide info ›' : '‹ Show info'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <BehindTheScenes clientId={clientId} />
          </div>
        </div>

        {/* Client Info Panel */}
        {infoPanelOpen && (
          <div className="w-[340px] flex-shrink-0 border-l border-gray-800/60 flex flex-col">
            {/* Tab bar */}
            <div className="flex items-center gap-0.5 px-2 py-2 border-b border-gray-800/60 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'profile' && <ClientProfile clientId={clientId} />}
              {activeTab === 'insurance' && <InsuranceCard clientId={clientId} />}
              {activeTab === 'providers' && <ProviderList clientId={clientId} />}
              {activeTab === 'appointments' && <AppointmentList clientId={clientId} />}
              {activeTab === 'careplan' && <CarePlan clientId={clientId} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
