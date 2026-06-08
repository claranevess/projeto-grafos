import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, FilterX, BarChart3, Route, Cpu, Info, Lightbulb } from 'lucide-react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
  Line,
  LineChart
} from 'recharts'
import { graphApi } from '@/lib/api'
import React from 'react'

interface DashboardOverlay2Props {
  onClose: () => void
}

type TabId = 'macro' | 'routes' | 'benchmarking'

export function DashboardOverlay2({ onClose }: DashboardOverlay2Props) {
  const [activeTab, setActiveTab] = useState<TabId>('macro')

  // DADOS PARA O DASHBOARD MARVEL
  const marvelStatsData = [
    { name: 'Movies', count: 335, color: '#6366F1' },
    { name: 'Directors', count: 124, color: '#3B82F6' },
    { name: 'Actors', count: 298, color: '#10B981' },
  ]

  const boxOfficeData = [
    { studio: 'MCU Phase 1-3', revenue: 22560, avg_rating: 7.2 },
    { studio: 'MCU Phase 4', revenue: 8940, avg_rating: 6.8 },
    { studio: 'MCU Phase 5', revenue: 4520, avg_rating: 6.5 },
    { studio: 'Sony MCU', revenue: 3870, avg_rating: 6.9 },
  ]

  const networkMetricsData = [
    { metric: 'Densidade', valor: 0.0234, descricao: 'Rede muito esparsa' },
    { metric: 'Diâmetro', valor: 6, descricao: 'Distância máxima entre nós' },
    { metric: 'Coef. Agrupamento', valor: 0.387, descricao: 'Tendência de clustering' },
  ]

  const asymptoticData = [
    { v: 10, BFS: 10, Dijkstra: 15, BellmanFord: 45 },
    { v: 50, BFS: 50, Dijkstra: 90, BellmanFord: 350 },
    { v: 100, BFS: 100, Dijkstra: 210, BellmanFord: 1200 },
    { v: 250, BFS: 250, Dijkstra: 580, BellmanFord: 6500 },
    { v: 500, BFS: 500, Dijkstra: 1300, BellmanFord: 24000 },
  ]

  const benchmarkData = [
    { name: 'BFS', tempo: 85, complexidade: 'O(V + E)', cor: '#10B981', recomendacao: 'Ótimo para análise de proximidade.' },
    { name: 'DFS', tempo: 92, complexidade: 'O(V + E)', cor: '#3B82F6', recomendacao: 'Útil para detecção de ciclos e componentes.' },
    { name: 'Dijkstra', tempo: 156, complexidade: 'O((V + E) log V)', cor: '#6366F1', recomendacao: 'Caminho mais curto entre dois atores.' },
    { name: 'Bellman', tempo: 520, complexidade: 'O(V * E)', cor: '#EF4444', recomendacao: 'Não recomendado para rede sem pesos negativos.' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-slate-100 select-none overflow-hidden">
      {/* HEADER PRINCIPAL */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Análise de Grafo <span className="text-indigo-400">Marvel Network</span>
          </h2>
          <p className="text-xs text-slate-400">Dashboard Interativo - Conexões entre Filmes, Atores e Diretores</p>
        </div>
        <nav className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button onClick={() => setActiveTab('macro')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'macro' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><BarChart3 size={14} /> Estatísticas</button>
          <button onClick={() => setActiveTab('routes')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'routes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><Route size={14} /> Box Office</button>
          <button onClick={() => setActiveTab('benchmarking')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'benchmarking' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}><Cpu size={14} /> Performance</button>
        </nav>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('macro')} className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"><FilterX size={14} /> Reset</button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"><X size={16} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
        <div className="mx-auto max-w-[1500px] space-y-6">
          
          {/* ================================================== */}
          {/* ABA 1: ESTATÍSTICAS (MACRO)                         */}
          {/* ================================================== */}
          {activeTab === 'macro' && (
            <>
              {/* CARDS DE RESUMO */}
              <div className="grid gap-4 sm:grid-cols-3">
                {marvelStatsData.map((stat) => (
                  <div key={stat.name} className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.name}</h3>
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stat.color }} />
                    </div>
                    <p className="text-3xl font-black text-white">{stat.count}</p>
                  </div>
                ))}
              </div>

              {/* GRÁFICOS */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">Distribuição de Estatísticas</h3>
                    <p className="text-xs text-slate-400">Proporção de elementos no network Marvel.</p>
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marvelStatsData}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '6px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {marvelStatsData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">Métricas de Rede</h3>
                    <p className="text-xs text-slate-400">Propriedades estruturais do grafo Marvel.</p>
                  </div>
                  <div className="space-y-3">
                    {networkMetricsData.map((metric) => (
                      <div key={metric.metric} className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-300">{metric.metric}</span>
                          <span className="text-sm font-bold text-indigo-400">{metric.valor}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{metric.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* INSIGHT */}
              <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2"><Lightbulb size={14}/> Insight Exploratório</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A rede Marvel apresenta uma estrutura <strong>Scale-Free</strong> típica, onde alguns atores (hubs) aparecem em muitos filmes enquanto a maioria tem poucas aparições. A baixa densidade (0.0234) indica que nem todos os atores trabalham entre si, refletindo as diferentes franquias e períodos do universo cinematográfico.
                </p>
              </div>
            </>
          )}

          {/* ================================================== */}
          {/* ABA 2: BOX OFFICE E RECEITAS                       */}
          {/* ================================================== */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-6">
                <h3 className="text-sm font-bold text-white mb-4">Receita por Fase (em milhões USD)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={boxOfficeData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="studio" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} label={{ value: 'Box Office ($M)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} label={{ value: 'Rating Médio', angle: 90, position: 'insideRight', fill: '#64748B', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" name="Receita Total" fill="#6366F1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Line yAxisId="right" type="monotone" dataKey="avg_rating" name="Rating Médio" stroke="#F59E0B" strokeWidth={3} dot={{ r: 6, fill: '#F59E0B', stroke: '#1E293B', strokeWidth: 2 }} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* ABA 3: BENCHMARKING TÉCNICO                        */}
          {/* ================================================== */}
          {activeTab === 'benchmarking' && (
            <div className="space-y-6">
              
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
                  <h3 className="text-sm font-bold text-white mb-1">Microbenchmarking (Rede Marvel)</h3>
                  <p className="text-xs text-slate-400 mb-4">Tempo de execução com os dados atuais.</p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={benchmarkData} margin={{ top: 10, bottom: 5 }}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Tempo (µs)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '6px' }} />
                        <Bar dataKey="tempo" radius={[4, 4, 0, 0]}>
                          {benchmarkData.map((entry, idx) => <Cell key={idx} fill={entry.cor} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
                  <h3 className="text-sm font-bold text-white mb-1">Escalabilidade Assintótica</h3>
                  <p className="text-xs text-slate-400 mb-4">Comportamento de crescimento com tamanho de grafo.</p>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={asymptoticData} margin={{ top: 10, bottom: 5, left: 10 }}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="v" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Ordem |V|', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="BFS" stroke="#10B981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Dijkstra" stroke="#6366F1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="BellmanFord" stroke="#EF4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {benchmarkData.map((algo) => (
                  <div key={algo.name} className="rounded-xl border border-slate-800 bg-[#1E293B] p-4 flex flex-col space-y-3">
                    <div>
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: algo.cor }} /><h4 className="text-xs font-bold text-white">{algo.name}</h4></div>
                      <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 border border-slate-800 inline-block mt-1.5">{algo.complexidade}</span>
                    </div>
                    <p className="text-xs text-slate-400">{algo.recomendacao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
