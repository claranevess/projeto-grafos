/**
 * InteractiveAnalytics.tsx
 * * Este arquivo consolida todos os gráficos interativos da aplicação (Recharts).
 * Você pode importar os gráficos individualmente ou usar o componente 
 * InteractiveAnalyticsDashboard para exibir todos de uma vez.
 */

import React from 'react'
import { 
  BarChart, Bar, 
  ScatterChart, Scatter, 
  XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts'

import { useStore } from '@/store'
import { useMarvelMovies } from '@/hooks/useMarvelGraph'
import { ALGORITHM_LABELS, CATEGORY_COLORS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'

// -----------------------------------------------------------------------------
// Configurações e Constantes
// -----------------------------------------------------------------------------

const ALGO_ORDER: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']

const ALGO_COLORS: Record<AlgorithmName, string> = {
  BFS:          '#4ade80',
  DFS:          '#22d3ee',
  DIJKSTRA:     '#c084fc',
  BELLMAN_FORD: '#e3000b',
}

// -----------------------------------------------------------------------------
// Gráfico 1: Comparação de Algoritmos
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Gráfico 2: ROI por Categoria
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Gráfico 3: Histograma de Grau
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Gráfico 4: Top Bilheteria
// -----------------------------------------------------------------------------

export function RevenueBarChart() {
  const { data: movies } = useMarvelMovies()
  if (!movies) return null

  const top = [...movies]
    .sort((a, b) => b.worldwide_gross_million - a.worldwide_gross_million)
    .slice(0, 12)
    .map(m => ({
      name:     m.title.replace(/:.+/, '').trim(),
      revenue:  m.worldwide_gross_million,
      category: m.category,
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
              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#888'} stroke="black" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Gráfico 5: Scatter Orçamento vs ROI
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Painel Principal (Ponto de entrada análogo ao "main" do Python)
// -----------------------------------------------------------------------------

export function InteractiveAnalyticsDashboard() {
  return (
    <div className="flex flex-col gap-8 w-full p-4 bg-[var(--background)]">
      <h2 className="text-xl font-bold tracking-tight">Painel de Análise Interativo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded shadow-sm">
          <AlgoCompareChart />
        </div>
        <div className="p-4 border rounded shadow-sm">
          <CategoryCompareChart />
        </div>
        <div className="p-4 border rounded shadow-sm">
          <DegreeHistogram />
        </div>
        <div className="p-4 border rounded shadow-sm">
          <ROIScatterPlot />
        </div>
        <div className="p-4 border rounded shadow-sm md:col-span-2">
          <RevenueBarChart />
        </div>
      </div>
    </div>
  )
}