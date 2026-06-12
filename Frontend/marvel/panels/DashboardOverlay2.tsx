import React, { useState, useMemo } from 'react'
import { X, FilterX, Clapperboard, Cpu, Route, Info, Lightbulb } from 'lucide-react'
import { 
  BarChart, Bar, ScatterChart, Scatter, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis, CartesianGrid 
} from 'recharts'

import { useMarvelMovies } from '@/hooks/useMarvelGraph'
import { useStore } from '@/store'
import { ALGORITHM_LABELS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'

interface DashboardOverlay2Props {
  onClose: () => void
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Avengers':        '#4ade80',
  'Iron Man':        '#fb923c',
  'Captain America': '#c084fc',
  'Thor':            '#22d3ee',
  'Spider-Man':      '#FFDE21',
  'Guardians':       '#f472b6',
  'Black Panther':   '#a3e635',
  'Ant-Man':         '#fb7185',
  'Dr Strange':      '#38bdf8',
  'Unique':          '#94a3b8',
}

const ALGO_ORDER: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']
const ALGO_COLORS: Record<AlgorithmName, string> = {
  BFS:          '#4ade80',
  DFS:          '#22d3ee',
  DIJKSTRA:     '#c084fc',
  BELLMAN_FORD: '#e3000b',
}

// COMPONENTE DO POP-UP DE INSIGHT
function InsightModal({ title, content, onClose }: { title: string, content: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1120]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700 p-6 rounded-2xl max-w-lg w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Lightbulb size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <div className="text-slate-300 text-sm leading-relaxed space-y-3">
          {content}
        </div>
      </div>
    </div>
  )
}

export function DashboardOverlay2({ onClose }: DashboardOverlay2Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All')
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)
  
  // Estado para controlar os pop-ups de insight
  const [activeInsight, setActiveInsight] = useState<{title: string, content: React.ReactNode} | null>(null)

  const { data: allMovies, isLoading } = useMarvelMovies()
  const algoTimings = useStore(s => s.algoTimings)

  const categories = useMemo(() => {
    if (!allMovies) return []
    return Array.from(new Set(allMovies.map(m => m.category))).filter(c => CATEGORY_COLORS[c])
  }, [allMovies])

  const filteredMovies = useMemo(() => {
    if (!allMovies) return []
    return allMovies.filter(movie => 
      selectedCategory === 'All' ? true : movie.category === selectedCategory
    )
  }, [allMovies, selectedCategory])

  const topRevenueData = useMemo(() => {
    return [...filteredMovies]
      .sort((a, b) => b.worldwide_gross_million - a.worldwide_gross_million)
      .slice(0, 15)
      .map(m => ({
        name: m.title.replace(/:.+/, '').trim(),
        fullName: m.title,
        revenue: m.worldwide_gross_million || 0,
        category: m.category,
      }))
  }, [filteredMovies])

  const categoryRoiData = useMemo(() => {
    const byCategory: Record<string, number[]> = {}
    allMovies?.forEach(m => {
      if (!byCategory[m.category]) byCategory[m.category] = []
      byCategory[m.category].push(m.roi_percent || 0)
    })
    return categories.map(cat => ({
      category: cat,
      avgROI: byCategory[cat] ? byCategory[cat].reduce((a, b) => a + b, 0) / byCategory[cat].length : 0,
    }))
  }, [allMovies, categories])

  const degreeData = useMemo(() => {
    const degreeCount: Record<number, number> = {}
    filteredMovies.forEach(m => {
      const deg = typeof m.degree === 'number' && !isNaN(m.degree) ? m.degree : 0;
      degreeCount[deg] = (degreeCount[deg] ?? 0) + 1
    })
    return Object.entries(degreeCount)
      .map(([deg, count]) => ({ degree: Number(deg), count }))
      .sort((a, b) => a.degree - b.degree)
  }, [filteredMovies])

  const scatterFinancialData = useMemo(() => {
    return filteredMovies.map(m => ({
      budget: m.budget_million || 0,
      roi: m.roi_percent || 0,
      category: m.category,
      title: m.title,
    }))
  }, [filteredMovies])

  const scatterDegreeRevenueData = useMemo(() => {
    return filteredMovies.map(m => ({
      degree: typeof m.degree === 'number' ? m.degree : 0,
      revenue: typeof m.worldwide_gross_million === 'number' ? m.worldwide_gross_million : 0,
      category: m.category,
      title: m.title || 'Filme Desconhecido',
    }))
  }, [filteredMovies])

  const algoData = useMemo(() => {
    return ALGO_ORDER
      .filter(alg => typeof algoTimings[alg] === 'number' && algoTimings[alg]! > 0)
      .map(alg => ({
        name: ALGORITHM_LABELS[alg],
        algorithm: alg,
        time: algoTimings[alg]!,
      }))
  }, [algoTimings])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-slate-100 select-none overflow-hidden font-sans">
      
      {/* RENDERIZAÇÃO DO MODAL DE INSIGHT */}
      {activeInsight && (
        <InsightModal 
          title={activeInsight.title} 
          content={activeInsight.content} 
          onClose={() => setActiveInsight(null)} 
        />
      )}

      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Análise Estrutural <span className="text-indigo-400">Universo Marvel</span>
          </h2>
          
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedCategory('All'); setSelectedMovie(null); }} 
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <FilterX size={16} /> Limpar Filtros
          </button>
          <button 
            onClick={onClose} 
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#0B1120]">
        <div className="mx-auto max-w-[1500px] space-y-6">
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-11">
            <button 
              onClick={() => setSelectedCategory('All')} 
              className={`flex flex-col items-start justify-center rounded-xl border p-3 transition-all text-left ${selectedCategory === 'All' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-800 bg-[#1E293B] hover:border-slate-700'}`}
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Universo</span>
              <span className="mt-1 text-xl font-black text-white">{allMovies?.length || 0}</span>
            </button>
            
            {categories.map((category) => {
              const color = CATEGORY_COLORS[category]
              const isActive = selectedCategory === category
              const count = allMovies?.filter(m => m.category === category).length || 0
              
              return (
                <button 
                  key={category} 
                  onClick={() => setSelectedCategory(isActive ? 'All' : category)} 
                  className="flex flex-col items-start justify-center rounded-xl border p-3 transition-all text-left" 
                  style={{ 
                    borderColor: isActive ? color : '#1e293b', 
                    backgroundColor: isActive ? `${color}20` : '#1E293B' 
                  }}
                >
                  <div className="flex w-full items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1" style={{ color: isActive ? color : '#94a3b8' }}>{category}</span>
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  </div>
                  <span className="text-xl font-black text-white">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[350px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clapperboard size={16}/> Top Bilheteira Mundial ($M)</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "O Efeito de Concentração (Hubs de Bilheteira)",
                    content: <p>A bilheteira no MCU não é distribuída de forma uniforme. Os eventos de \"Crossover\" (como os grandes filmes dos Vingadores) funcionam como <strong>super-hubs financeiros</strong>, capturando uma fatia desproporcional da receita total. Isto prova que juntar os nós isolados numa única narrativa gera retornos exponenciais.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRevenueData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} onClick={(data) => { if(data && data.activePayload) setSelectedMovie(data.activePayload[0].payload.fullName) }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v: any) => { const num = Number(v) || 0; return [`$${num.toFixed(0)}M`, 'Bilheteira Mundial']; }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topRevenueData.map((entry, index) => {
                      const baseColor = CATEGORY_COLORS[entry.category] || '#6366f1'
                      const isSelected = selectedMovie === entry.fullName
                      const isFaded = selectedMovie && !isSelected
                      return <Cell key={`cell-${index}`} fill={baseColor} opacity={isFaded ? 0.3 : 1} cursor="pointer" />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[350px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Média de Retorno (ROI %) por Franquia</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Eficiência dos Nós Periféricos",
                    content: <p>Nem sempre a maior bilheteira significa o projeto mais eficiente. Franquias de personagens originalmente menos conhecidos podem operar com orçamentos menores, gerando um ROI (Retorno sobre o Investimento) surpreendente. Isto revela que <strong>nós periféricos na rede</strong> são fundamentais para a saúde financeira do modelo de estúdio a longo prazo.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRoiData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }} onClick={(data) => { if(data && data.activeLabel) setSelectedCategory(data.activeLabel) }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} angle={-45} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v: any) => { const num = Number(v) || 0; return [`${num.toFixed(1)}%`, 'ROI Médio']; }}
                  />
                  <Bar dataKey="avgROI" radius={[4, 4, 0, 0]}>
                    {categoryRoiData.map((entry, index) => {
                      const isSelected = selectedCategory === entry.category || selectedCategory === 'All'
                      return <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#334155'} opacity={isSelected ? 1 : 0.3} cursor="pointer" />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[400px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Eficiência de Risco: Orçamento vs ROI</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "A Fronteira do Risco no MCU",
                    content: <p>Este gráfico de dispersão ilustra o risco financeiro assumido. Filmes posicionados no eixo inferior (alto orçamento, baixo ROI relativo) mostram os limites do modelo de blockbusters. Os verdadeiros triunfos do estúdio são os <strong>"unicórnios"</strong> localizados no topo à esquerda: investimentos contidos que explodiram em popularidade perante o público.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" dataKey="budget" name="Orçamento" unit="M" stroke="#94a3b8" fontSize={11} label={{ value: 'Orçamento ($M)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="number" dataKey="roi" name="ROI" unit="%" stroke="#94a3b8" fontSize={11} label={{ value: 'Retorno (ROI %)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                  <ZAxis type="category" dataKey="title" name="Filme" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v: any, name: string) => { const num = Number(v) || 0; return [name === 'Orçamento' ? `$${num}M` : `${num.toFixed(0)}%`, name]; }}
                  />
                  <Scatter data={scatterFinancialData} onClick={(data) => setSelectedMovie(data.title)}>
                    {scatterFinancialData.map((entry, index) => {
                      const isSelected = selectedMovie === entry.title
                      const isFaded = selectedMovie && !isSelected
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.category] || '#cbd5e1'} 
                          opacity={isFaded ? 0.2 : 0.9} 
                          stroke={isSelected ? '#fff' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          cursor="pointer"
                        />
                      )
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[400px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Route size={16}/> Impacto da Conectividade na Bilheteira</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "O Prémio da Centralidade (Teoria de Grafos vs Receita)",
                    content: <p>Este cruzamento é revelador: existe uma <strong>correlação direta entre o Grau do filme e o seu desempenho financeiro.</strong> Filmes altamente conectados funcionam como "nós centrais" críticos do grafo narrativo. Tornam-se visualizações quase obrigatórias para os espectadores entenderem o resto do universo, impulsionando a bilheteira para níveis recorde.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" dataKey="degree" name="Grau" stroke="#94a3b8" fontSize={11} label={{ value: 'Grau (Nº de Conexões no Grafo)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="number" dataKey="revenue" name="Bilheteira" unit="M" stroke="#94a3b8" fontSize={11} label={{ value: 'Bilheteira Mundial ($M)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                  <ZAxis type="category" dataKey="title" name="Filme" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v: any, name: string) => { const num = Number(v) || 0; return [name === 'Bilheteira' ? `$${num}M` : num, name]; }}
                  />
                  <Scatter data={scatterDegreeRevenueData} onClick={(data) => setSelectedMovie(data.title)}>
                    {scatterDegreeRevenueData.map((entry, index) => {
                      const isSelected = selectedMovie === entry.title
                      const isFaded = selectedMovie && !isSelected
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.category] || '#cbd5e1'} 
                          opacity={isFaded ? 0.2 : 0.9} 
                          stroke={isSelected ? '#fff' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          cursor="pointer"
                        />
                      )
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-10">
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[300px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Conectividade: Distribuição de Graus</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Arquitetura Scale-Free do Universo",
                    content: <p>À semelhança do que acontece na malha aérea de aeroportos, o universo cinematográfico partilha uma topologia de <strong>Redes Livres de Escala</strong> (Lei de Potência). A esmagadora maioria dos filmes liga-se a poucos outros (formando núcleos), enquanto uma pequena elite de filmes tem graus gigantescos de conexões. Esta assimetria é o que mantém a rede coesa sem saturar e cansar o espetador em cada lançamento.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={degreeData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="degree" stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Grau do Filme', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} label={{ value: 'Qtd de Filmes', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Qtd de Filmes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* BENCHMARKING SEM BOTÃO DE INSIGHT (Conforme pedido) */}
            <div className="rounded-xl border border-indigo-900/30 bg-indigo-950/20 p-5 h-[300px] flex flex-col">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Cpu size={16}/> Benchmarking de Algoritmos</h3>
              {algoData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic text-center">
                  Execute uma busca no painel lateral do mapa para aferir a performance.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={algoData} layout="vertical" margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'Tempo de Execução (ms)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip 
                      cursor={{ fill: '#334155', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                      formatter={(v: any) => {
                        const num = Number(v) || 0;
                        return [`${num.toFixed(2)}ms`, 'Tempo de Execução'];
                      }}
                    />
                    <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                      {algoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ALGO_COLORS[entry.algorithm]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}