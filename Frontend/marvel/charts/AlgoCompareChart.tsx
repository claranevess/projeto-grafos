import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStore } from '@/store'
import { ALGORITHM_LABELS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'

const ALGO_ORDER: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']

const ALGO_COLORS: Record<AlgorithmName, string> = {
  BFS:          '#4ade80',
  DFS:          '#22d3ee',
  DIJKSTRA:     '#c084fc',
  BELLMAN_FORD: '#e3000b',
}

export function AlgoCompareChart() {
  const algoTimings = useStore(s => s.algoTimings)

  const data = ALGO_ORDER
    .filter(alg => algoTimings[alg] !== undefined)
    .map(alg => ({
      name:      ALGORITHM_LABELS[alg],
      algorithm: alg,
      time:      algoTimings[alg]!,
    }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        Tempo de execução por algoritmo (ms)
      </p>
      {data.length === 0 ? (
        <p className="text-[9px] font-mono text-[var(--muted-foreground)] italic leading-relaxed">
          Execute BFS, DFS, Dijkstra e Bellman-Ford na aba "Alg" para comparar o desempenho real medido pela API.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 24 }}>
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={40}
              tick={{ fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'ms', position: 'insideTopLeft', fontSize: 8, fontFamily: 'monospace', fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
              formatter={(v: number) => [`${v.toFixed(2)}ms`, 'Tempo de execução']}
            />
            <Bar dataKey="time" radius={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={ALGO_COLORS[entry.algorithm]} stroke="black" strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}