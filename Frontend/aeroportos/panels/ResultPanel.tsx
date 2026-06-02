import { useStore } from '@/store'
import type { BfsResult, DfsResult, PathResult } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ALGORITHM_LABELS } from '@/lib/constants'

export function ResultPanel() {
  const result = useStore(s => s.result)
  const selected = useStore(s => s.selected)

  if (!result) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
          Resultado
        </span>
        <Badge variant="outline" className="text-[9px] font-mono border-[var(--border)] text-[var(--foreground)] px-1.5 py-0">
          {ALGORITHM_LABELS[selected]}
        </Badge>
      </div>

      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        {result.execution_time_ms.toFixed(2)}ms
      </div>

      {'path' in result && (result as PathResult).path.length > 0 && (
        <PathResultView result={result as PathResult} />
      )}

      {'visited_order' in result && 'layers' in result && (
        <BfsResultView result={result as BfsResult} />
      )}

      {'visited_order' in result && 'has_cycle' in result && (
        <DfsResultView result={result as DfsResult} />
      )}
    </div>
  )
}

function PathResultView({ result }: { result: PathResult }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        Custo:{' '}
        <span className="text-[var(--path-highlight)]">
          {result.cost !== null ? result.cost.toFixed(1) : '∞'}
        </span>
      </div>

      {!result.reachable && (
        <div className="text-[10px] font-mono text-[var(--destructive)]">Sem rota disponível</div>
      )}

      {result.path.length > 0 && (
        <ScrollArea className="max-h-24">
          <div className="flex flex-wrap gap-1">
            {result.path.map((iata, i) => (
              <span key={i} className="text-[10px] font-mono text-[var(--foreground)]">
                {iata}{i < result.path.length - 1 && <span className="text-[var(--muted-foreground)] mx-0.5">→</span>}
              </span>
            ))}
          </div>
        </ScrollArea>
      )}

      {result.has_negative_cycle && (
        <div className="text-[10px] font-mono text-[var(--destructive)]">Ciclo negativo detectado</div>
      )}
    </div>
  )
}

function BfsResultView({ result }: { result: BfsResult }) {
  const layerEntries = Object.entries(result.layers)
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        Visitados: <span className="text-[var(--foreground)]">{result.visited_order.length}</span>
      </div>
      <ScrollArea className="max-h-32">
        <div className="space-y-1">
          {layerEntries.slice(0, 6).map(([layer, nodes]) => (
            <div key={layer} className="text-[9px] font-mono">
              <span className="text-[var(--muted-foreground)]">L{layer}: </span>
              <span className="text-[var(--foreground)]">{nodes.join(', ')}</span>
            </div>
          ))}
          {layerEntries.length > 6 && (
            <div className="text-[9px] font-mono text-[var(--muted-foreground)]">
              +{layerEntries.length - 6} camadas…
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function DfsResultView({ result }: { result: DfsResult }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        Visitados: <span className="text-[var(--foreground)]">{result.visited_order.length}</span>
      </div>
      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        Ciclo: <span className={result.has_cycle ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'}>
          {result.has_cycle ? 'sim' : 'não'}
        </span>
      </div>
      <ScrollArea className="max-h-24">
        <div className="text-[9px] font-mono text-[var(--foreground)] leading-relaxed">
          {result.visited_order.slice(0, 20).join(' → ')}
          {result.visited_order.length > 20 && '…'}
        </div>
      </ScrollArea>
    </div>
  )
}
