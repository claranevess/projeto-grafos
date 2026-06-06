import { useRef, useState, useLayoutEffect } from 'react'
import { BrazilMapLayer } from './BrazilMapLayer'
import { EdgeLayer } from './EdgeLayer'
import { NodeLayer } from './NodeLayer'
import { PathHighlightLayer } from './PathHighlightLayer'
import { BfsWaveLayer } from './BfsWaveLayer'
import { AirportTooltip } from './AirportTooltip'
import { RadarSweep } from './RadarSweep'
import { useProjection } from '@/hooks/useProjection'
import { useStore } from '@/store'

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) })

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { projection } = useProjection(dims.w, dims.h)
  const nodes = useStore(s => s.nodes)
  const edges = useStore(s => s.edges)

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[var(--background)]">
      {dims.w > 0 && (
        <svg
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <RadarSweep cx={dims.w / 2} cy={dims.h / 2} r={Math.min(dims.w, dims.h) * 0.45} />
          <g>
            <BrazilMapLayer projection={projection} />
            <EdgeLayer projection={projection} nodes={nodes} edges={edges} />
            <PathHighlightLayer projection={projection} nodes={nodes} />
            <BfsWaveLayer projection={projection} nodes={nodes} />
            <NodeLayer projection={projection} nodes={nodes} />
          </g>
        </svg>
      )}
      <AirportTooltip />
    </div>
  )
}
