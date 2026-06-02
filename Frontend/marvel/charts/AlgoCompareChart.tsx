import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'

const PHASE_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#fb923c', 3: '#c084fc', 4: '#22d3ee', 5: '#FFDE21',
}

export function AlgoCompareChart() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const top = [...movies]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10)
    .map(m => ({
      name:   m.title.replace(/:.+/, '').replace(/\s+\(.*\)/, '').trim().slice(0, 14),
      degree: m.degree,
      phase:  m.phase,
    }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        Top filmes por conexões
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={top} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 7, fontFamily: 'monospace' }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={36} />
          <YAxis tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number) => [v, 'conexões']}
          />
          <Bar dataKey="degree" radius={0}>
            {top.map((entry, i) => (
              <Cell key={i} fill={PHASE_COLORS[entry.phase] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
