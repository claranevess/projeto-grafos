import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { cn } from '@/lib/utils'

export function StatusIndicator() {
  const { data, isError } = useQuery({
    queryKey:  ['health'],
    queryFn:   () => axios.get('/api/../health').then(r => r.data),
    refetchInterval: 15_000,
    retry: false,
  })

  const online = !isError && !!data
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-mono')}>
      <span className={cn('w-2 h-2 rounded-full', online ? 'bg-green-500' : 'bg-red-500')} />
      <span className={online ? 'text-green-400' : 'text-red-400'}>
        {online ? 'API online' : 'API offline'}
      </span>
    </span>
  )
}
