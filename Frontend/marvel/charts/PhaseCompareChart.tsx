import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'

const PHASE_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#fb923c', 3: '#c084fc', 4: '#22d3ee', 5: '#FFDE21',
}

export function PhaseCompareChart() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const byPhase: Record<number, number[]> = {}
  movies.forEach(m => {
    if (!byPhase[m.phase]) byPhase[m.phase] = []
    byPhase[m.phase].push(m.roi_percent)
  })

  const data = Object.entries(byPhase).map(([phase, rois]) => ({
    phase: `Fase ${phase}`,
    phaseNum: Number(phase),
    avgROI: rois.reduce((a, b) => a + b, 0) / rois.length,
    count: rois.length,
  }))

  return (
    <div className="w-full">
      <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest mb-2">
        ROI médio por fase (%)
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis dataKey="phase" tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 8, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--background)', border: '2px solid black', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
            formatter={(v: number) => [`${v.toFixed(0)}%`, 'ROI médio']}
          />
          <Bar dataKey="avgROI" radius={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={PHASE_COLORS[entry.phaseNum] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
