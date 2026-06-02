import type * as d3 from 'd3'
import type { NodeSchema, EdgeSchema } from '@/lib/types'

interface Props {
  projection: d3.GeoProjection
  nodes:      NodeSchema[]
  edges:      EdgeSchema[]
}

export function EdgeLayer({ projection, nodes, edges }: Props) {
  const nodeMap = new Map(nodes.map(n => [n.iata, n]))

  return (
    <g>
      {edges.map(e => {
        const src = nodeMap.get(e.source)
        const tgt = nodeMap.get(e.target)
        if (!src?.lon || !src?.lat || !tgt?.lon || !tgt?.lat) return null
        const [x1, y1] = projection([src.lon, src.lat]) ?? [0, 0]
        const [x2, y2] = projection([tgt.lon, tgt.lat]) ?? [0, 0]
        return (
          <line
            key={`${e.source}-${e.target}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--border)"
            strokeWidth={0.8}
            opacity={0.5}
          />
        )
      })}
    </g>
  )
}
