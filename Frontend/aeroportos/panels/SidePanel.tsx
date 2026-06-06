import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { AlgorithmPanel } from './AlgorithmPanel'
import { ResultPanel } from './ResultPanel'
import { MetricsPanel } from './MetricsPanel'
import { NodeInfoCard } from './NodeInfoCard'
import { RegionFilter } from '@aeroportos/controls/RegionFilter'
import { AnimationControls } from '@aeroportos/controls/AnimationControls'
import { useStore } from '@/store'

export function SidePanel() {
  const [tab, setTab] = useState('algoritmo')
  const result = useStore(s => s.result)

  return (
    <aside
      className="w-56 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--background-card)]"
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
        {/* header fixo */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <TabsList className="w-full h-7 bg-transparent border border-[var(--border)] p-0 gap-0">
            {[
              { value: 'algoritmo', label: 'Algoritmo' },
              { value: 'metricas',  label: 'Métricas'  },
              { value: 'regioes',   label: 'Regiões'   },
            ].map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={
                  'flex-1 h-full text-[9px] font-mono uppercase tracking-wider rounded-none ' +
                  'data-[state=active]:bg-[var(--primary)] data-[state=active]:text-[var(--primary-foreground)] ' +
                  'data-[state=inactive]:text-[var(--muted-foreground)]'
                }
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* conteúdo rolável */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3">
          <TabsContent value="algoritmo" className="mt-0 space-y-3 pb-2">
            <AlgorithmPanel />
            {result && (
              <>
                <Separator className="bg-[var(--border)]" />
                <ResultPanel />
              </>
            )}
          </TabsContent>

          <TabsContent value="metricas" className="mt-0 pb-2">
            <MetricsPanel />
          </TabsContent>

          <TabsContent value="regioes" className="mt-0 pb-2">
            <RegionFilter />
          </TabsContent>
        </div>

        {/* rodapé fixo */}
        <div className="shrink-0 px-3 py-2 space-y-2 border-t border-[var(--border)]">
          <NodeInfoCard />
          <AnimationControls />
        </div>
      </Tabs>
    </aside>
  )
}
