import { useState, useEffect, useMemo } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology } from 'topojson-specification'

interface Props {
  projection: d3.GeoProjection
  width:  number
  height: number
}

export function BrazilMapLayer({ projection }: Props) {
  const [brazilFeature, setBrazilFeature] = useState<GeoJSON.Feature | null>(null)

  useEffect(() => {
    d3.json<Topology>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(world => {
        if (!world) return
        const countries = topojson.feature(world, world.objects.countries as topojson.Objects['countries'])
        const brazil = (countries as GeoJSON.FeatureCollection).features.find(
          f => (f as GeoJSON.Feature).id === '076'
        ) ?? null
        setBrazilFeature(brazil)
      })
      .catch(() => {})
  }, [])

  const pathD = useMemo(() => {
    if (!brazilFeature) return null
    return d3.geoPath(projection)(brazilFeature)
  }, [brazilFeature, projection])

  if (!pathD) return null

  return (
    <g>
      <path
        d={pathD}
        fill="var(--background-card)"
        stroke="var(--border)"
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  )
}
