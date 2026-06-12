import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, FilterX, Info, Lightbulb } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Line
} from 'recharts'
import { graphApi } from '@/lib/api'
import type { NodeSchema } from '@/lib/types'

interface DashboardOverlayProps {
  onClose: () => void
}

const REGIONS = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste']
const REGION_COLORS: Record<string, string> = {
  'Norte': '#22d3ee',
  'Nordeste': '#fb923c',
  'Sudeste': '#c084fc',
  'Sul': '#4ade80',
  'Centro-Oeste': '#fbbf24',
}

function processGraphData(nodes: NodeSchema[], edges: { source: string; target: string }[]) {
  const neighborMap = new Map<string, Set<string>>()
  nodes.forEach(n => neighborMap.set(n.iata, new Set()))
  
  edges.forEach(e => {
    neighborMap.get(e.source)?.add(e.target)
    neighborMap.get(e.target)?.add(e.source)
  })

  return nodes.map(node => {
    const neighbors = Array.from(neighborMap.get(node.iata) || [])
    const degree = neighbors.length

    let internalEdges = 0
    for (let i = 0; i < degree; i++) {
      const u = neighbors[i]
      const uNeighbors = neighborMap.get(u)!
      for (let j = i + 1; j < degree; j++) {
        if (uNeighbors.has(neighbors[j])) internalEdges++
      }
    }
    const maxEdges = (degree * (degree - 1)) / 2
    const density = maxEdges > 0 ? internalEdges / maxEdges : 0

    return {
      ...node,
      regiaoFormatada: node.region || (node as any).regiao || 'Desconhecida',
      degree,
      density: Number(density.toFixed(3))
    }
  })
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

export function DashboardOverlay({ onClose }: DashboardOverlayProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | 'All'>('All')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  // Estado para controlar qual pop-up de insight está aberto
  const [activeInsight, setActiveInsight] = useState<{title: string, content: React.ReactNode} | null>(null)

  const graphQuery = useQuery({
    queryKey: ['dashboardGraph'],
    queryFn: graphApi.getGraph,
    staleTime: Infinity,
  })

  const processedNodes = useMemo(() => {
    if (!graphQuery.data) return []
    return processGraphData(graphQuery.data.nodes, graphQuery.data.edges)
  }, [graphQuery.data])

  const filteredNodes = useMemo(() => {
    return processedNodes.filter(n => 
      selectedRegion === 'All' ? true : n.regiaoFormatada === selectedRegion
    )
  }, [processedNodes, selectedRegion])

  const histogramData = useMemo(() => {
    const bins: Record<number, number> = {}
    filteredNodes.forEach(n => {
      bins[n.degree] = (bins[n.degree] || 0) + 1
    })
    return Object.entries(bins).map(([grau, contagem]) => ({
      grau: Number(grau),
      contagem
    })).sort((a, b) => a.grau - b.grau)
  }, [filteredNodes])

  const rankingData = useMemo(() => {
    return [...filteredNodes]
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 25) 
  }, [filteredNodes])

  const regionalData = useMemo(() => {
    const stats: Record<string, { nodes: number, edges: number }> = {}
    REGIONS.forEach(r => stats[r] = { nodes: 0, edges: 0 })

    processedNodes.forEach(n => {
      if (stats[n.regiaoFormatada]) {
        stats[n.regiaoFormatada].nodes += 1
        stats[n.regiaoFormatada].edges += n.degree
      }
    })

    return REGIONS.map(r => ({
      regiao: r,
      ordem: stats[r].nodes,
      arestas: stats[r].edges / 2 
    }))
  }, [processedNodes])

  const scatterData = useMemo(() => {
    return filteredNodes.map(n => ({
      iata: n.iata,
      grau: n.degree,
      densidade: n.density,
      regiao: n.regiaoFormatada
    }))
  }, [filteredNodes])

  if (graphQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1120] text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-slate-100 select-none overflow-hidden font-sans">
      
      {/* POP-UP DE INSIGHT (Renderizado se activeInsight não for null) */}
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
            Análise Estrutural Interativa <span className="text-indigo-400">Malha Aérea</span>
          </h2>
          <p className="text-xs text-slate-400">Filtros dinâmicos cruzados calculados no navegador.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedRegion('All'); setSelectedNode(null); }} 
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
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button 
              onClick={() => setSelectedRegion('All')} 
              className={`flex flex-col items-start justify-center rounded-xl border p-4 transition-all text-left ${selectedRegion === 'All' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-800 bg-[#1E293B] hover:border-slate-700'}`}
            >
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brasil</span>
              <span className="mt-1 text-2xl font-black text-white">{processedNodes.length}</span>
            </button>
            
            {REGIONS.map((region) => {
              const color = REGION_COLORS[region]
              const isActive = selectedRegion === region
              const count = processedNodes.filter(n => n.regiaoFormatada === region).length
              return (
                <button 
                  key={region} 
                  onClick={() => setSelectedRegion(isActive ? 'All' : region)} 
                  className="flex flex-col items-start justify-center rounded-xl border p-4 transition-all text-left" 
                  style={{ 
                    borderColor: isActive ? color : '#1e293b', 
                    backgroundColor: isActive ? `${color}20` : '#1E293B' 
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isActive ? color : '#94a3b8' }}>{region}</span>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <span className="mt-1 text-2xl font-black text-white">{count}</span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* GRÁFICO: Comparação Regional */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[350px] flex flex-col relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Comparação Regional</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Concentração Regional",
                    content: <p>A região <strong>Sudeste</strong> domina massivamente o número de conexões da malha aérea brasileira, mesmo tendo uma quantidade de aeroportos (ordem) similar a outras regiões. Isso escancara a enorme centralização logística do Brasil, onde a maioria dos voos faz escala em SP ou RJ antes de ir para o destino final.</p>
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={regionalData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }} onClick={(data) => { if(data && data.activeLabel) setSelectedRegion(data.activeLabel) }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="regiao" stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Região', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Ordem', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Arestas', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar yAxisId="left" dataKey="ordem" name="Qtd Aeroportos (Ordem)" radius={[4, 4, 0, 0]}>
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={selectedRegion === entry.regiao || selectedRegion === 'All' ? REGION_COLORS[entry.regiao] : '#334155'} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="arestas" name="Qtd Conexões" stroke="#cbd5e1" strokeWidth={3} dot={{ r: 4, fill: '#cbd5e1' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* GRÁFICO: Histograma de Graus */}
            <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[350px] flex flex-col relative group">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Distribuição de Graus (Scale-Free)</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Topologia Scale-Free (Livre de Escala)",
                    content: (
                      <>
                        <p>O formato em "L" (cauda longa) deste histograma comprova que a malha aérea brasileira segue a <strong>Lei de Potência</strong>, típica de Redes Complexas Livres de Escala.</p>
                        <p>A enorme barra à esquerda indica que a grande maioria dos aeroportos possui apenas 1 ou 2 conexões (Gargalos). As pequenas barras estendendo-se à direita representam a minoria absoluta de aeroportos (Hubs) que concentram dezenas de conexões.</p>
                      </>
                    )
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="grau" stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Grau', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Nº de Aeroportos', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="contagem" name="Nº de Aeroportos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* GRÁFICO: Ranking */}
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[400px] flex flex-col relative group">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Ranking de Conectividade (Top 25)</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Centralidade e Hubs Críticos",
                    content: (
                      <>
                        <p>Este ranking expõe a fragilidade estrutural da malha: Aeroportos como <strong>Guarulhos (GRU)</strong>, <strong>Congonhas (CGH)</strong> e <strong>Campinas (VCP)</strong> lideram com folga.</p>
                        <p>Eles são os "Nós Críticos" do grafo. Devido à sua centralidade, um evento de falha (como chuvas fortes ou paralisações) em apenas um destes aeroportos causa um efeito cascata que atrasa voos no Brasil inteiro.</p>
                      </>
                    )
                  })} 
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver Análise"
                >
                  <Info size={18} />
                </button>
              </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }} onClick={(data) => { if(data && data.activePayload) setSelectedNode(data.activePayload[0].payload.iata) }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="iata" stroke="#94a3b8" fontSize={10} interval={0} tickLine={false} label={{ value: 'Aeroportos (IATA)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Grau de Conexão', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="degree" name="Grau" radius={[4, 4, 0, 0]}>
                  {rankingData.map((entry, index) => {
                    const baseColor = REGION_COLORS[entry.regiaoFormatada] || '#6366f1'
                    const isSelected = selectedNode === entry.iata
                    const isFaded = selectedNode && !isSelected
                    return <Cell key={`cell-${index}`} fill={baseColor} opacity={isFaded ? 0.3 : 1} cursor="pointer" />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GRÁFICO: Scatter Plot */}
          <div className="rounded-xl border border-slate-800 bg-[#1E293B] p-5 h-[450px] flex flex-col mb-10 relative group">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Ego-Rede: Grau vs Densidade</h3>
                <button 
                  onClick={() => setActiveInsight({
                    title: "Paradoxo da Densidade de Hubs",
                    content: (
                      <>
                        <p>Na teoria de Redes Sociais e Grafos, este gráfico demonstra uma propriedade clássica: <strong>quanto maior o Grau, menor a Densidade da Ego-Rede.</strong></p>
                        <p>Aeroportos pequenos (no canto superior esquerdo) conectam-se a cidades próximas que também têm voos entre si (alta densidade local). Já os grandes Hubs (canto inferior direito) conectam o Brasil inteiro; logo, é quase impossível que todos os vizinhos de um Hub tenham voos diretos uns com os outros.</p>
                      </>
                    )
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
                <XAxis 
                  type="number" 
                  dataKey="grau" 
                  name="Grau" 
                  domain={[2, 18]} 
                  ticks={[2, 4, 6, 8, 10, 12, 14, 16, 18]}
                  stroke="#94a3b8" 
                  fontSize={11} 
                  label={{ value: 'Grau do Aeroporto', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="densidade" 
                  name="Densidade" 
                  domain={[0.4, 1.0]} 
                  ticks={[0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
                  stroke="#94a3b8" 
                  fontSize={11} 
                  label={{ value: 'Densidade da Ego-Rede', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} 
                />
                <ZAxis type="category" dataKey="iata" name="Aeroporto" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Scatter data={scatterData} onClick={(data) => setSelectedNode(data.iata)}>
                  {scatterData.map((entry, index) => {
                    const isSelected = selectedNode === entry.iata
                    const isFaded = selectedNode && !isSelected
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={REGION_COLORS[entry.regiao] || '#cbd5e1'} 
                        opacity={isFaded ? 0.2 : 0.9} 
                        stroke={isSelected ? '#fff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    )
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  )
}