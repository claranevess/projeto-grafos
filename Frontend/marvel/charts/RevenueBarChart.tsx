import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'

const PHASE_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#fb923c', 3: '#c084fc', 4: '#22d3ee', 5: '#FFDE21',
}

export function RevenueBarChart() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const top = [...movies]
    .sort((a, b) => b.worldwide_gross_million - a.worldwide_gross_million)
    .slice(0, 12)
    .map(m => ({
      name:     m.title.replace(/:.+/, '').trim(),
      revenue:  m.worldwide_gross_million,
      phase:    m.phase,
    }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        Top bilheteria (US$ milhões)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={top} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number) => [`$${v.toFixed(0)}M`, 'Bilheteria']}
          />
          <Bar dataKey="revenue" radius={0}>
            {top.map((entry, i) => (
              <Cell key={i} fill={PHASE_COLORS[entry.phase] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
