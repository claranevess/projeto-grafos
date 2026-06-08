import type { AlgorithmName } from '@/lib/types'
import { MARVEL_CATEGORIES } from '@/lib/constants'

export interface MarvelState {
  selectedAlgorithm: AlgorithmName
  source:            number | null
  target:            number | null
  result:            unknown | null
  tooltipMovieId:    number | null
  tooltipPos:        { x: number; y: number } | null
  algoTimings:       Partial<Record<AlgorithmName, number>>
  activeCategories:  Set<string>
  setSelectedAlgorithm: (a: AlgorithmName) => void
  setSource:            (id: number | null) => void
  setTarget:            (id: number | null) => void
  setResult:            (r: unknown | null) => void
  setTooltip:           (id: number | null, pos: { x: number; y: number } | null) => void
  recordAlgoTiming:     (alg: AlgorithmName, ms: number) => void
  toggleCategory:       (c: string) => void
}

export const createMarvelSlice = (set: (fn: (s: MarvelState) => Partial<MarvelState>) => void): MarvelState => ({
  selectedAlgorithm: 'BFS',
  source:            null,
  target:            null,
  result:            null,
  tooltipMovieId:    null,
  tooltipPos:        null,
  algoTimings:       {},
  activeCategories:  new Set(MARVEL_CATEGORIES),
  setSelectedAlgorithm: a    => set(() => ({ selectedAlgorithm: a, result: null })),
  setSource:            id   => set(() => ({ source: id })),
  setTarget:            id   => set(() => ({ target: id })),
  setResult:            r    => set(() => ({ result: r })),
  setTooltip:           (id, pos) => set(() => ({ tooltipMovieId: id, tooltipPos: pos })),
  recordAlgoTiming:     (alg, ms) => set(s => ({ algoTimings: { ...s.algoTimings, [alg]: ms } })),
  toggleCategory: c => set(s => {
    const next = new Set(s.activeCategories)
    next.has(c) ? next.delete(c) : next.add(c)
    return { activeCategories: next }
  }),
})
