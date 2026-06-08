import { useState, useMemo } from 'react'
import { X, FilterX, BarChart3, Route, Cpu, Info, SlidersHorizontal } from 'lucide-react'
import { 
  BarChart, Bar, ScatterChart, Scatter, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'

import { useMarvelMovies } from '@/hooks/useMarvelGraph'
import { useStore } from '@/store'
import { CATEGORY_COLORS, ALGORITHM_LABELS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'

interface DashboardOverlay2Props {
  onClose: () => void
}

type TabId = 'macro' | 'routes' | 'benchmarking'

// --- CONSTANTES LOCAIS ---
const ALGO_ORDER: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']
const ALGO_COLORS: Record<AlgorithmName, string> = {
  BFS:          '#4ade80',
  DFS:          '#22d3ee',
  DIJKSTRA:     '#c084fc',
  BELLMAN_FORD: '#e3000b',
}

export function DashboardOverlay2({ onClose }: DashboardOverlay2Props) {
  const [activeTab, setActiveTab] = useState<TabId>('macro')
  
  // --- ESTADOS DE FILTROS ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [minBudget, setMinBudget] = useState<number>(0)

  // 1. Coleta dos dados
  const { data: allMovies, isLoading } = useMarvelMovies()
  const algoTimings = useStore(s => s.algoTimings)

  // 2. Extração de categorias
  const categories = useMemo(() => {
    if (!allMovies) return []
    return Array.from(new Set(allMovies.map(m => m.category)))
  }, [allMovies])

  // 3. Aplicação do Filtro
  const filteredMovies = useMemo(() => {
    if (!allMovies) return []
    return allMovies.filter(movie => {
      const matchesCategory = selectedCategory === 'all' || movie.category === selectedCategory
      const matchesBudget = movie.budget_million >= minBudget
      return matchesCategory && matchesBudget
    })
  }, [allMovies, selectedCategory, minBudget])

  // --- PREPARAÇÃO DE DADOS PARA OS GRÁFICOS (useMemo para performance) ---

  const topRevenueData = useMemo(() => {
    return [...filteredMovies]
      .sort((a, b) => b.worldwide_gross_million - a.worldwide_gross_million)
      .slice(0, 12)
      .map(m => ({
        name: m.title.replace(/:.+/, '').trim(),
        revenue: m.worldwide_gross_million,
        category: m.category,
      }))
  }, [filteredMovies])

  const categoryRoiData = useMemo(() => {
    const byCategory: Record<string, number[]> = {}
    filteredMovies.forEach(m => {
      if (!byCategory[m.category]) byCategory[m.category] = []
      byCategory[m.category].push(m.roi_percent)
    })
    return Object.entries(byCategory).map(([category, rois]) => ({
      category,
      avgROI: rois.reduce((a, b) => a + b, 0) / rois.length,
    }))
  }, [filteredMovies])

  const degreeData = useMemo(() => {
    const degreeCount: Record<number, number> = {}
    filteredMovies.forEach(m => {
      degreeCount[m.degree] = (degreeCount[m.degree] ?? 0) + 1
    })
    return Object.entries(degreeCount)
      .map(([deg, count]) => ({ degree: Number(deg), count }))
      .sort((a, b) => a.degree - b.degree)
  }, [filteredMovies])

  const scatterData = useMemo(() => {
    return filteredMovies.map(m => ({
      budget: m.budget_million,
      roi: m.roi_percent,
      category: m.category,
      title: m.title,
    }))
  }, [filteredMovies])

  const algoData = useMemo(() => {
    return ALGO_ORDER
      .filter(alg => algoTimings[alg] !== undefined)
      .map(alg => ({
        name: ALGORITHM_LABELS[alg],
        algorithm: alg,
        time: algoTimings[alg]!,
      }))
  }, [algoTimings])


  const handleResetFilters = () => {
    setSelectedCategory('all')
    setMinBudget(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl text-slate-100 font-sans animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                Painel de Análise Interativo
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Métricas conectadas diretamente ao grafo Marvel
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/20 px-6 py-2 gap-2">
          <button onClick={() => setActiveTab('macro')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors border ${activeTab === 'macro' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Info size={14} /> Visão Geral & Bilheteria
          </button>
          <button onClick={() => setActiveTab('routes')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors border ${activeTab === 'routes' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Route size={14} /> Distribuição, Grafos & ROI
          </button>
          <button onClick={() => setActiveTab('benchmarking')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors border ${activeTab === 'benchmarking' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Cpu size={14} /> Benchmarking de Algoritmos
          </button>
        </div>

        {/* Barra de Filtros (Oculta na aba de Benchmarking) */}
        {activeTab !== 'benchmarking' && (
          <div className="bg-slate-900/40 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <SlidersHorizontal size={14} className="text-indigo-400" />
              <span>Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-[11px]">Categoria:</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-[11px]">
                <option value="all">Todas</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-[11px]">Orçamento Mín.:</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="400" step="50" value={minBudget} onChange={(e) => setMinBudget(Number(e.target.value))} className="accent-indigo-500 h-1 w-24 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                <span className="text-[11px] text-indigo-300 min-w-[50px]">${minBudget}M</span>
              </div>
            </div>
            {(selectedCategory !== 'all' || minBudget > 0) && (
              <button onClick={handleResetFilters} className="ml-auto flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 rounded transition-colors">
                <FilterX size={12} /> Limpar ({filteredMovies.length})
              </button>
            )}
          </div>
        )}

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0B0F19]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400">
              A carregar dados da rede...
            </div>
          ) : (
            <>
              {/* ABA 1: VISÃO GERAL */}
              {activeTab === 'macro' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-slate-800 bg-[#111726] p-5">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Top Filmes por Bilheteria Mundial</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Valores em milhões de dólares (US$)</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-lg">
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topRevenueData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#e2e8f0', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: 12, fontFamily: 'monospace', color: '#f8fafc' }}
                            formatter={(v: number) => [`$${v.toFixed(0)}M`, 'Bilheteria']}
                          />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                            {topRevenueData.map((entry, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: DISTRIBUIÇÃO E ROI */}
              {activeTab === 'routes' && (
                <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-200">
                  {/* Gráfico de Barras: ROI por Categoria */}
                  <div className="rounded-xl border border-slate-800 bg-[#111726] p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">Média de ROI por Categoria</h3>
                      <p className="text-[10px] text-slate-400 font-mono mb-4">Retorno sobre investimento (%)</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-lg">
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={categoryRoiData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                          <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: 12, fontFamily: 'monospace', color: '#f8fafc' }}
                            formatter={(v: number) => [`${v.toFixed(0)}%`, 'ROI Médio']}
                          />
                          <Bar dataKey="avgROI" radius={[4, 4, 0, 0]}>
                            {categoryRoiData.map((entry, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#888'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Histograma: Distribuição de Graus */}
                  <div className="rounded-xl border border-slate-800 bg-[#111726] p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">Distribuição de Graus</h3>
                      <p className="text-[10px] text-slate-400 font-mono mb-4">Conectividade dos filmes</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-lg">
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={degreeData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                          <XAxis dataKey="degree" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: 12, fontFamily: 'monospace', color: '#f8fafc' }}
                            formatter={(v: number) => [v, 'Qtd de Filmes']}
                            labelFormatter={l => `Grau: ${l}`}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Scatter Plot: Orçamento vs ROI */}
                  <div className="rounded-xl border border-slate-800 bg-[#111726] p-5 md:col-span-2">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-1">Correlação: Orçamento vs ROI</h3>
                      <p className="text-[10px] text-slate-400 font-mono mb-4">Dispersão de sucesso financeiro</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-lg">
                      <ResponsiveContainer width="100%" height={220}>
                        <ScatterChart margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                          <XAxis dataKey="budget" type="number" name="Orçamento" unit="M" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <YAxis dataKey="roi" type="number" name="ROI" unit="%" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: 12, fontFamily: 'monospace', color: '#f8fafc' }}
                            formatter={(v: number, name: string) => [name === 'Orçamento' ? `$${v}M` : `${v.toFixed(0)}%`, name]}
                            labelFormatter={() => ''}
                          />
                          <Scatter data={scatterData} shape="circle">
                            {scatterData.map((p, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[p.category] ?? '#888'} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: BENCHMARKING (Algoritmos) */}
              {activeTab === 'benchmarking' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-slate-800 bg-[#111726] p-5">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Performance Real Aferida</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Tempos de execução (ms) da última busca de rotas</p>
                    </div>
                    <div className="bg-slate-900/40 p-4 border border-slate-800/60 rounded-lg">
                      {algoData.length === 0 ? (
                        <p className="text-xs font-mono text-slate-500 italic p-4 text-center">
                          Execute uma busca (ex: BFS ou Dijkstra) no painel lateral para visualizar os tempos de execução.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={algoData} margin={{ left: 0, right: 8, top: 0, bottom: 24 }}>
                            <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={40} tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} label={{ value: 'ms', position: 'insideTopLeft', fontSize: 10, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: 12, fontFamily: 'monospace', color: '#f8fafc' }}
                              formatter={(v: number) => [`${v.toFixed(2)}ms`, 'Tempo (ms)']}
                            />
                            <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                              {algoData.map((entry, i) => (
                                <Cell key={i} fill={ALGO_COLORS[entry.algorithm]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}