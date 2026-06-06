import { Switch } from '@/components/ui/switch'
import { useStore } from '@/store'
import { REGIONS, REGION_COLORS, type Region } from '@/lib/constants'

export function RegionFilter() {
  const { activeRegions, toggleRegion } = useStore(s => ({
    activeRegions: s.activeRegions,
    toggleRegion:  s.toggleRegion,
  }))

  return (
    <div className="space-y-2">
      {REGIONS.map(r => {
        const color = REGION_COLORS[r as Region]
        return (
          <div key={r} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[11px] text-[var(--muted-foreground)] font-mono">{r}</span>
            </div>
            <Switch
              checked={activeRegions.has(r as Region)}
              onCheckedChange={() => toggleRegion(r as Region)}
              className="scale-75"
            />
          </div>
        )
      })}
    </div>
  )
}
