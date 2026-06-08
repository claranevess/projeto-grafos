import { useStore } from '@/store'
import type { MarvelMovieSchema } from '@/lib/types'

interface SimNode extends MarvelMovieSchema {
  x: number
  y: number
}

interface ExplorationResult {
  algorithm:         string
  source:            number
  execution_time_ms: number
  layers?:           Record<string, number[]>
  visited_order?:    number[]
}

interface Props {
  nodes: SimNode[]
}

/**
 * Anima a varredura de BFS/DFS sobre o grafo, igual ao `BfsWaveLayer` da Parte 1
 * (ondas concêntricas por camada), mas também cobre DFS — que não tem "camadas",
 * então anima o `visited_order` como uma sequência de pulsos + arestas-trilha.
 * Usa `<animate>` SMIL em vez de @keyframes porque cada nó precisa de um raio-alvo
 * e atraso diferentes (CSS keyframes não conseguem parametrizar isso por instância).
 */
export function MarvelExplorationLayer({ nodes }: Props) {
  const result = useStore(s => s.result) as ExplorationResult | null
  if (!result) return null

  const nodeById = new Map(nodes.map(n => [n.movie_id, n]))
  const runKey = `${result.algorithm}-${result.source}-${result.execution_time_ms}`

  if (result.layers) {
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <g key={`bfs-${runKey}`}>
          {Object.entries(result.layers).flatMap(([level, ids]) => {
            const lvl   = Number(level)
            const maxR  = 16 + lvl * 9
            const begin = `${lvl * 0.35}s`
            return ids.map(id => {
              const n = nodeById.get(id)
              if (!n) return null
              return (
                <circle key={`bfs-wave-${id}`} cx={n.x} cy={n.y} r={0} fill="none" stroke="var(--primary)" strokeWidth={2} opacity={0}>
                  <animate attributeName="r" from={0} to={maxR} dur="1.1s" begin={begin} fill="freeze" />
                  <animate attributeName="opacity" values="0.85;0.4;0" keyTimes="0;0.55;1" dur="1.1s" begin={begin} fill="freeze" />
                </circle>
              )
            })
          })}
        </g>
      </svg>
    )
  }

  if (result.visited_order && result.visited_order.length > 1) {
    const order = result.visited_order
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <g key={`dfs-${runKey}`}>
          {order.map((id, idx) => {
            const n    = nodeById.get(id)
            const prev = idx > 0 ? nodeById.get(order[idx - 1]) : null
            if (!n) return null
            const begin = `${idx * 0.16}s`
            return (
              <g key={`dfs-step-${id}`}>
                {prev && (
                  <line x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} stroke="var(--destructive)" strokeWidth={2} strokeOpacity={0}>
                    <animate attributeName="stroke-opacity" values="0;0.7;0.25" keyTimes="0;0.3;1" dur="1.4s" begin={begin} fill="freeze" />
                  </line>
                )}
                <circle cx={n.x} cy={n.y} r={0} fill="none" stroke="var(--destructive)" strokeWidth={2} opacity={0}>
                  <animate attributeName="r" from={0} to={15} dur="0.8s" begin={begin} fill="freeze" />
                  <animate attributeName="opacity" values="0.85;0.4;0" keyTimes="0;0.55;1" dur="0.8s" begin={begin} fill="freeze" />
                </circle>
              </g>
            )
          })}
        </g>
      </svg>
    )
  }

  return null
}
