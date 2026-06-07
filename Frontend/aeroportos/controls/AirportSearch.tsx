import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAirports } from '@/hooks/useGraph'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface Props {
  mode: 'source' | 'target'
}

export function AirportSearch({ mode }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const { data: airports } = useAirports()
  const { setSource, setTarget, source, target } = useStore(s => ({
    setSource: s.setSource,
    setTarget: s.setTarget,
    source:    s.source,
    target:    s.target,
  }))

  const value = mode === 'source' ? source : target

  const filtered = useMemo(() => {
    if (!airports || !query) return []
    const q = query.toUpperCase()
    return airports
      .filter(a => a.iata.includes(q) || a.city.toUpperCase().includes(q))
      .slice(0, 8)
  }, [airports, query])

  function select(iata: string) {
    mode === 'source' ? setSource(iata) : setTarget(iata)
    setQuery('')
    setFocused(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          value={focused ? query : (query || value)}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); setQuery('') }}
          onBlur={() => { setFocused(false); setQuery('') }}
          placeholder={mode === 'source' ? 'Origem (IATA)' : 'Destino (IATA)'}
          className={cn(
            'h-7 pl-7 text-[11px] font-mono bg-transparent',
            'border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]',
            value === 'GIG' && mode === 'target' && 'border-[var(--destructive)] text-[var(--destructive)]',
          )}
        />
      </div>

      {filtered.length > 0 && (
        <ScrollArea className="absolute z-50 w-full max-h-44 border border-[var(--border)] bg-[var(--background-card)] shadow-lg">
          {filtered.map(a => (
            <button
              key={a.iata}
              onMouseDown={e => { e.preventDefault(); select(a.iata) }}
              className="w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-[var(--muted)] flex gap-2"
            >
              <span className="font-bold text-[var(--foreground)] w-8">{a.iata}</span>
              <span className="text-[var(--muted-foreground)] truncate">{a.city}</span>
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
