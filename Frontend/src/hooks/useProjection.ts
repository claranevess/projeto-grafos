import { useMemo } from 'react'
import * as d3 from 'd3'

const BRAZIL_FEATURE: GeoJSON.Feature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-73.99, -33.75], [-28.85, -33.75], [-28.85, 5.27],
      [-73.99, 5.27], [-73.99, -33.75],
    ]],
  },
  properties: {},
}

const SIDEBAR_WIDTH = 230

export function useProjection(width: number, height: number) {
  return useMemo(() => {
    const w = width || 1400
    const h = height || 900

    const radarCx = SIDEBAR_WIDTH + (w - SIDEBAR_WIDTH) / 2
    const radarCy = h / 2

    const projection = d3
      .geoMercator()
      .fitSize([w, h], BRAZIL_FEATURE)

    const scaleFactor = 8.0
    projection.scale(projection.scale() * scaleFactor)

    const path = d3.geoPath(projection)

    const [[x0, y0], [x1, y1]] = path.bounds(BRAZIL_FEATURE)

    const [tx, ty] = projection.translate()

    projection.translate([
      tx + radarCx - (x0 + x1) / 2 + 600,
      ty + radarCy - (y0 + y1) / 2 - 215,
  ])

    const project = (
      lon: number,
      lat: number
    ): [number, number] => projection([lon, lat]) ?? [0, 0]

    return { projection, project }
  }, [width, height])
}