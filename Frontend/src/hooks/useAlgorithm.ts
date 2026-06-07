import { useMutation } from '@tanstack/react-query'
import { algorithmApi } from '@/lib/api'
import { useStore } from '@/store'
import { toast } from 'sonner'
import type { AlgorithmName, AlgorithmRequest } from '@/lib/types'

export function useRunAlgorithm() {
  const { selected, source, target, setResult, setIsRunning, reset, play } = useStore(s => ({
    selected:    s.selected,
    source:      s.source,
    target:      s.target,
    setResult:   s.setResult,
    setIsRunning:s.setIsRunning,
    reset:       s.reset,
    play:        s.play,
  }))

  const run = useMutation({
    mutationFn: async () => {
      const req: AlgorithmRequest = { source, ...(target ? { target } : {}) }
      const fn = algorithmFn(selected)
      return fn(req)
    },
    onMutate: () => setIsRunning(true),
    onSuccess: (data) => {
      setResult(data)
      setIsRunning(false)
      if ('path' in data && (data as { path: string[] }).path.length >= 2) {
        reset()
        play()
      }
    },
    onError: (err: unknown) => {
      setIsRunning(false)
      const msg = err instanceof Error ? err.message : 'Erro ao executar algoritmo'
      toast.error(msg)
    },
  })

  return run
}

function algorithmFn(alg: AlgorithmName) {
  switch (alg) {
    case 'BFS':         return algorithmApi.bfs
    case 'DFS':         return algorithmApi.dfs
    case 'DIJKSTRA':    return algorithmApi.dijkstra
    case 'BELLMAN_FORD':return algorithmApi.bellmanFord
  }
}
