import type * as d3 from 'd3'
import type { NodeSchema } from '@/lib/types'
import { useStore } from '@/store'

interface Props {
  projection: d3.GeoProjection
  nodes:      NodeSchema[]
}

export function BfsWaveLayer({ projection, nodes }: Props) {
  const result = useStore(s => s.result)
  if (!result || !('layers' in result)) return null

  const layers = (result as { layers: Record<string, string[]> }).layers
  const nodeMap = new Map(nodes.map(n => [n.iata, n]))

  return (
    <g>
      {Object.entries(layers).map(([level, iatas]) =>
        iatas.map(iata => {
          const n = nodeMap.get(iata)
          if (!n?.lon || !n?.lat) return null
          const [cx, cy] = projection([n.lon, n.lat]) ?? [0, 0]
          const lvl = parseInt(level)
          const maxR = 20 + lvl * 8
          return (
            <circle
              key={`wave-${iata}-${level}`}
              cx={cx} cy={cy}
              r={0}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1}
              opacity={0.5}
              style={{
                '--wave-r': `${maxR}px`,
                animation: `bfs-wave 1.5s ease-out ${lvl * 0.4}s forwards`,
              } as React.CSSProperties}
            />
          )
        })
      )}
    </g>
  )
}
