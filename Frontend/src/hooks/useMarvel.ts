import { useQuery, useMutation } from '@tanstack/react-query'
import { marvelApi } from '@/lib/api'
import { useStore } from '@/store'
import { toast } from 'sonner'

export function useMarvelGraph() {
  return useQuery({ queryKey: ['marvel-graph'], queryFn: marvelApi.getGraph, staleTime: Infinity })
}

export function useMarvelMovies() {
  return useQuery({ queryKey: ['marvel-movies'], queryFn: marvelApi.getMovies, staleTime: Infinity })
}

export function useRunMarvelAlgorithm() {
  const { selectedAlgorithm, source, target, setResult } = useStore(s => ({
    selectedAlgorithm: s.selectedAlgorithm,
    source:            s.source as unknown as number,
    target:            s.target as unknown as number,
    setResult:         s.setResult,
  }))

  return useMutation({
    mutationFn: async () => {
      if (source === null) throw new Error('Selecione um nó de origem')
      switch (selectedAlgorithm) {
        case 'BFS':          return marvelApi.bfs({ source })
        case 'DFS':          return marvelApi.dfs({ source })
        case 'DIJKSTRA':     return marvelApi.dijkstra({ source, target })
        case 'BELLMAN_FORD': return marvelApi.bellmanFord({ source })
      }
    },
    onSuccess: setResult,
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erro ao executar algoritmo Marvel'
      toast.error(msg)
    },
  })
}
