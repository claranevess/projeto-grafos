import {useLayoutEffect, useRef, useState} from 'react'
import {useStore} from '@/store'
import type {MarvelMovieSchema} from '@/lib/types'

interface Props {
    nodes: MarvelMovieSchema[]
}

const MARGIN = 8

export function MarvelNodeTooltip({nodes}: Props) {
    const {tooltipMovieId, tooltipPos} = useStore(s => ({
        tooltipMovieId: s.tooltipMovieId,
        tooltipPos: s.tooltipPos,
    }))

    const boxRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

    const movie = tooltipMovieId ? nodes.find(n => n.movie_id === tooltipMovieId) : undefined

    useLayoutEffect(() => {
        if (!movie || !tooltipPos || !boxRef.current) {
            setPos(null)
            return
        }
        const {width, height} = boxRef.current.getBoundingClientRect()

        let left = tooltipPos.x + 12
        if (left + width > window.innerWidth - MARGIN) left = tooltipPos.x - 12 - width
        left = Math.min(Math.max(left, MARGIN), window.innerWidth - width - MARGIN)

        let top = tooltipPos.y - 8
        if (top + height > window.innerHeight - MARGIN) top = window.innerHeight - MARGIN - height
        top = Math.max(top, MARGIN)

        setPos({left, top})
    }, [movie, tooltipPos])

    if (!movie || !tooltipPos) return null

    return (
        <div
            ref={boxRef}
            className="fixed z-50 pointer-events-none"
            style={{
                left: pos?.left ?? tooltipPos.x + 12,
                top: pos?.top ?? tooltipPos.y - 8,
                visibility: pos ? 'visible' : 'hidden',
            }}
        >
            <div
                className="bg-[var(--background)] border-2 border-black p-2 text-[11px] font-mono w-48"
                style={{boxShadow: '4px 4px 0px #000'}}
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
                    {movie.is_hub && (
                        <div className="text-[var(--primary)] font-bold leading-snug">
                            ★ Filme com 3+ conexões
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
