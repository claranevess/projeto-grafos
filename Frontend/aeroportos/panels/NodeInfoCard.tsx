import { useStore } from '@/store'
import { useGraph } from '@/hooks/useGraph'
import { REGION_COLORS, type Region } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

export function NodeInfoCard() {
  const selectedNode = useStore(s => s.selectedNode)
  const { data } = useGraph()

  if (!selectedNode || !data) return null

  const node = data.nodes.find(n => n.iata === selectedNode)
  if (!node) return null

  const color = REGION_COLORS[node.region as Region] ?? '#888'

  return (
    <div className="border border-[var(--border)] p-3 space-y-2 bg-[var(--background-card)]">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-sm text-[var(--foreground)]">{node.iata}</span>
        {node.is_hub && (
          <Badge variant="outline" className="text-[9px] font-mono border-[var(--primary)] text-[var(--primary)] px-1 py-0">
            HUB
          </Badge>
        )}
      </div>

      <p className="text-[11px] text-[var(--muted-foreground)] font-mono truncate">{node.city}</p>

      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{node.region}</span>
      </div>

      <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
        Grau: <span className="text-[var(--foreground)]">{node.degree}</span>
      </div>

      {node.ego_density != null && (
        <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
          Densidade ego: <span className="text-[var(--foreground)]">{(node.ego_density * 100).toFixed(1)}%</span>
        </div>
      )}

      {node.lat && node.lon && (
        <div className="text-[9px] font-mono text-[var(--muted-foreground)]">
          {node.lat.toFixed(4)}, {node.lon.toFixed(4)}
        </div>
      )}
    </div>
  )
}
