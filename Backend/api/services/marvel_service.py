import csv
import functools
import time
from pathlib import Path

from Backend.api.schemas.marvel import (
    MarvelBfsResult,
    MarvelDfsResult,
    MarvelEdgeSchema,
    MarvelGraphSchema,
    MarvelMovieSchema,
    MarvelPathResult,
)

_DATASET_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "dataset_parte2"

# Filmes com grau >= MARVEL_HUB_THRESHOLD (acima do grau médio do grafo, ~2.3) viram hubs
MARVEL_HUB_THRESHOLD = 3


@functools.lru_cache(maxsize=1)
def _load_graph():
    from Backend.src.graphs.io import carregar_dataset_parte2
    return carregar_dataset_parte2(str(_DATASET_DIR))


def get_graph():
    return _load_graph()


@functools.lru_cache(maxsize=1)
def _load_movie_rows() -> dict[str, dict]:
    """Lê MARVEL.csv e indexa as linhas pelo título do filme (coluna `film`)."""
    rows: dict[str, dict] = {}
    with (_DATASET_DIR / "MARVEL.csv").open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            title = (row.get("film") or "").strip()
            if title:
                rows[title] = row
    return rows


def _parse_percent(raw: str | None) -> float:
    if not raw:
        return 0.0
    return float(raw.strip().rstrip("%"))


@functools.lru_cache(maxsize=1)
def _build_index():
    """Monta os mapas movie_id <-> node_id e os metadados enriquecidos de cada filme.

    O grafo interno usa ids string (`FILM_IRON-MAN`), mas o Frontend espera
    `movie_id` numérico em todo lugar (nós, arestas, resultados de algoritmo).
    Os ids numéricos são atribuídos em ordem alfabética dos node_ids — estável
    entre execuções, já que depende só do conteúdo do CSV. O enriquecimento
    (categoria, bilheteria, ROI etc.) vem de MARVEL.csv, casado pelo título
    original guardado em `cidade` por `carregar_dataset_parte2`.
    """
    graph = _load_graph()
    rows_by_title = _load_movie_rows()

    node_ids = sorted(graph.iter_nodes())
    node_to_movie: dict[str, int] = {node_id: i + 1 for i, node_id in enumerate(node_ids)}
    movie_to_node: dict[int, str] = {movie_id: node_id for node_id, movie_id in node_to_movie.items()}

    movies: dict[int, MarvelMovieSchema] = {}
    for node_id, movie_id in node_to_movie.items():
        nd = graph.get_node(node_id)
        title = nd.cidade
        row = rows_by_title.get(title, {})
        degree = graph.degree(node_id)
        movies[movie_id] = MarvelMovieSchema(
            movie_id=movie_id,
            title=title,
            year=int(row.get("year") or 0),
            category=(row.get("category") or "").strip(),
            budget_million=float(row.get("budget") or 0),
            worldwide_gross_million=float(row.get("worldwide gross ($m)") or 0),
            roi_percent=_parse_percent(row.get("% budget recovered")),
            degree=degree,
            is_hub=degree >= MARVEL_HUB_THRESHOLD,
        )

    return node_to_movie, movie_to_node, movies


def _node_to_movie() -> dict[str, int]:
    return _build_index()[0]


def _movie_to_node() -> dict[int, str]:
    return _build_index()[1]


def _movies_by_id() -> dict[int, MarvelMovieSchema]:
    return _build_index()[2]


def has_movie(movie_id: int) -> bool:
    return movie_id in _movies_by_id()


def get_marvel_graph_schema() -> MarvelGraphSchema:
    graph = get_graph()
    node_to_movie = _node_to_movie()
    movies = _movies_by_id()

    edges = []
    for origem, edge in graph.iter_edges():
        edges.append(MarvelEdgeSchema(
            source=node_to_movie[origem],
            target=node_to_movie[edge.destino],
            connection_type=edge.tipo_conexao,
            weight=edge.peso,
        ))

    return MarvelGraphSchema(
        movies=sorted(movies.values(), key=lambda m: m.movie_id),
        edges=edges,
        order=graph.order(),
        size=graph.size(),
    )


def get_marvel_movies_list() -> list[MarvelMovieSchema]:
    return sorted(_movies_by_id().values(), key=lambda m: m.movie_id)


def run_bfs(source: int) -> MarvelBfsResult:
    from Backend.src.graphs.algorithms import bfs

    graph = get_graph()
    node_to_movie = _node_to_movie()
    source_node = _movie_to_node()[source]

    start = time.perf_counter()
    niveis, _pais, visited_order = bfs(graph, source_node)
    elapsed_ms = (time.perf_counter() - start) * 1000

    layers: dict[str, list[int]] = {}
    for node, level in niveis.items():
        if level != float("inf"):
            layers.setdefault(str(level), []).append(node_to_movie[node])

    return MarvelBfsResult(
        source=source,
        execution_time_ms=round(elapsed_ms, 3),
        visited_order=[node_to_movie[n] for n in visited_order],
        layers=layers,
    )


def run_dfs(source: int) -> MarvelDfsResult:
    from Backend.src.graphs.algorithms import dfs

    graph = get_graph()
    node_to_movie = _node_to_movie()
    source_node = _movie_to_node()[source]

    start = time.perf_counter()
    visited_order, has_cycle, edge_classification = dfs(graph, source_node)
    elapsed_ms = (time.perf_counter() - start) * 1000

    edge_types = {
        f"{node_to_movie[a]}-{node_to_movie[b]}": tipo
        for (a, b), tipo in edge_classification.items()
    }

    return MarvelDfsResult(
        source=source,
        execution_time_ms=round(elapsed_ms, 3),
        visited_order=[node_to_movie[n] for n in visited_order],
        has_cycle=has_cycle,
        edge_types=edge_types,
    )


def run_dijkstra(source: int, target: int) -> MarvelPathResult:
    from Backend.src.graphs.algorithms import dijkstra

    graph = get_graph()
    node_to_movie = _node_to_movie()
    movie_to_node = _movie_to_node()
    source_node = movie_to_node[source]
    target_node = movie_to_node[target]

    start = time.perf_counter()
    cost, path = dijkstra(graph, source_node, target_node)
    elapsed_ms = (time.perf_counter() - start) * 1000

    reachable = cost != float("inf")

    return MarvelPathResult(
        algorithm="DIJKSTRA",
        source=source,
        target=target,
        cost=cost if reachable else None,
        path=[node_to_movie[n] for n in path],
        has_negative_cycle=False,
        execution_time_ms=round(elapsed_ms, 3),
        reachable=reachable,
    )


def run_bellman_ford(source: int, target: int | None = None) -> MarvelPathResult:
    from Backend.src.graphs.algorithms import bellman_ford

    graph = get_graph()
    node_to_movie = _node_to_movie()
    movie_to_node = _movie_to_node()
    source_node = movie_to_node[source]
    target_node = movie_to_node[target] if target is not None else None

    start = time.perf_counter()
    has_negative_cycle = False
    cost = None
    path: list[str] = []
    reachable = False

    if target_node:
        try:
            cost, path = bellman_ford(graph, source_node, target_node)
            reachable = cost != float("inf")
        except ValueError:
            # Ciclo negativo detectado pelo algoritmo
            has_negative_cycle = True
    else:
        _dists, _pais, has_negative_cycle = bellman_ford(graph, source_node)
        reachable = not has_negative_cycle

    elapsed_ms = (time.perf_counter() - start) * 1000

    return MarvelPathResult(
        algorithm="BELLMAN_FORD",
        source=source,
        target=target,
        cost=cost if reachable and cost is not None else None,
        path=[node_to_movie[n] for n in path],
        has_negative_cycle=has_negative_cycle,
        execution_time_ms=round(elapsed_ms, 3),
        reachable=reachable,
    )