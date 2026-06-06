import { useEffect, useRef } from 'react'
import { useStore } from '@/store'

export function useAnimationLoop() {
  const playing = useStore(s => s.playing)
  const tick    = useStore(s => s.tick)
  const rafRef  = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const loop = (now: number) => {
      const dt = lastRef.current !== null ? now - lastRef.current : 0
      lastRef.current = now
      tick(dt)
      rafRef.current = requestAnimationFrame(loop)
    }

    lastRef.current = null
    rafRef.current = requestAnimationFrame(loop)

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, tick])
}
