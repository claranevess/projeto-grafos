import { useQuery } from '@tanstack/react-query'
import { graphApi } from '@/lib/api'

export function useMetrics() {
  return useQuery({ queryKey: ['metrics'], queryFn: graphApi.getMetrics, staleTime: Infinity })
}
