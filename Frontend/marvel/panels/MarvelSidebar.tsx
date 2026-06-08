import {useState} from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Separator} from '@/components/ui/separator'
import {Button} from '@/components/ui/button'
import {useStore} from '@/store'
import {useMarvelGraph, useMarvelMovies} from '@/hooks/useMarvelGraph'
import {useRunMarvelAlgorithm, useRunMarvelBellmanFordScenario} from '@/hooks/useMarvelAlgorithm'
import {ALGORITHM_LABELS, CATEGORY_COLORS, MARVEL_CATEGORIES} from '@/lib/constants'
import type {AlgorithmName, MarvelMovieSchema} from '@/lib/types'
import {cn} from '@/lib/utils'

const ALGORITHMS: AlgorithmName[] = ['BFS', 'DFS', 'DIJKSTRA', 'BELLMAN_FORD']

export function MarvelSidebar() {
    const [tab, setTab] = useState('algoritmo')
    const {data: movies} = useMarvelMovies()
    const {data: graph} = useMarvelGraph()

    const {
        selectedAlgorithm,
        setSelectedAlgorithm,
        source,
        target,
        setSource,
        setTarget,
        result,
        activeCategories,
        toggleCategory
    } = useStore(s => ({
        selectedAlgorithm: s.selectedAlgorithm,
        setSelectedAlgorithm: s.setSelectedAlgorithm,
        source: s.source as number | null,
        target: s.target as number | null,
        setSource: s.setSource,
        setTarget: s.setTarget,
        result: s.result,
        activeCategories: s.activeCategories,
        toggleCategory: s.toggleCategory,
    }))

    const {mutate: run, isPending} = useRunMarvelAlgorithm()
    const {mutate: runScenario, isPending: isScenarioPending} = useRunMarvelBellmanFordScenario()
    const needsTarget = selectedAlgorithm === 'DIJKSTRA' || selectedAlgorithm === 'BELLMAN_FORD'

    const sourceMovie = movies?.find(m => m.movie_id === source)
    const targetMovie = movies?.find(m => m.movie_id === target)

    return (
        <aside
            className="w-64 shrink-0 h-full flex flex-col border-r-2 border-black overflow-hidden"
            style={{background: 'var(--background)'}}
        >
            <div className="px-3 pt-3 pb-2 flex-1 overflow-hidden flex flex-col">
                <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
                    <TabsList className="w-full h-8 bg-transparent border-2 border-black p-0 gap-0 shrink-0">
                        {[
                            {value: 'algoritmo', label: 'Alg'},
                            {value: 'grafo', label: 'Info'},
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

                    <TabsContent value="algoritmo" className="mt-3 flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                        <div className="space-y-3 shrink-0 pr-1">
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

                            {selectedAlgorithm === 'BELLMAN_FORD' && (
                                <div
                                    className="border-2 border-black p-2 space-y-1.5"
                                    style={{background: 'var(--background-card)', boxShadow: '3px 3px 0px #000'}}
                                >
                                    <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                                        Cenários obrigatórios (peso negativo)
                                    </p>
                                    <p className="text-[9px] font-mono text-[var(--muted-foreground)] leading-snug">
                                        No grafo padrão (Model A+) todas as arestas têm peso 1.0 — estes
                                        cenários sobrepõem arestas extras de peso negativo para demonstrar
                                        Bellman-Ford nesses casos.
                                    </p>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => runScenario('peso_negativo')}
                                            disabled={isScenarioPending}
                                            className="w-full text-left text-[10px] font-mono px-2 py-1.5 border-2 border-black font-bold transition-colors text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-black disabled:opacity-40"
                                        >
                                            Sem ciclo: Iron Man → Iron Man 2
                                        </button>
                                        <button
                                            onClick={() => runScenario('ciclo_negativo')}
                                            disabled={isScenarioPending}
                                            className="w-full text-left text-[10px] font-mono px-2 py-1.5 border-2 border-black font-bold transition-colors text-[var(--foreground)] hover:bg-[var(--destructive)] hover:text-white disabled:opacity-40"
                                        >
                                            Ciclo negativo: trio Avengers
                                        </button>
                                    </div>
                                </div>
                            )}

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
                          style={{
                              background: CATEGORY_COLORS[sourceMovie.category] ?? '#888',
                              outline: '1px solid black'
                          }}
                      />
                                            <span
                                                className="truncate text-[var(--foreground)]">{sourceMovie.title}</span>
                                        </div>
                                    )}
                                    {targetMovie && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[var(--muted-foreground)]">→</span>
                                            <span
                                                className="truncate text-[var(--foreground)]">{targetMovie.title}</span>
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
                                style={{boxShadow: '3px 3px 0px #000'}}
                            >
                                {isPending ? 'Executando…' : 'Executar'}
                            </Button>
                        </div>

                        {result && <ResultSummary result={result as unknown as Record<string, unknown>}
                                                  movies={movies ?? []}/>}
                    </TabsContent>

                    <TabsContent value="grafo" className="mt-3 flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-3 pr-1">
                                {graph && (
                                    <div className="space-y-1.5 text-[11px] font-mono">
                                        <MetricRow label="Filmes" value={graph.order}/>
                                        <MetricRow label="Conexões" value={graph.size}/>
                                    </div>
                                )}

                                <Separator style={{background: 'black', height: 2}}/>

                                <div className="flex items-start gap-2 text-[10px] font-mono">
                                    <svg width={18} height={18} className="shrink-0 mt-0.5">
                                        <circle cx={9} cy={9} r={7} fill="none" stroke="black" strokeWidth={2}/>
                                        <circle cx={9} cy={9} r={4.5} fill="var(--primary)" stroke="black"
                                                strokeWidth={1.5}/>
                                    </svg>
                                    <span className="text-[var(--muted-foreground)] leading-snug">
                    Anel ao redor do nó = filme com 3+ conexões, entre os mais centrais da rede.
                  </span>
                                </div>

                                <Separator style={{background: 'black', height: 2}}/>

                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-mono text-[var(--muted-foreground)] uppercase tracking-widest">
                                        Filtrar por categoria
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {MARVEL_CATEGORIES.map(c => {
                                            const active = activeCategories.has(c)
                                            return (
                                                <button
                                                    key={c}
                                                    onClick={() => toggleCategory(c)}
                                                    className={cn(
                                                        'flex items-center gap-1.5 text-[10px] font-mono px-1.5 py-1 border-2 border-black transition-opacity',
                                                        active ? 'opacity-100' : 'opacity-35',
                                                    )}
                                                    style={{background: active ? 'var(--background-card)' : 'var(--muted)'}}
                                                >
                          <span
                              className="w-2.5 h-2.5 shrink-0"
                              style={{background: CATEGORY_COLORS[c], outline: '1.5px solid black'}}
                          />
                                                    <span className="text-[var(--foreground)]">{c}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[9px] font-mono text-[var(--muted-foreground)] leading-snug">
                                        Clique numa categoria para realçar/atenuar seus filmes no grafo.
                                    </p>
                                </div>

                                <Separator style={{background: 'black', height: 2}}/>
                                <p className="text-[9px] font-mono text-[var(--muted-foreground)]">
                                    Clique num nó para definir origem; clique de novo para definir destino.
                                </p>
                            </div>
                        </ScrollArea>
                    </TabsContent>
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
    movies: { movie_id: number; title: string; year: number }[]
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

function MetricRow({label, value}: { label: string; value: string | number }) {
    return (
        <div className="flex items-baseline justify-between">
            <span className="text-[var(--muted-foreground)]">{label}</span>
            <span className="text-[var(--foreground)] font-bold">{value}</span>
        </div>
    )
}

function ResultSummary({result, movies}: { result: Record<string, unknown>; movies: MarvelMovieSchema[] }) {
    const algo = result.algorithm as string | undefined
    const execTime = result.execution_time_ms as number | undefined

    return (
        <div
            className="border-2 border-black p-2 space-y-1.5 text-[10px] font-mono flex-1 min-h-0 overflow-y-auto flex flex-col"
            style={{background: 'var(--background-card)', boxShadow: '3px 3px 0px #000'}}
        >
            <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--foreground)]">{algo}</span>
                {execTime !== undefined && (
                    <span className="text-[var(--muted-foreground)]">{execTime.toFixed(2)}ms</span>
                )}
            </div>

            {'path' in result && (
                <PathResultView result={result} movies={movies}/>
            )}
            {'layers' in result && (
                <BfsResultView result={result} movies={movies}/>
            )}
            {'edge_types' in result && (
                <DfsResultView result={result}/>
            )}
        </div>
    )
}

function PathResultView({result, movies}: { result: Record<string, unknown>; movies: MarvelMovieSchema[] }) {
    const cost = result.cost as number | null | undefined
    const path = (result.path as number[] | undefined) ?? []
    const reachable = result.reachable as boolean | undefined
    const negCycle = result.has_negative_cycle as boolean | undefined
    const titleOf = (id: number) => movies.find(m => m.movie_id === id)?.title ?? `#${id}`

    return (
        <div className="space-y-1.5">
            <div>
                Custo: <span
                className="text-[var(--primary)]">{cost !== null && cost !== undefined ? cost.toFixed(1) : '∞'}</span>
            </div>

            {reachable === false && !negCycle && (
                <div className="text-[var(--destructive)]">Sem rota disponível</div>
            )}

            {path.length > 0 && (
                <div className="flex flex-wrap gap-x-1 gap-y-0.5 leading-relaxed">
                    {path.map((id, i) => (
                        <span key={i} className="text-[var(--foreground)]">
              {titleOf(id)}
                            {i < path.length - 1 && <span className="text-[var(--muted-foreground)] mx-0.5">→</span>}
            </span>
                    ))}
                </div>
            )}

            {negCycle && (
                <div className="text-[var(--destructive)] font-bold">⚠ Ciclo negativo detectado</div>
            )}
        </div>
    )
}

function BfsResultView({result, movies}: { result: Record<string, unknown>; movies: MarvelMovieSchema[] }) {
    const visited = (result.visited_order as number[] | undefined) ?? []
    const layers = (result.layers as Record<string, number[]> | undefined) ?? {}
    const entries = Object.entries(layers)
    const titleOf = (id: number) => movies.find(m => m.movie_id === id)?.title ?? `#${id}`

    return (
        <div className="space-y-1.5">
            <div>Visitados: <span className="text-[var(--foreground)]">{visited.length}</span></div>
            <div className="space-y-1">
                {entries.map(([layer, ids]) => (
                    <div key={layer} className="text-[9px] leading-snug">
                        <span className="text-[var(--muted-foreground)]">L{layer}: </span>
                        <span className="text-[var(--foreground)]">{ids.map(titleOf).join(', ')}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DfsResultView({result}: { result: Record<string, unknown> }) {
    const visited = (result.visited_order as number[] | undefined) ?? []
    const hasCycle = result.has_cycle as boolean | undefined
    const edgeTypes = (result.edge_types as Record<string, string> | undefined) ?? {}

    const counts = Object.values(edgeTypes).reduce<Record<string, number>>((acc, t) => {
        acc[t] = (acc[t] ?? 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-1.5">
            <div>Visitados: <span className="text-[var(--foreground)]">{visited.length}</span></div>
            <div>
                Ciclo: <span className={hasCycle ? 'text-[var(--destructive)] font-bold' : 'text-[var(--foreground)]'}>
          {hasCycle ? 'sim' : 'não'}
        </span>
            </div>
            {Object.keys(counts).length > 0 && (
                <div className="text-[var(--muted-foreground)] leading-relaxed">
                    Arestas:{' '}
                    {Object.entries(counts).map(([type, n], i) => (
                        <span key={type}>
              {i > 0 && ', '}
                            {type}: <span className="text-[var(--foreground)]">{n}</span>
            </span>
                    ))}
                </div>
            )}
        </div>
    )
}
