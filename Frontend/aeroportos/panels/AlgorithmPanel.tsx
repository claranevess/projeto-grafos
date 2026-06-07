import { useStore } from '@/store'
import { useRunAlgorithm } from '@/hooks/useAlgorithm'
import { AirportSearch } from '@aeroportos/controls/AirportSearch'
import { Button } from '@/components/ui/button'
import { ALGORITHM_LABELS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'
import { cn } from '@/lib/utils'

const ALGORITHMS: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA']

export function AlgorithmPanel() {
  const { selected, setSelected, isRunning, source, reset } = useStore(s => ({
    selected:    s.selected,
    setSelected: s.setSelected,
    isRunning:   s.isRunning,
    source:      s.source,
    reset:       s.reset,
  }))

  const { mutate: run } = useRunAlgorithm()

  const needsTarget = selected === 'DIJKSTRA'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1">
        {ALGORITHMS.map(alg => (
          <button
            key={alg}
            onClick={() => setSelected(alg)}
            className={cn(
              'text-[10px] font-mono px-2 py-1 border transition-colors',
              selected === alg
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)]',
            )}
          >
            {ALGORITHM_LABELS[alg]}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <AirportSearch mode="source" />
        {needsTarget && <AirportSearch mode="target" />}
      </div>

      <div className="flex gap-1.5">
        <Button
          size="sm"
          onClick={() => run()}
          disabled={isRunning || !source}
          className={cn(
            'flex-1 h-7 text-[11px] font-mono',
            'bg-[var(--primary)] text-[var(--primary-foreground)]',
            'hover:opacity-90 disabled:opacity-40',
          )}
        >
          {isRunning ? 'Executando…' : 'Executar'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={reset}
          className="h-7 text-[11px] font-mono border border-[var(--border)] text-[var(--muted-foreground)]"
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
