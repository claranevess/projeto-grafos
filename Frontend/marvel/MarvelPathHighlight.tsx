import type { MarvelMovieSchema } from '@/lib/types'

interface SimNode extends MarvelMovieSchema {
  x: number
  y: number
}

interface Props {
  nodes: SimNode[]
  path:  number[]
}

export function MarvelPathHighlight({ nodes, path }: Props) {
  if (path.length < 2) return null

  const nodeById = new Map(nodes.map(n => [n.movie_id, n]))

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const a = nodeById.get(path[i])
    const b = nodeById.get(path[i + 1])
    if (a && b) segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
  }

  if (!segments.length) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1}
          x2={s.x2} y2={s.y2}
          stroke="var(--primary)"
          strokeWidth={4}
          strokeDasharray="8 4"
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}
    </svg>
  )
}
