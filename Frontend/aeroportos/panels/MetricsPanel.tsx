import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/lib/api'
import { REGION_COLORS, type Region } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'

export function MetricsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: graphApi.getMetrics,
    staleTime: Infinity,
  })

  if (isLoading) return <Skeleton className="h-24 w-full" />
  if (!data) return null

  const { global_metrics, regions } = data

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <MetricRow label="Aeroportos" value={global_metrics.order} />
        <MetricRow label="Rotas" value={global_metrics.size} />
        <MetricRow label="Densidade" value={global_metrics.density.toFixed(4)} />
      </div>

      <div className="space-y-1">
        <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
          Top hubs
        </span>
        {global_metrics.top_hubs.slice(0, 3).map(hub => (
          <div key={hub.iata} className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[var(--foreground)] font-bold w-8">{hub.iata}</span>
            <span className="text-[var(--muted-foreground)] flex-1 truncate">{hub.city}</span>
            <span className="text-[var(--path-highlight)]">{hub.degree}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
          Por região
        </span>
        {regions.map(r => (
          <div key={r.region} className="flex items-center gap-2 text-[10px] font-mono">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: REGION_COLORS[r.region as Region] ?? '#888' }}
            />
            <span className="text-[var(--muted-foreground)] flex-1 truncate">{r.region}</span>
            <span className="text-[var(--foreground)]">{r.order}</span>
            <span className="text-[var(--muted-foreground)]">/</span>
            <span className="text-[var(--foreground)]">{r.size}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between text-[10px] font-mono">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[var(--foreground)]">{value}</span>
    </div>
  )
}
