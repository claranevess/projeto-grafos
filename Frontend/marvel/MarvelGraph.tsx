import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useMarvelGraph } from '@/hooks/useMarvelGraph'
import { useStore } from '@/store'
import { MarvelNodeTooltip } from './MarvelNodeTooltip'
import { MarvelPathHighlight } from './MarvelPathHighlight'
import { MarvelExplorationLayer } from './MarvelExplorationLayer'
import type { MarvelMovieSchema, MarvelEdgeSchema } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/constants'

interface SimNode extends MarvelMovieSchema {
  x: number
  y: number
  vx: number
  vy: number
}

interface SimEdge {
  source: SimNode
  target: SimNode
  weight: number
  connection_type: string
}

export function MarvelGraph() {
  const { data } = useMarvelGraph()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [simEdges, setSimEdges] = useState<SimEdge[]>([])

  const { source, target, setSource, setTarget, setTooltip } = useStore(s => ({
    source:     s.source as number | null,
    target:     s.target as number | null,
    setSource:  s.setSource,
    setTarget:  s.setTarget,
    setTooltip: s.setTooltip,
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!data || !dims.w || !dims.h) return

    const nodes: SimNode[] = data.movies.map(m => ({
      ...m,
      x: dims.w / 2 + (Math.random() - 0.5) * 100,
      y: dims.h / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    }))

    const nodeById = new Map(nodes.map(n => [n.movie_id, n]))

    const edges: { source: SimNode; target: SimNode; weight: number; connection_type: string }[] = data.edges
      .map((e: MarvelEdgeSchema) => {
        const s = nodeById.get(e.source)
        const t = nodeById.get(e.target)
        if (!s || !t) return null
        return { source: s, target: t, weight: e.weight, connection_type: e.connection_type }
      })
      .filter(Boolean) as SimEdge[]

    const padding = 24

    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimEdge>(edges).id(d => d.movie_id).distance(70).strength(0.4))
      .force('charge', d3.forceManyBody<SimNode>().strength(-120))
      .force('center', d3.forceCenter(dims.w / 2, dims.h / 2))
      .force('collision', d3.forceCollide<SimNode>(18))
      .force('bounds', () => {
        for (const n of nodes) {
          n.x = Math.max(padding, Math.min(dims.w - padding, n.x))
          n.y = Math.max(padding, Math.min(dims.h - padding, n.y))
        }
      })

    for (let i = 0; i < 300; i++) sim.tick()
    sim.stop()

    setSimNodes([...nodes])
    setSimEdges([...edges])
  }, [data, dims.w, dims.h])

  const handleMouseEnter = useCallback((movie: SimNode, e: React.MouseEvent) => {
    setTooltip(movie.movie_id, { x: e.clientX, y: e.clientY })
  }, [setTooltip])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null, null)
  }, [setTooltip])

  const handleClick = useCallback((movie: SimNode) => {
    if (source === null || (source !== null && target !== null)) {
      setSource(movie.movie_id)
      setTarget(null)
    } else {
      setTarget(movie.movie_id)
    }
  }, [source, target, setSource, setTarget])

  const resultPath = useStore(s => {
    const r = s.result as { path?: number[] } | null
    return r?.path ?? []
  })

  const pathSet = new Set<string>()
  if (resultPath.length > 1) {
    for (let i = 0; i < resultPath.length - 1; i++) {
      pathSet.add(`${resultPath[i]}-${resultPath[i + 1]}`)
      pathSet.add(`${resultPath[i + 1]}-${resultPath[i]}`)
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[var(--background)]">
      <svg width={dims.w} height={dims.h} className="absolute inset-0">
        <g>
          {simEdges.map((e, i) => {
            const sid = (e.source as SimNode).movie_id
            const tid = (e.target as SimNode).movie_id
            const isPath = pathSet.has(`${sid}-${tid}`)
            return (
              <line
                key={i}
                x1={(e.source as SimNode).x}
                y1={(e.source as SimNode).y}
                x2={(e.target as SimNode).x}
                y2={(e.target as SimNode).y}
                stroke={isPath ? 'var(--primary)' : 'var(--border)'}
                strokeWidth={isPath ? 3 : 0.8}
                strokeOpacity={isPath ? 1 : 0.3}
              />
            )
          })}
        </g>

        <g>
          {simNodes.map(n => {
            const isSource  = source === n.movie_id
            const isTarget  = target === n.movie_id
            const isOnPath  = resultPath.includes(n.movie_id)
            const nodeColor = CATEGORY_COLORS[n.category] ?? '#888'
            const r         = n.is_hub ? 12 : 8

            return (
              <g
                key={n.movie_id}
                transform={`translate(${n.x},${n.y})`}
                className="cursor-pointer"
                onClick={() => handleClick(n)}
                onMouseEnter={e => handleMouseEnter(n, e)}
                onMouseLeave={handleMouseLeave}
              >
                {n.is_hub && (
                  <circle r={r + 4} fill="none" stroke="black" strokeWidth={2} />
                )}
                <circle
                  r={r}
                  fill={isSource || isTarget ? 'var(--primary)' : nodeColor}
                  stroke="black"
                  strokeWidth={isOnPath ? 3 : 1.5}
                />
                {(isSource || isTarget) && (
                  <text
                    y={-r - 4}
                    textAnchor="middle"
                    fontSize={7}
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="black"
                  >
                    {isSource ? 'SRC' : 'DST'}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <MarvelPathHighlight nodes={simNodes} path={resultPath} />
      <MarvelExplorationLayer nodes={simNodes} />
      <MarvelNodeTooltip nodes={simNodes} />
    </div>
  )
}
