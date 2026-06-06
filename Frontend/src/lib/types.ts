export interface NodeSchema {
  iata: string
  city: string
  region: string
  degree: number
  lat: number | null
  lon: number | null
  is_hub: boolean
}

export interface EdgeSchema {
  source: string
  target: string
  weight: number
  connection_type: string
  justification: string
}

export interface GraphSchema {
  nodes: NodeSchema[]
  edges: EdgeSchema[]
  order: number
  size: number
}

export interface AlgorithmRequest {
  source: string
  target?: string
}

export interface BfsResult {
  algorithm: string
  source: string
  execution_time_ms: number
  visited_order: string[]
  layers: Record<string, string[]>
}

export interface DfsResult {
  algorithm: string
  source: string
  execution_time_ms: number
  visited_order: string[]
  has_cycle: boolean
  edge_types: Record<string, string>
}

export interface PathResult {
  algorithm: string
  source: string
  target: string
  cost: number | null
  path: string[]
  has_negative_cycle: boolean
  execution_time_ms: number
  reachable: boolean
}

export type AlgorithmResult = BfsResult | DfsResult | PathResult

export interface HubInfo {
  iata: string
  city: string
  degree: number
}

export interface GlobalMetrics {
  order: number
  size: number
  density: number
  top_hubs: HubInfo[]
}

export interface RegionMetrics {
  region: string
  order: number
  size: number
  density: number
}

export interface MetricsResponse {
  global_metrics: GlobalMetrics
  regions: RegionMetrics[]
}

export type AlgorithmName = 'BFS' | 'DFS' | 'DIJKSTRA' | 'BELLMAN_FORD'

export interface MarvelMovieSchema {
  movie_id: number
  title: string
  year: number
  phase: number
  budget_million: number
  worldwide_gross_million: number
  opening_weekend_million: number
  profit_million: number
  roi_percent: number
  rotten_tomatoes: number
  metacritic: number
  degree: number
  is_hub: boolean
}

export interface MarvelEdgeSchema {
  source: number
  target: number
  connection_type: string
  shared_characters: string
  weight: number
}

export interface MarvelGraphSchema {
  movies: MarvelMovieSchema[]
  edges: MarvelEdgeSchema[]
  order: number
  size: number
}
