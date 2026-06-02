import type { NodeSchema, EdgeSchema } from '@/lib/types'

export interface GraphState {
  nodes: NodeSchema[]
  edges: EdgeSchema[]
  order: number
  size: number
  setGraph: (nodes: NodeSchema[], edges: EdgeSchema[], order: number, size: number) => void
}

export const createGraphSlice = (set: (fn: (s: GraphState) => Partial<GraphState>) => void): GraphState => ({
  nodes: [],
  edges: [],
  order: 0,
  size: 0,
  setGraph: (nodes, edges, order, size) => set(() => ({ nodes, edges, order, size })),
})
