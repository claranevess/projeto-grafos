import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import type * as d3 from 'd3'
import { BrazilMapLayer } from './BrazilMapLayer'
import { EdgeLayer } from './EdgeLayer'
import { NodeLayer } from './NodeLayer'
import { PathHighlightLayer } from './PathHighlightLayer'
import { BfsWaveLayer } from './BfsWaveLayer'
import { PlaneAnimator } from './PlaneAnimator'
import { useProjection } from '@/hooks/useProjection'
import { useStore } from '@/store'
import type { NodeSchema } from '@/lib/types'

const IDENTITY = 'translate(0 0) scale(1)'

function buildZoomTransform(
  path: string[],
  nodes: NodeSchema[],
  projection: d3.GeoProjection,
  width: number,
  height: number,
): string {
  const nodeMap = new Map(nodes.map(n => [n.iata, n]))
  const coords = path.flatMap(iata => {
    const n = nodeMap.get(iata)
    if (!n?.lon || !n?.lat) return []
    const p = projection([n.lon, n.lat])
    return p ? [p as [number, number]] : []
  })

  if (coords.length < 2) return IDENTITY

  const xs = coords.map(c => c[0])
  const ys = coords.map(c => c[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const PAD = 90
  const k = Math.min(
    (width  * 0.8) / (maxX - minX + PAD * 2),
    (height * 0.8) / (maxY - minY + PAD * 2),
    4,
  )

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  // SVG transform attribute: translate first, then scale from origin
  // translate(tx ty) scale(k) → point (x,y) maps to (k*x + tx, k*y + ty)
  const tx = width  / 2 - k * cx
  const ty = height / 2 - k * cy

  return `translate(${tx} ${ty}) scale(${k})`
}

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
  const nodes              = useStore(s => s.nodes)
  const edges              = useStore(s => s.edges)
  const result             = useStore(s => s.result)
  const playing            = useStore(s => s.playing)
  const t                  = useStore(s => s.t)
  const selected           = useStore(s => s.selected)
  const target             = useStore(s => s.target)
  const triggerBridgeAlert = useStore(s => s.triggerBridgeAlert)

  const [zoomAttr, setZoomAttr] = useState(IDENTITY)

  // Zoom in when a path result arrives
  useEffect(() => {
    if (!result || !('path' in result) || dims.w === 0) {
      setZoomAttr(IDENTITY)
      return
    }
    const path = (result as { path: string[] }).path
    setZoomAttr(buildZoomTransform(path, nodes, projection, dims.w, dims.h))
  }, [result, nodes, projection, dims])

  // Zoom back out and fire BridgeAlert (if applicable) when plane finishes
  const prevPlayingRef = useRef(false)
  useEffect(() => {
    if (!playing && prevPlayingRef.current && t >= 1) {
      setZoomAttr(IDENTITY)
      if (selected === 'DIJKSTRA' && target === 'GIG') {
        triggerBridgeAlert()
      }
    }
    prevPlayingRef.current = playing
  }, [playing, t])

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[var(--background)]">
      {dims.w > 0 && (
        <svg
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <g
            transform={zoomAttr}
            style={{ transition: 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <BrazilMapLayer projection={projection} />
            <EdgeLayer projection={projection} nodes={nodes} edges={edges} />
            <PathHighlightLayer projection={projection} nodes={nodes} />
            <BfsWaveLayer projection={projection} nodes={nodes} />
            <NodeLayer projection={projection} nodes={nodes} />
            <PlaneAnimator projection={projection} nodes={nodes} />
          </g>
        </svg>
      )}
    </div>
  )
}