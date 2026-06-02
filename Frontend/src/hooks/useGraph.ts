import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/lib/api'
import { useStore } from '@/store'
import { useEffect } from 'react'

export function useGraph() {
  const setGraph = useStore(s => s.setGraph)
  const query = useQuery({ queryKey: ['graph'], queryFn: graphApi.getGraph, staleTime: Infinity })

  useEffect(() => {
    if (query.data) {
      setGraph(query.data.nodes, query.data.edges, query.data.order, query.data.size)
    }
  }, [query.data, setGraph])

  return query
}

export function useAirports() {
  return useQuery({ queryKey: ['airports'], queryFn: graphApi.getAirports, staleTime: Infinity })
}
