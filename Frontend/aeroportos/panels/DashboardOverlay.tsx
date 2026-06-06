import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, FilterX } from 'lucide-react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts'
import { graphApi } from '@/lib/api'
import { REGIONS, REGION_COLORS, type Region } from '@/lib/constants'
import type { NodeSchema, MetricsResponse } from '@/lib/types'

interface DashboardOverlayProps {
  onClose: () => void
}

type HubFilter = 'all' | 'hub' | 'non-hub'
type DegreeFilter = number | '0-2' | '3-5' | '6-9' | '10+' | null
type DensityBucket = 'all' | 'low' | 'medium' | 'high'

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function regionColor(region: Region) {
  return REGION_COLORS[region] || '#cbd5e1'
}

// 🚀 OTIMIZAÇÃO: Cálculo de densidade refeito. Zero alocações de string = Alta Performance.
function buildDensityByNode(nodes: NodeSchema[], edges: { source: string; target: string }[]) {
  const neighborMap = new Map<string, Set<string>>()

  for (const node of nodes) {
    neighborMap.set(node.iata, new Set())
  }

  for (const edge of edges) {
    neighborMap.get(edge.source)?.add(edge.target)
    neighborMap.get(edge.target)?.add(edge.source)
  }

  return nodes.map((node) => {
    const neighbors = Array.from(neighborMap.get(node.iata) ?? [])
    const m = neighbors.length
    if (m < 2) return { ...node, density: 0 }

    let internalEdges = 0
    // Busca O(1) usando o Set ao invés de concatenação/sort de strings
    for (let i = 0; i < m; i++) {
      const u = neighbors[i]
      const uNeighbors = neighborMap.get(u)!
      for (let j = i + 1; j < m; j++) {
        if (uNeighbors.has(neighbors[j])) {
          internalEdges++
        }
      }
    }

    const maxEdges = (m * (m - 1)) / 2
    const density = maxEdges > 0 ? internalEdges / maxEdges : 0
    return { ...node, density }
  })
}

function applyFilters(
  nodes: Array<NodeSchema & { density: number }>,
  selectedRegion: Region | 'All',
  hubFilter: HubFilter,
  selectedDegree: DegreeFilter,
  selectedDensity: DensityBucket,
) {
  return nodes.filter((node) => {
    if (selectedRegion !== 'All' && node.region !== selectedRegion) return false
    if (hubFilter === 'hub' && !node.is_hub) return false
    if (hubFilter === 'non-hub' && node.is_hub) return false

    if (selectedDegree !== null) {
      if (typeof selectedDegree === 'number') {
        if (node.degree !== selectedDegree) return false
      } else if (selectedDegree === '0-2' && (node.degree < 0 || node.degree > 2)) return false
      else if (selectedDegree === '3-5' && (node.degree < 3 || node.degree > 5)) return false
      else if (selectedDegree === '6-9' && (node.degree < 6 || node.degree > 9)) return false
      else if (selectedDegree === '10+' && node.degree < 10) return false
    }

    if (selectedDensity === 'low' && node.density >= 0.33) return false
    if (selectedDensity === 'medium' && (node.density < 0.33 || node.density >= 0.66)) return false
    if (selectedDensity === 'high' && node.density < 0.66) return false

    return true
  })
}

function getDegreeHistogram(nodes: Array<NodeSchema & { density: number }>) {
  const histogram = new Map<number, number>()
  for (const node of nodes) {
    histogram.set(node.degree, (histogram.get(node.degree) ?? 0) + 1)
  }
  return Array.from(histogram.entries())
    .map(([degree, count]) => ({ degree, count }))
    .sort((a, b) => a.degree - b.degree)
}

function getTopHubs(nodes: Array<NodeSchema & { density: number }>) {
  return [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10) // Reduzido de 15 para 10 para ficar mais limpo
    .map((node) => ({
      iata: node.iata,
      city: node.city,
      degree: node.degree,
      region: node.region as Region,
      density: node.density,
    }))
}

export function DashboardOverlay({ onClose }: DashboardOverlayProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | 'All'>('All')
  const [hubFilter, setHubFilter] = useState<HubFilter>('all')
  const [selectedDegree, setSelectedDegree] = useState<DegreeFilter>(null)
  const [selectedDensity, setSelectedDensity] = useState<DensityBucket>('all')

  const graphQuery = useQuery({
    queryKey: ['dashboardGraph'],
    queryFn: graphApi.getGraph,
    staleTime: Infinity,
  })
  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: graphApi.getMetrics,
    staleTime: Infinity,
  })

  const nodes = useMemo(() => {
    if (!graphQuery.data) return []
    return buildDensityByNode(graphQuery.data.nodes, graphQuery.data.edges)
  }, [graphQuery.data])

  const filteredNodes = useMemo(
    () => applyFilters(nodes, selectedRegion, hubFilter, selectedDegree, selectedDensity),
    [nodes, selectedRegion, hubFilter, selectedDegree, selectedDensity],
  )

  const histogramData = useMemo(() => getDegreeHistogram(filteredNodes), [filteredNodes])
  const topHubsData = useMemo(() => getTopHubs(filteredNodes), [filteredNodes])

  if (graphQuery.isLoading || metricsQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-lg font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (graphQuery.isError || metricsQuery.isError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] text-slate-100">
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
          <p className="text-lg font-semibold text-red-400">Erro ao carregar dados.</p>
        </div>
      </div>
    )
  }

  function resetFilters() {
    setSelectedRegion('All')
    setHubFilter('all')
    setSelectedDegree(null)
    setSelectedDensity('all')
  }

  return (
    // Removido o backdrop-blur global que degrada performance
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-slate-100">
      {/* HEADER */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Analytics <span className="text-indigo-400">Dashboard</span></h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <FilterX size={16} /> Limpar Filtros
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (SCROLLÁVEL) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          
          {/* LINHA 1: CARDS DE REGIÃO COMO FILTROS PRINCIPAIS */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => setSelectedRegion('All')}
              className={`flex flex-col items-start justify-center rounded-xl border p-4 transition-all ${
                selectedRegion === 'All' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-[#1E293B] hover:border-slate-600'
              }`}
            >
              <span className="text-sm font-semibold text-slate-200">Visão Geral</span>
              <span className="mt-1 text-2xl font-bold text-white">{filteredNodes.length} <span className="text-sm font-normal text-slate-400">Aeros</span></span>
            </button>
            
            {REGIONS.map((region) => {
              const rColor = regionColor(region)
              const isActive = selectedRegion === region
              const regionNodes = nodes.filter(n => n.region === region).length
              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(isActive ? 'All' : region)}
                  className={`group flex flex-col items-start justify-center rounded-xl border p-4 transition-all`}
                  style={{
                    borderColor: isActive ? rColor : '#1e293b',
                    backgroundColor: isActive ? `${rColor}15` : '#1E293B',
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: isActive ? rColor : '#cbd5e1' }}>{region}</span>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rColor, opacity: isActive ? 1 : 0.4 }} />
                  </div>
                  <span className="mt-1 text-2xl font-bold text-white group-hover:text-slate-200">{regionNodes}</span>
                </button>
              )
            })}
          </div>

          {/* LINHA 2: GRÁFICOS */}
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* HISTOGRAMA */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-white">Distribuição de Conexões (Grau)</h3>
                <p className="text-xs text-slate-400">Clique em uma barra para filtrar especificamente</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} onClick={(e) => {
                    if (e?.activeLabel != null) {
                      const deg = Number(e.activeLabel)
                      setSelectedDegree(current => current === deg ? null : deg)
                    }
                  }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="degree" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: number) => [val, 'Aeroportos']} 
                    />
                    {/* isAnimationActive={false} para evitar lag ao clicar */}
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {histogramData.map((entry) => (
                        <Cell 
                          key={entry.degree} 
                          fill={selectedDegree === entry.degree ? '#818CF8' : '#3B82F6'} 
                          style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SCATTER */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-white">Grau vs Densidade da Rede</h3>
                <p className="text-xs text-slate-400">Clique num ponto para focar na Região correspondente</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="degree" name="Grau" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="density" name="Densidade" tickFormatter={formatPercent} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: number, name: string) => [name === 'Densidade' ? formatPercent(val) : val, name === 'density' ? 'Densidade' : 'Grau']} 
                    />
                    {/* Animações desabilitadas no scatter garantem zero "travamentos" de re-render */}
                    <Scatter data={filteredNodes} isAnimationActive={false} onClick={(payload) => {
                      if (payload?.payload?.region) {
                        const target = payload.payload.region as Region
                        setSelectedRegion(current => current === target ? 'All' : target)
                      }
                    }}>
                      {filteredNodes.map((entry) => (
                        <Cell 
                          key={entry.iata} 
                          fill={regionColor(entry.region as Region)} 
                          style={{ cursor: 'pointer', opacity: 0.85 }}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* LINHA 3: TOP HUBS e SUBFILTROS */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* SUB FILTROS RÁPIDOS */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5">
              <h3 className="mb-5 font-semibold text-white">Segmentação Rápida</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Categoria (Hubs)</label>
                  <div className="flex gap-2 rounded-lg bg-slate-900/50 p-1">
                    {[
                      { l: 'Todos', v: 'all' },
                      { l: 'Apenas Hubs', v: 'hub' },
                      { l: 'Secundários', v: 'non-hub' }
                    ].map(f => (
                      <button
                        key={f.v}
                        onClick={() => setHubFilter(f.v as HubFilter)}
                        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${hubFilter === f.v ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Classificação de Densidade</label>
                  <div className="flex gap-2 rounded-lg bg-slate-900/50 p-1">
                    {[
                      { l: 'Qualquer', v: 'all' },
                      { l: 'Baixa', v: 'low' },
                      { l: 'Média', v: 'medium' },
                      { l: 'Alta', v: 'high' }
                    ].map(f => (
                      <button
                        key={f.v}
                        onClick={() => setSelectedDensity(f.v as DensityBucket)}
                        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${selectedDensity === f.v ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RANKING BARCHART */}
            <div className="col-span-2 rounded-xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-white">Top 10 Aeroportos (Visão Atual)</h3>
                <p className="text-xs text-slate-400">Os aeroportos mais conectados considerando os filtros ativos</p>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topHubsData} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="iata" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(val: number) => [val, 'Conexões (Grau)']} 
                    />
                    <Bar dataKey="degree" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {topHubsData.map((entry) => (
                        <Cell key={entry.iata} fill={regionColor(entry.region)} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}