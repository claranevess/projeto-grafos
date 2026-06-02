import type * as d3 from 'd3'
import type { NodeSchema } from '@/lib/types'
import { useStore } from '@/store'

interface Props {
  projection: d3.GeoProjection
  nodes:      NodeSchema[]
}

export function PathHighlightLayer({ projection, nodes }: Props) {
  const result = useStore(s => s.result)
  if (!result || !('path' in result)) return null

  const path = (result as { path: string[] }).path
  const nodeMap = new Map(nodes.map(n => [n.iata, n]))

  const points = path
    .map(iata => {
      const n = nodeMap.get(iata)
      if (!n?.lon || !n?.lat) return null
      const [x, y] = projection([n.lon, n.lat]) ?? [0, 0]
      return `${x},${y}`
    })
    .filter(Boolean) as string[]

  if (points.length < 2) return null

  const totalLen = points.length * 80
  return (
    <polyline
      points={points.join(' ')}
      fill="none"
      stroke="var(--path-highlight)"
      strokeWidth={2.5}
      strokeDasharray={totalLen}
      strokeDashoffset={totalLen}
      opacity={0.9}
      style={{
        '--dash-len': totalLen,
        animation: 'edge-trace 1.2s ease-out forwards',
      } as React.CSSProperties}
    />
  )
}
