import axios from 'axios'
import type {
  GraphSchema, NodeSchema, MetricsResponse,
  AlgorithmRequest, BfsResult, DfsResult, PathResult,
  MarvelGraphSchema, MarvelMovieSchema,
} from './types'

const http = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

export const graphApi = {
  getGraph:    () => http.get<GraphSchema>('/graph').then(r => r.data),
  getAirports: () => http.get<NodeSchema[]>('/airports').then(r => r.data),
  getMetrics:  () => http.get<MetricsResponse>('/metrics').then(r => r.data),
}

export const algorithmApi = {
  bfs:        (req: AlgorithmRequest) => http.post<BfsResult>('/algorithms/bfs', req).then(r => r.data),
  dfs:        (req: AlgorithmRequest) => http.post<DfsResult>('/algorithms/dfs', req).then(r => r.data),
  dijkstra:   (req: AlgorithmRequest) => http.post<PathResult>('/algorithms/dijkstra', req).then(r => r.data),
  bellmanFord:(req: AlgorithmRequest) => http.post<PathResult>('/algorithms/bellman-ford', req).then(r => r.data),
}

export const marvelApi = {
  getGraph:   () => http.get<MarvelGraphSchema>('/marvel/graph').then(r => r.data),
  getMovies:  () => http.get<MarvelMovieSchema[]>('/marvel/movies').then(r => r.data),
  bfs:        (req: { source: number; target?: number }) => http.post('/marvel/algorithms/bfs', req).then(r => r.data),
  dfs:        (req: { source: number; target?: number }) => http.post('/marvel/algorithms/dfs', req).then(r => r.data),
  dijkstra:   (req: { source: number; target: number  }) => http.post('/marvel/algorithms/dijkstra', req).then(r => r.data),
  bellmanFord:(req: { source: number; target?: number }) => http.post('/marvel/algorithms/bellman-ford', req).then(r => r.data),
}
