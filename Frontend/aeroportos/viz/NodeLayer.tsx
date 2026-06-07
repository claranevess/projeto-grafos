import type * as d3 from 'd3'
import type { NodeSchema } from '@/lib/types'
import { useStore } from '@/store'
import { REGION_COLORS } from '@/lib/constants'

interface Props {
  projection: d3.GeoProjection
  nodes:      NodeSchema[]
}

export function NodeLayer({ projection, nodes }: Props) {
  const selectedNode  = useStore(s => s.selectedNode)
  const setSelected   = useStore(s => s.setSelectedNode)
  const setTarget     = useStore(s => s.setTarget)
  const activeRegions = useStore(s => s.activeRegions)
  const result        = useStore(s => s.result)

  const pathNodes = new Set(
    result && 'path' in result ? (result as { path: string[] }).path : []
  )

  return (
    <g>
      {nodes
        .filter(n => activeRegions.has(n.region as never))
        .map(n => {
          if (!n.lon || !n.lat) return null
          const [cx, cy] = projection([n.lon, n.lat]) ?? [0, 0]
          const isSelected  = selectedNode === n.iata
          const isInPath    = pathNodes.has(n.iata)
          const color       = REGION_COLORS[n.region as keyof typeof REGION_COLORS] ?? 'var(--foreground)'
          const r = n.is_hub ? 4 : 2.5

          return (
            <g
              key={n.iata}
              transform={`translate(${cx},${cy})`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSelected(n.iata)
                setTarget(n.iata)
              }}
            >
              {n.is_hub && (
                <circle
                  r={r + 3}
                  fill="none"
                  stroke={color}
                  strokeWidth={0.6}
                  opacity={0.25}
                  className="animate-hub-pulse"
                />
              )}
              <circle
                r={r}
                fill={isInPath ? 'var(--path-highlight)' : isSelected ? 'var(--primary)' : color}
                stroke="var(--background)"
                strokeWidth={0.8}
                opacity={0.95}
              />
              <text
                dy="-4"
                textAnchor="middle"
                fontSize={6}
                fill="var(--foreground)"
                opacity={0.7}
                style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
              >
                {n.iata}
              </text>
            </g>
          )
        })}
    </g>
  )
}