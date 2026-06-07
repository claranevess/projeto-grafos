import { useMutation } from '@tanstack/react-query'
import { marvelApi } from '@/lib/api'
import { useStore } from '@/store'
import { toast } from 'sonner'
import type { AlgorithmName } from '@/lib/types'

export function useRunMarvelAlgorithm() {
  const { selectedAlgorithm, source, target, setResult, recordAlgoTiming } = useStore(s => ({
    selectedAlgorithm: s.selectedAlgorithm,
    source:            s.source as number | null,
    target:            s.target as number | null,
    setResult:         s.setResult,
    recordAlgoTiming:  s.recordAlgoTiming,
  }))

  return useMutation({
    mutationFn: async () => {
      if (source === null) throw new Error('Selecione um filme de origem')
      return callMarvelAlgorithm(selectedAlgorithm, source, target ?? undefined)
    },
    onSuccess: (data: { execution_time_ms?: number }) => {
      setResult(data)
      if (typeof data?.execution_time_ms === 'number') {
        recordAlgoTiming(selectedAlgorithm, data.execution_time_ms)
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao executar algoritmo'
      toast.error(msg)
    },
  })
}

export function useRunMarvelBellmanFordScenario() {
  const { setResult, recordAlgoTiming } = useStore(s => ({
    setResult:        s.setResult,
    recordAlgoTiming: s.recordAlgoTiming,
  }))

  return useMutation({
    mutationFn: (scenario: 'peso_negativo' | 'ciclo_negativo') => marvelApi.bellmanFordScenario(scenario),
    onSuccess: (data: { execution_time_ms?: number }) => {
      setResult(data)
      if (typeof data?.execution_time_ms === 'number') {
        recordAlgoTiming('BELLMAN_FORD', data.execution_time_ms)
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao executar cenário'
      toast.error(msg)
    },
  })
}

async function callMarvelAlgorithm(alg: AlgorithmName, source: number, target?: number) {
  switch (alg) {
    case 'BFS':
      return marvelApi.bfs({ source, target })
    case 'DFS':
      return marvelApi.dfs({ source, target })
    case 'DIJKSTRA':
      if (target === undefined) throw new Error('Dijkstra requer destino')
      return marvelApi.dijkstra({ source, target })
    case 'BELLMAN_FORD':
      return marvelApi.bellmanFord({ source, target })
  }
}
