import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { useMarvelMovies, useMarvelGraph } from '@/hooks/useMarvelGraph'
import { useRunMarvelAlgorithm } from '@/hooks/useMarvelAlgorithm'
import { ALGORITHM_LABELS, MARVEL_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants'
import type { AlgorithmName } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RevenueBarChart } from '../charts/RevenueBarChart'
import { CategoryCompareChart } from '../charts/CategoryCompareChart'
import { DegreeHistogram } from '../charts/DegreeHistogram'
import { ROIScatterPlot } from '../charts/ROIScatterPlot'
import { AlgoCompareChart } from '../charts/AlgoCompareChart'

const ALGORITHMS: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']

export function MarvelSidebar() {
  const [tab, setTab] = useState('algoritmo')
  const { data: movies } = useMarvelMovies()
  const { data: graph }  = useMarvelGraph()

  const { selectedAlgorithm, setSelectedAlgorithm, source, target, setSource, setTarget, result } = useStore(s => ({
    selectedAlgorithm:    s.selectedAlgorithm,
    setSelectedAlgorithm: s.setSelectedAlgorithm,
    source:               s.source as number | null,
    target:               s.target as number | null,
    setSource:            s.setSource,
    setTarget:            s.setTarget,
    result:               s.result,
  }))

  const { mutate: run, isPending } = useRunMarvelAlgorithm()
  const needsTarget = selectedAlgorithm === 'DIJKSTRA' || selectedAlgorithm === 'BELLMAN_FORD'

  const sourceMovie = movies?.find(m => m.movie_id === source)
  const targetMovie = movies?.find(m => m.movie_id === target)

  return (
    <aside
      className="w-64 shrink-0 h-full flex flex-col border-r-2 border-black overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <div className="px-3 pt-3 pb-2 flex-1 overflow-hidden flex flex-col">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full h-8 bg-transparent border-2 border-black p-0 gap-0 shrink-0">
            {[
              { value: 'algoritmo', label: 'Alg' },
              { value: 'graficos',  label: 'Gráf' },
              { value: 'grafo',     label: 'Info' },
            ].map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  'flex-1 h-full text-[9px] font-mono uppercase tracking-wider rounded-none',
                  'data-[state=active]:bg-[var(--primary)] data-[state=active]:text-black data-[state=active]:font-bold',
                  'data-[state=inactive]:text-[var(--muted-foreground)]',
                )}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-3">
            <TabsContent value="algoritmo" className="mt-0 space-y-3 pr-1">
              <div className="grid grid-cols-2 gap-1">
                {ALGORITHMS.map(alg => (
                  <button
                    key={alg}
                    onClick={() => setSelectedAlgorithm(alg)}
                    className={cn(
                      'text-[10px] font-mono px-2 py-1 border-2 transition-colors font-bold',
                      selectedAlgorithm === alg
                        ? 'border-black bg-[var(--primary)] text-black'
                        : 'border-black text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-black',
                    )}
                  >
                    {ALGORITHM_LABELS[alg]}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <MovieSelect
                  label="Origem"
                  movies={movies ?? []}
                  value={source}
                  onChange={setSource}
                />
                {needsTarget && (
                  <MovieSelect
                    label="Destino"
                    movies={movies ?? []}
                    value={target}
                    onChange={setTarget}
                  />
                )}
              </div>

              {(sourceMovie || targetMovie) && (
                <div className="space-y-1 text-[10px] font-mono">
                  {sourceMovie && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ background: CATEGORY_COLORS[sourceMovie.category] ?? '#888', outline: '1px solid black' }}
                      />
                      <span className="truncate text-[var(--foreground)]">{sourceMovie.title}</span>
                    </div>
                  )}
                  {targetMovie && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--muted-foreground)]">→</span>
                      <span className="truncate text-[var(--foreground)]">{targetMovie.title}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                size="sm"
                onClick={() => run()}
                disabled={isPending || source === null}
                className={cn(
                  'w-full h-8 text-[11px] font-mono font-bold border-2 border-black',
                  'bg-[var(--primary)] text-black hover:opacity-90',
                  'disabled:opacity-40',
                )}
                style={{ boxShadow: '3px 3px 0px #000' }}
              >
                {isPending ? 'Executando…' : 'Executar'}
              </Button>

              {result && <ResultSummary result={result as Record<string, unknown>} />}
            </TabsContent>

            <TabsContent value="graficos" className="mt-0 space-y-4 pr-1">
              <RevenueBarChart />
              <Separator style={{ background: 'black', height: 2 }} />
              <CategoryCompareChart />
              <Separator style={{ background: 'black', height: 2 }} />
              <DegreeHistogram />
              <Separator style={{ background: 'black', height: 2 }} />
              <ROIScatterPlot />
              <Separator style={{ background: 'black', height: 2 }} />
              <AlgoCompareChart />
            </TabsContent>

            <TabsContent value="grafo" className="mt-0 space-y-3 pr-1">
              {graph && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <MetricRow label="Filmes" value={graph.order} />
                  <MetricRow label="Conexões" value={graph.size} />
                </div>
              )}

              <Separator style={{ background: 'black', height: 2 }} />

              <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                Legenda de categorias
              </p>
              {MARVEL_CATEGORIES.map(c => (
                <div key={c} className="flex items-center gap-2 text-[10px] font-mono">
                  <span
                    className="w-3 h-3 shrink-0"
                    style={{ background: CATEGORY_COLORS[c], outline: '1.5px solid black' }}
                  />
                  <span className="text-[var(--foreground)]">{c}</span>
                </div>
              ))}

              <Separator style={{ background: 'black', height: 2 }} />
              <p className="text-[9px] font-mono text-[var(--muted-foreground)]">
                Clique num nó para definir origem; clique de novo para definir destino.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </aside>
  )
}

function MovieSelect({
  label,
  movies,
  value,
  onChange,
}: {
  label: string
  movies: { movie_id: number; title: string; year: number; phase: number }[]
  value: number | null
  onChange: (id: number | null) => void
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase">{label}</span>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={cn(
          'w-full h-7 text-[10px] font-mono px-2',
          'border-2 border-black bg-[var(--background)] text-[var(--foreground)]',
          'focus:outline-none focus:bg-[var(--primary)] focus:text-black',
        )}
      >
        <option value="">— selecionar —</option>
        {movies.map(m => (
          <option key={m.movie_id} value={m.movie_id}>
            {m.title} ({m.year})
          </option>
        ))}
      </select>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[var(--foreground)] font-bold">{value}</span>
    </div>
  )
}

function ResultSummary({ result }: { result: Record<string, unknown> }) {
  const algo        = result.algorithm as string | undefined
  const execTime    = result.execution_time_ms as number | undefined
  const visited     = (result.visited_order as unknown[])?.length
  const pathArr     = result.path as number[] | undefined
  const cost        = result.cost as number | null | undefined

  return (
    <div
      className="border-2 border-black p-2 space-y-1 text-[10px] font-mono"
      style={{ background: 'var(--background-card)', boxShadow: '3px 3px 0px #000' }}
    >
      <div className="font-bold text-[var(--foreground)]">{algo}</div>
      {execTime !== undefined && (
        <div className="text-[var(--muted-foreground)]">{execTime.toFixed(2)}ms</div>
      )}
      {visited !== undefined && (
        <div>Visitados: <span className="text-[var(--foreground)]">{visited}</span></div>
      )}
      {pathArr && pathArr.length > 0 && (
        <div>Caminho: <span className="text-[var(--foreground)]">{pathArr.length} nós</span></div>
      )}
      {cost !== undefined && cost !== null && (
        <div>Custo: <span className="text-[var(--primary)]">{cost.toFixed(1)}</span></div>
      )}
    </div>
  )
}
