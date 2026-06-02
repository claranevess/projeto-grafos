import { useMemo } from 'react'
import * as d3 from 'd3'

const BRAZIL_FEATURE: GeoJSON.Feature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-73.99, -33.75], [-28.85, -33.75], [-28.85, 5.27],
      [-73.99,  5.27],  [-73.99, -33.75],
    ]],
  },
  properties: {},
}

export function useProjection(width: number, height: number) {
  return useMemo(() => {
    const w = width  || 1400
    const h = height || 900

    // Fill the full available width with Brazil.
    const projection = d3.geoMercator().fitWidth(w, BRAZIL_FEATURE)

    // fitWidth places Brazil's y-centre at 0.  Shift so it sits at h/2.
    const [[, y0], [, y1]] = d3.geoPath(projection).bounds(BRAZIL_FEATURE)
    const [tx, ty] = projection.translate()
    projection.translate([tx, ty + h / 2 - (y0 + y1) / 2])

    const project = (lon: number, lat: number): [number, number] =>
      projection([lon, lat]) ?? [0, 0]

    return { projection, project }
  }, [width, height])
}
