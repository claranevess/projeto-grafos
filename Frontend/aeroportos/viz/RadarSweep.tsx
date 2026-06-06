import React from 'react'

interface Props {
  cx: number
  cy: number
  r:  number
}

export function RadarSweep({ cx, cy, r }: Props) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={0.5}
        opacity={0.08}
      />
      <circle
        cx={cx} cy={cy} r={r * 0.66}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={0.5}
        opacity={0.05}
      />
      <circle
        cx={cx} cy={cy} r={r * 0.33}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={0.5}
        opacity={0.05}
      />
      <g
        transform={`translate(${cx},${cy})`}
        className="animate-radar-sweep"
        style={{ transformOrigin: '0 0' }}
      >
        <path
          d={`M0,0 L0,${-r}`}
          stroke="var(--primary)"
          strokeWidth={1}
          opacity={0.15}
        />
        <path
          d={`M0,0 L${r * 0.15},${-r * 0.98}`}
          stroke="var(--primary)"
          strokeWidth={0.5}
          opacity={0.06}
        />
      </g>
    </g>
  )
}
