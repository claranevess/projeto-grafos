import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'

export function DegreeHistogram() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const degreeCount: Record<number, number> = {}
  movies.forEach(m => {
    degreeCount[m.degree] = (degreeCount[m.degree] ?? 0) + 1
  })

  const data = Object.entries(degreeCount)
    .map(([deg, count]) => ({ degree: Number(deg), count }))
    .sort((a, b) => a.degree - b.degree)

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        Distribuição de grau
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis dataKey="degree" tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number) => [v, 'filmes']}
            labelFormatter={l => `Grau ${l}`}
          />
          <Bar dataKey="count" fill="var(--primary)" stroke="black" strokeWidth={1} radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
