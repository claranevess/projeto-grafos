import { useStore } from '@/store'
import type { MarvelMovieSchema } from '@/lib/types'

interface Props {
  nodes: MarvelMovieSchema[]
}

export function MarvelNodeTooltip({ nodes }: Props) {
  const { tooltipMovieId, tooltipPos } = useStore(s => ({
    tooltipMovieId: s.tooltipMovieId,
    tooltipPos:     s.tooltipPos,
  }))

  if (!tooltipMovieId || !tooltipPos) return null

  const movie = nodes.find(n => n.movie_id === tooltipMovieId)
  if (!movie) return null

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 8 }}
    >
      <div
        className="bg-[var(--background)] border-2 border-black p-2 text-[11px] font-mono w-48"
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        <div className="font-bold text-[var(--foreground)] leading-tight mb-1">{movie.title}</div>
        <div className="text-[var(--muted-foreground)]">
          {movie.year} · {movie.category}
        </div>
        <div className="mt-1 space-y-0.5 text-[10px]">
          <div>
            <span className="text-[var(--muted-foreground)]">Bilheteria: </span>
            <span className="text-[var(--foreground)]">${movie.worldwide_gross_million.toFixed(0)}M</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">ROI: </span>
            <span className="text-[var(--foreground)]">{movie.roi_percent.toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-[var(--muted-foreground)]">Conexões: </span>
            <span className="text-[var(--foreground)]">{movie.degree}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
