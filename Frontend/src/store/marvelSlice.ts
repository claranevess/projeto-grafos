import type { AlgorithmName } from '@/lib/types'

export interface MarvelState {
  selectedAlgorithm: AlgorithmName
  source:            number | null
  target:            number | null
  result:            unknown | null
  tooltipMovieId:    number | null
  tooltipPos:        { x: number; y: number } | null
  setSelectedAlgorithm: (a: AlgorithmName) => void
  setSource:            (id: number | null) => void
  setTarget:            (id: number | null) => void
  setResult:            (r: unknown | null) => void
  setTooltip:           (id: number | null, pos: { x: number; y: number } | null) => void
}

export const createMarvelSlice = (set: (fn: (s: MarvelState) => Partial<MarvelState>) => void): MarvelState => ({
  selectedAlgorithm: 'BFS',
  source:            null,
  target:            null,
  result:            null,
  tooltipMovieId:    null,
  tooltipPos:        null,
  setSelectedAlgorithm: a    => set(() => ({ selectedAlgorithm: a, result: null })),
  setSource:            id   => set(() => ({ source: id })),
  setTarget:            id   => set(() => ({ target: id })),
  setResult:            r    => set(() => ({ result: r })),
  setTooltip:           (id, pos) => set(() => ({ tooltipMovieId: id, tooltipPos: pos })),
})
