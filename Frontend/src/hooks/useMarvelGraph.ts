import { useQuery } from '@tanstack/react-query'
import { marvelApi } from '@/lib/api'

export function useMarvelGraph() {
  return useQuery({ queryKey: ['marvel-graph'], queryFn: marvelApi.getGraph, staleTime: Infinity })
}

export function useMarvelMovies() {
  return useQuery({ queryKey: ['marvel-movies'], queryFn: marvelApi.getMovies, staleTime: Infinity })
}
