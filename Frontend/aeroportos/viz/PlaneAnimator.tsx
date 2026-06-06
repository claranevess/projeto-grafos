import type * as d3 from 'd3'
import type { NodeSchema } from '@/lib/types'
import { useStore } from '@/store'

interface Props {
  projection: d3.GeoProjection
  nodes:      NodeSchema[]
}

export function PlaneAnimator({ projection, nodes }: Props) {
  const t      = useStore(s => s.t)
  const result = useStore(s => s.result)

  if (!result || !('path' in result)) return null
  const path = (result as { path: string[] }).path
  if (path.length < 2) return null

  const nodeMap = new Map(nodes.map(n => [n.iata, n]))
  const coords = path
    .map(iata => {
      const n = nodeMap.get(iata)
      if (!n?.lon || !n?.lat) return null
      return projection([n.lon, n.lat]) ?? null
    })
    .filter(Boolean) as [number, number][]

  if (coords.length < 2) return null

  const totalSegments = coords.length - 1
  const tScaled = t * totalSegments
  const segIdx  = Math.min(Math.floor(tScaled), totalSegments - 1)
  const segT    = tScaled - segIdx

  const [x1, y1] = coords[segIdx]
  const [x2, y2] = coords[segIdx + 1]
  const cx = x1 + (x2 - x1) * segT
  const cy = y1 + (y2 - y1) * segT
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)

  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={16}
        style={{ userSelect: 'none' }}
      >
        ✈
      </text>
    </g>
  )
}
