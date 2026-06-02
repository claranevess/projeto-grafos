import type { AlgorithmName, AlgorithmResult } from '@/lib/types'

export interface AlgorithmState {
  selected: AlgorithmName
  source: string
  target: string
  result: AlgorithmResult | null
  isRunning: boolean
  setSelected:  (alg: AlgorithmName) => void
  setSource:    (s: string) => void
  setTarget:    (t: string) => void
  setResult:    (r: AlgorithmResult | null) => void
  setIsRunning: (v: boolean) => void
  reset:        () => void
}

export const createAlgorithmSlice = (set: (fn: (s: AlgorithmState) => Partial<AlgorithmState>) => void): AlgorithmState => ({
  selected:    'DIJKSTRA',
  source:      '',
  target:      '',
  result:      null,
  isRunning:   false,
  setSelected:  alg => set(() => ({ selected: alg, result: null })),
  setSource:    s   => set(() => ({ source: s })),
  setTarget:    t   => set(() => ({ target: t })),
  setResult:    r   => set(() => ({ result: r })),
  setIsRunning: v   => set(() => ({ isRunning: v })),
  reset:            () => set(() => ({ result: null, source: '', target: '' })),
})
