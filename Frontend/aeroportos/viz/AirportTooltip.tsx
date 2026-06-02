import { useStore } from '@/store'
import { REGION_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AirportTooltip() {
  const tooltipNode = useStore(s => s.tooltipNode)
  const tooltipPos  = useStore(s => s.tooltipPos)
  const nodes       = useStore(s => s.nodes)

  if (!tooltipNode || !tooltipPos) return null
  const node = nodes.find(n => n.iata === tooltipNode)
  if (!node) return null

  const color = REGION_COLORS[node.region as keyof typeof REGION_COLORS] ?? 'var(--foreground)'

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        'border border-[var(--border)] bg-[var(--background-card)]',
        'px-3 py-2 text-xs font-mono shadow-lg',
        'animate-fade-in',
      )}
      style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-sm text-[var(--foreground)]">{node.iata}</span>
        <span className="text-[10px]" style={{ color }}>{node.region}</span>
      </div>
      <div className="text-[var(--muted-foreground)]">{node.city}</div>
      <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">
        Grau: <span className="text-[var(--foreground)]">{node.degree}</span>
        {node.is_hub && (
          <span className="ml-2 text-[var(--primary)]">● hub</span>
        )}
      </div>
    </div>
  )
}
