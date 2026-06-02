import { useState } from 'react'
import { Waves, GitBranch, Route, AlertTriangle, Plus } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { AlgorithmName } from '@/lib/types'

const ITEMS: { key: AlgorithmName; label: string; icon: React.ReactNode }[] = [
  { key: 'BFS',          label: 'BFS',          icon: <Waves size={14} /> },
  { key: 'DFS',          label: 'DFS',          icon: <GitBranch size={14} /> },
  { key: 'DIJKSTRA',     label: 'Dijkstra',     icon: <Route size={14} /> },
  { key: 'BELLMAN_FORD', label: 'Bellman-Ford', icon: <AlertTriangle size={14} /> },
]

export function AlgorithmDial() {
  const [open, setOpen] = useState(false)
  const { selected, setSelected } = useStore(s => ({
    selected:    s.selected,
    setSelected: s.setSelected,
  }))

  const n = ITEMS.length
  const radius = 64

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && ITEMS.map((item, i) => {
        const angle = -90 + (i * 180) / (n - 1)
        const rad   = (angle * Math.PI) / 180
        const x     = Math.cos(rad) * radius
        const y     = Math.sin(rad) * radius

        return (
          <button
            key={item.key}
            onClick={() => { setSelected(item.key); setOpen(false) }}
            className={cn(
              'absolute flex items-center justify-center w-10 h-10',
              'border-2 text-[10px] font-mono font-bold',
              'transition-all duration-200 hover:scale-110',
              selected === item.key
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                : 'bg-[var(--background-card)] text-[var(--foreground)] border-[var(--border)]',
            )}
            style={{
              bottom: `calc(50% + ${-y}px - 20px)`,
              right:  `calc(50% + ${-x}px - 20px)`,
            }}
            title={item.label}
          >
            {item.icon}
          </button>
        )
      })}

      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-12 h-12 border-2 flex items-center justify-center',
          'bg-[var(--background-card)] text-[var(--foreground)] border-[var(--border)]',
          'hover:border-[var(--primary)] hover:text-[var(--primary)]',
          'transition-all duration-150 font-mono text-xs font-bold',
          open && 'rotate-45',
        )}
        title="Algoritmos"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
