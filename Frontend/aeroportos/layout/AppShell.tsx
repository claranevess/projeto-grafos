import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '@shared/TopBar'
import { BridgeAlert } from '@shared/BridgeAlert'
import { SidePanel } from '@aeroportos/panels/SidePanel'
import { MapCanvas } from '@aeroportos/viz/MapCanvas'
import { AlgorithmDial } from '@aeroportos/controls/AlgorithmDial'
import { DashboardOverlay } from '@aeroportos/panels/DashboardOverlay'
import { useAnimationLoop } from '@/hooks/useAnimation'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function AppShell() {
  useAnimationLoop()
  const navigate = useNavigate()
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const { source, target } = useStore(s => ({ source: s.source, target: s.target }))

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TopBar title="Rede de Aeroportos do Brasil" part="Parte 1">
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3 text-[11px] font-mono"
          onClick={() => navigate('/')}
        >
          Voltar ao menu
        </Button>
        {source && target && (
          <Badge variant="outline" className="text-[10px] font-mono border-[var(--border)] text-[var(--path-highlight)]">
            {source} → {target}
          </Badge>
        )}
      </TopBar>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <SidePanel />

        <main className="flex-1 relative overflow-hidden min-h-0">
          <MapCanvas />
          <AlgorithmDial dashboardOpen={dashboardOpen} onToggleDashboard={() => setDashboardOpen(v => !v)} />
          {dashboardOpen && <DashboardOverlay onClose={() => setDashboardOpen(false)} />}
        </main>
      </div>

      <BridgeAlert />
    </div>
  )
}
