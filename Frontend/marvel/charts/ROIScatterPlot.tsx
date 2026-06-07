import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'
import { CATEGORY_COLORS } from '@/lib/constants'

export function ROIScatterPlot() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const points = movies.map(m => ({
    budget:   m.budget_million,
    roi:      m.roi_percent,
    category: m.category,
    title:    m.title,
  }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        Orçamento vs ROI
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <ScatterChart margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis
            dataKey="budget"
            type="number"
            name="Orçamento"
            unit="M"
            tick={{ fontSize: 8, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="roi"
            type="number"
            name="ROI"
            unit="%"
            tick={{ fontSize: 8, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number, name: string) => [
              name === 'Orçamento' ? `$${v}M` : `${v.toFixed(0)}%`,
              name,
            ]}
          />
          <Scatter data={points} shape="circle">
            {points.map((p, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[p.category] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
