import time

from api.schemas.algorithms import BfsResult, DfsResult, PathResult


def run_bfs(graph, source: str) -> BfsResult:
    from src.graphs.algorithms import bfs

    start = time.perf_counter()
    niveis, visited_order = bfs(graph, source)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Agrupa nós por nível BFS; chaves como string para compatibilidade JSON
    layers: dict[str, list[str]] = {}
    for node, level in niveis.items():
        layers.setdefault(str(level), []).append(node)

    return BfsResult(
        source=source,
        execution_time_ms=round(elapsed_ms, 3),
        visited_order=visited_order,
        layers=layers,
    )


def run_dfs(graph, source: str) -> DfsResult:
    from src.graphs.algorithms import dfs

    start = time.perf_counter()
    visited_order, has_cycle, edge_classification = dfs(graph, source)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # Converte chaves tupla (a, b) para strings "a-b"
    edge_types = {
        f"{a}-{b}": tipo for (a, b), tipo in edge_classification.items()
    }

    return DfsResult(
        source=source,
        execution_time_ms=round(elapsed_ms, 3),
        visited_order=visited_order,
        has_cycle=has_cycle,
        edge_types=edge_types,
    )


def run_dijkstra(graph, source: str, target: str) -> PathResult:
    from src.graphs.algorithms import dijkstra

    start = time.perf_counter()
    cost, path = dijkstra(graph, source, target)
    elapsed_ms = (time.perf_counter() - start) * 1000

    reachable = cost != float("inf")

    return PathResult(
        algorithm="DIJKSTRA",
        source=source,
        target=target,
        cost=cost if reachable else None,
        path=path,
        has_negative_cycle=False,
        execution_time_ms=round(elapsed_ms, 3),
        reachable=reachable,
    )


def run_bellman_ford(graph, source: str, target: str | None = None) -> PathResult:
    from src.graphs.algorithms import bellman_ford

    start = time.perf_counter()
    has_negative_cycle = False
    cost = None
    path: list[str] = []
    reachable = False

    if target:
        try:
            cost, path = bellman_ford(graph, source, target)
            reachable = cost != float("inf")
        except ValueError:
            # Ciclo negativo detectado pelo algoritmo
            has_negative_cycle = True
    else:
        dists, _pais, has_negative_cycle = bellman_ford(graph, source)
        reachable = not has_negative_cycle

    elapsed_ms = (time.perf_counter() - start) * 1000

    return PathResult(
        algorithm="BELLMAN_FORD",
        source=source,
        target=target or "",
        cost=cost if reachable and cost is not None else None,
        path=path,
        has_negative_cycle=has_negative_cycle,
        execution_time_ms=round(elapsed_ms, 3),
        reachable=reachable,
    )
