import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'
import { CATEGORY_COLORS } from '@/lib/constants'

export function CategoryCompareChart() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const byCategory: Record<string, number[]> = {}
  movies.forEach(m => {
    if (!byCategory[m.category]) byCategory[m.category] = []
    byCategory[m.category].push(m.roi_percent)
  })

  const data = Object.entries(byCategory).map(([category, rois]) => ({
    category,
    avgROI: rois.reduce((a, b) => a + b, 0) / rois.length,
    count: rois.length,
  }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        ROI médio por categoria (%)
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis dataKey="category" tick={{ fontSize: 7, fontFamily: 'monospace' }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={36} />
          <YAxis tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number) => [`${v.toFixed(0)}%`, 'ROI médio']}
          />
          <Bar dataKey="avgROI" radius={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}