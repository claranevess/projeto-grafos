import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
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
  return REGION_COLORS[region]
}

function buildDensityByNode(nodes: NodeSchema[], edges: { source: string; target: string }[]) {
  const neighborMap = new Map<string, Set<string>>()
  const edgeSet = new Set<string>()

  for (const node of nodes) {
    neighborMap.set(node.iata, new Set())
  }

  for (const edge of edges) {
    const a = edge.source
    const b = edge.target
    neighborMap.get(a)?.add(b)
    neighborMap.get(b)?.add(a)
    edgeSet.add([a, b].sort().join('|'))
  }

  return nodes.map((node) => {
    const neighbors = Array.from(neighborMap.get(node.iata) ?? [])
    const m = neighbors.length
    if (m < 2) {
      return { ...node, density: 0 }
    }

    let internalEdges = 0
    for (let i = 0; i < m; i += 1) {
      for (let j = i + 1; j < m; j += 1) {
        const key = [neighbors[i], neighbors[j]].sort().join('|')
        if (edgeSet.has(key)) {
          internalEdges += 1
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
    if (selectedRegion !== 'All' && node.region !== selectedRegion) {
      return false
    }

    if (hubFilter === 'hub' && !node.is_hub) {
      return false
    }

    if (hubFilter === 'non-hub' && node.is_hub) {
      return false
    }

    if (selectedDegree !== null) {
      if (typeof selectedDegree === 'number') {
        if (node.degree !== selectedDegree) {
          return false
        }
      } else if (selectedDegree === '0-2' && (node.degree < 0 || node.degree > 2)) {
        return false
      } else if (selectedDegree === '3-5' && (node.degree < 3 || node.degree > 5)) {
        return false
      } else if (selectedDegree === '6-9' && (node.degree < 6 || node.degree > 9)) {
        return false
      } else if (selectedDegree === '10+' && node.degree < 10) {
        return false
      }
    }

    if (selectedDensity === 'low' && node.density >= 0.33) {
      return false
    }
    if (selectedDensity === 'medium' && (node.density < 0.33 || node.density >= 0.66)) {
      return false
    }
    if (selectedDensity === 'high' && node.density < 0.66) {
      return false
    }

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
    .slice(0, 15)
    .map((node) => ({
      iata: node.iata,
      city: node.city,
      degree: node.degree,
      region: node.region as Region,
      density: node.density,
      is_hub: node.is_hub,
    }))
}

function getRegionSummary(
  nodes: Array<NodeSchema & { density: number }>,
  metrics: MetricsResponse | undefined,
) {
  const selectedByRegion = Object.fromEntries(
    REGIONS.map((region) => [
      region,
      nodes.filter((node) => node.region === region),
    ]),
  )

  return REGIONS.map((region) => {
    const regionNodes = selectedByRegion[region]
    const averageDensity = regionNodes.length
      ? regionNodes.reduce((sum, node) => sum + node.density, 0) / regionNodes.length
      : 0

    return {
      region,
      nodes: regionNodes.length,
      averageDegree: regionNodes.length
        ? regionNodes.reduce((sum, node) => sum + node.degree, 0) / regionNodes.length
        : 0,
      averageDensity,
      globalOrder: metrics?.regions.find((item) => item.region === region)?.order ?? 0,
      globalSize: metrics?.regions.find((item) => item.region === region)?.size ?? 0,
      globalDensity: metrics?.regions.find((item) => item.region === region)?.density ?? 0,
    }
  })
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
    if (!graphQuery.data) {
      return []
    }
    return buildDensityByNode(graphQuery.data.nodes, graphQuery.data.edges)
  }, [graphQuery.data])

  const filteredNodes = useMemo(
    () => applyFilters(nodes, selectedRegion, hubFilter, selectedDegree, selectedDensity),
    [nodes, selectedRegion, hubFilter, selectedDegree, selectedDensity],
  )

  const histogramData = useMemo(() => getDegreeHistogram(filteredNodes), [filteredNodes])
  const topHubsData = useMemo(() => getTopHubs(filteredNodes), [filteredNodes])
  const regionSummary = useMemo(
    () => getRegionSummary(nodes, metricsQuery.data),
    [nodes, metricsQuery.data],
  )

  const activeSummary = useMemo(() => {
    if (selectedRegion === 'All') {
      return null
    }
    return regionSummary.find((item) => item.region === selectedRegion)
  }, [regionSummary, selectedRegion])

  if (graphQuery.isLoading || metricsQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-slate-100 backdrop-blur-sm">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-8 text-center shadow-2xl shadow-slate-950/40">
          <p className="text-lg font-semibold">Carregando dashboard interativo...</p>
          <p className="mt-2 text-sm text-slate-400">Aguarde enquanto os dados são preparados.</p>
        </div>
      </div>
    )
  }

  if (graphQuery.isError || metricsQuery.isError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-slate-100 backdrop-blur-sm">
        <div className="rounded-3xl border border-red-700 bg-slate-950/95 p-8 text-center shadow-2xl shadow-slate-950/40">
          <p className="text-lg font-semibold text-red-300">Erro ao carregar os dados do dashboard.</p>
          <p className="mt-2 text-sm text-slate-400">Verifique se o backend está rodando e tente novamente.</p>
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-6 text-slate-100 backdrop-blur-sm">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Gráficos interativos</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Selecione região, hubs, grau ou densidade para filtrar todos os gráficos de uma vez.
            Clique em um filtro e veja os dados atualizados em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 hover:text-white"
          aria-label="Fechar dashboard"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Filtros ativos</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em]">Região</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['All', ...REGIONS] as Array<'All' | Region>).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(region)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selectedRegion === region
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                      }`}
                      style={region !== 'All' ? { backgroundColor: selectedRegion === region ? regionColor(region) : undefined } : undefined}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em]">Hubs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Todos', value: 'all' as HubFilter },
                    { label: 'Hubs', value: 'hub' as HubFilter },
                    { label: 'Não hubs', value: 'non-hub' as HubFilter },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setHubFilter(item.value)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        hubFilter === item.value
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em]">Grau</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Todos', value: null as DegreeFilter },
                    { label: '0–2', value: '0-2' as DegreeFilter },
                    { label: '3–5', value: '3-5' as DegreeFilter },
                    { label: '6–9', value: '6-9' as DegreeFilter },
                    { label: '10+', value: '10+' as DegreeFilter },
                  ].map((item) => {
                    const active = item.value === selectedDegree
                    return (
                      <button
                        key={`${item.value}`}
                        type="button"
                        onClick={() => setSelectedDegree(item.value)}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Clique em "0–2" mostra apenas aeroportos com grau nessa faixa.</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em]">Densidade</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Todos', value: 'all' as DensityBucket },
                    { label: 'Baixa', value: 'low' as DensityBucket },
                    { label: 'Média', value: 'medium' as DensityBucket },
                    { label: 'Alta', value: 'high' as DensityBucket },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedDensity(item.value)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selectedDensity === item.value
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Limpar filtros
              </button>
              <span className="text-xs text-slate-400">
                {filteredNodes.length} aeroportos visíveis de {nodes.length}
              </span>
              {selectedRegion !== 'All' && activeSummary ? (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {selectedRegion}: {activeSummary.nodes} aeroportos, grau médio {activeSummary.averageDegree.toFixed(1)}, densidade média {formatPercent(activeSummary.averageDensity)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Histograma de graus</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Distribuição de degree</h3>
                </div>
                <span className="text-xs text-slate-500">Clique em uma barra para filtrar</span>
              </div>
              <div className="mt-5 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} onClick={(event) => {
                    if (event?.activeLabel != null) {
                      const degree = Number(event.activeLabel)
                      setSelectedDegree((current) => (current === degree ? null : degree))
                    }
                  }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="degree" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => [value, 'Aeroportos']} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#22c55e">
                      {histogramData.map((entry) => (
                        <Cell
                          key={entry.degree}
                          fill={selectedDegree === entry.degree ? '#818cf8' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scatter</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Grau × Densidade</h3>
                </div>
                <span className="text-xs text-slate-500">Clique em uma região abaixo para filtrar</span>
              </div>
              <div className="mt-5 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="degree" name="Grau" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="density" name="Densidade" tickFormatter={(value) => formatPercent(value)} tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: '#8897a8' }} formatter={(value: number, name: string) => [name === 'density' ? formatPercent(value) : value, name]} />
                    <Scatter data={filteredNodes} fill="#38bdf8" onClick={(payload) => {
                      const point = payload?.payload
                      if (point?.region) {
                        const targetRegion = point.region as Region
                        setSelectedRegion((current) => (current === targetRegion ? 'All' : targetRegion))
                      }
                    }}>
                      {filteredNodes.map((entry) => (
                        <Cell key={entry.iata} fill={regionColor(entry.region as Region)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setSelectedRegion((current) => (current === region ? 'All' : region))}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      selectedRegion === region
                        ? 'border-white bg-white/10 text-white'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                    }`}
                    style={{ borderColor: regionColor(region) }}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ranking</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Top aeroportos por conexões</h3>
                </div>
                <span className="text-xs text-slate-500">Ordenado por grau</span>
              </div>
              <div className="mt-5 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={topHubsData} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="iata" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip formatter={(value: number) => [value, 'Grau']} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar dataKey="degree" radius={[10, 10, 10, 10]}>
                      {topHubsData.map((entry) => (
                        <Cell key={entry.iata} fill={regionColor(entry.region)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Métricas</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Comparação por região</h3>
                </div>
                <span className="text-xs text-slate-500">Métricas globais do grafo por região</span>
              </div>
              <div className="mt-5 space-y-3">
                {regionSummary.map((region) => (
                  <div
                    key={region.region}
                    className={`rounded-3xl border px-4 py-3 ${
                      selectedRegion === region.region
                        ? 'border-indigo-400 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{region.region}</p>
                        <p className="text-xs text-slate-400">Aeroportos: {region.nodes}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>Ord. {region.globalOrder}</p>
                        <p>Tam. {region.globalSize}</p>
                        <p>Dens. {formatPercent(region.globalDensity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/30">
          <h3 className="text-sm uppercase tracking-[0.2em] text-slate-400">Resumo do filtro</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Seleção</p>
              <p className="mt-2 text-sm text-white">Região: {selectedRegion}</p>
              <p className="text-sm text-white">Hubs: {hubFilter === 'all' ? 'Todos' : hubFilter === 'hub' ? 'Somente hubs' : 'Somente não hubs'}</p>
              <p className="text-sm text-white">Grau: {selectedDegree === null ? 'Todos' : selectedDegree}</p>
              <p className="text-sm text-white">Densidade: {selectedDensity === 'all' ? 'Todas' : selectedDensity}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Dados visíveis</p>
              <p className="mt-2 text-sm text-white">Aeroportos visíveis: {filteredNodes.length}</p>
              <p className="text-sm text-white">Grau médio: {filteredNodes.length ? (filteredNodes.reduce((sum, node) => sum + node.degree, 0) / filteredNodes.length).toFixed(1) : '0.0'}</p>
              <p className="text-sm text-white">Densidade média: {filteredNodes.length ? formatPercent(filteredNodes.reduce((sum, node) => sum + node.density, 0) / filteredNodes.length) : '0%'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
