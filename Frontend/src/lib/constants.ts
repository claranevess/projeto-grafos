export const REGIONS = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'] as const
export type Region = typeof REGIONS[number]

export const REGION_COLORS: Record<Region, string> = {
  'Norte':        '#22d3ee',
  'Nordeste':     '#fb923c',
  'Sudeste':      '#c084fc',
  'Sul':          '#4ade80',
  'Centro-Oeste': '#fbbf24',
}

export const HUB_THRESHOLD = 5

export const IATA_COORDS: Record<string, [number, number]> = {
  REC: [-8.1264, -34.9236],
  SSA: [-12.9086, -38.3225],
  FOR: [-3.7763, -38.5326],
  NAT: [-5.7681, -35.3761],
  JPA: [-7.1458, -34.9502],
  THE: [-5.0598, -42.8235],
  GRU: [-23.4356, -46.4731],
  CGH: [-23.6261, -46.6566],
  GIG: [-22.8099, -43.2505],
  CNF: [-19.6244, -43.9718],
  VIX: [-20.2581, -40.2861],
  BSB: [-15.8711, -47.9186],
  GYN: [-16.6320, -49.2205],
  CWB: [-25.5285, -49.1758],
  FLN: [-27.6706, -48.5525],
  POA: [-29.9944, -51.1713],
  MAO: [-3.0386, -60.0497],
  BEL: [-1.3792, -48.4761],
  PVH: [-8.7093, -63.9024],
  RBR: [-9.8697, -67.8981],
}

export const ALGORITHM_LABELS: Record<string, string> = {
  BFS:         'BFS',
  DFS:         'DFS',
  DIJKSTRA:    'Dijkstra',
  BELLMAN_FORD:'Bellman-Ford',
}

export const ALGORITHM_COLORS: Record<string, string> = {
  BFS:         'var(--accent)',
  DFS:         'var(--secondary)',
  DIJKSTRA:    'var(--path-highlight)',
  BELLMAN_FORD:'var(--destructive)',
}

// Categorias presentes em MARVEL.csv (coluna `category`) — usadas para
// agrupar/colorir filmes nos gráficos e no grafo. 'Unique' identifica
// filmes sem franquia compartilhada (sem aresta sintética por categoria).
export const MARVEL_CATEGORIES = [
  'Avengers', 'Iron Man', 'Captain America', 'Thor', 'Spider-Man',
  'Guardians', 'Black Panther', 'Ant-Man', 'Dr Strange', 'Unique',
] as const

export const CATEGORY_COLORS: Record<string, string> = {
  'Avengers':        '#4ade80',
  'Iron Man':        '#fb923c',
  'Captain America': '#c084fc',
  'Thor':            '#22d3ee',
  'Spider-Man':      '#FFDE21',
  'Guardians':       '#f472b6',
  'Black Panther':   '#a3e635',
  'Ant-Man':         '#fb7185',
  'Dr Strange':      '#38bdf8',
  'Unique':          '#94a3b8',
}
