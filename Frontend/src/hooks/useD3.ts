import { useRef, useEffect, type RefObject } from 'react'

export function useD3<T extends SVGElement>(
  render: (element: T) => void | (() => void),
  deps: unknown[]
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const cleanup = render(ref.current)
    return () => { cleanup?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
