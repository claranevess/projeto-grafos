from fastapi import APIRouter, HTTPException

from api.schemas.algorithms import AlgorithmRequest, BfsResult, DfsResult, PathResult
from api.services import algorithm_service, graph_service

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


def _graph():
    return graph_service.get_graph()


def _require_node(graph, code: str, field: str = "source") -> str:
    code = code.strip().upper()
    if not graph.has_node(code):
        raise HTTPException(
            status_code=400,
            detail=f"Aeroporto '{code}' não encontrado no grafo. Verifique o código IATA.",
        )
    return code


@router.post("/bfs", response_model=BfsResult)
def run_bfs(req: AlgorithmRequest):
    """BFS a partir de um aeroporto de origem. Retorna ordem de visitação e camadas por nível."""
    graph = _graph()
    source = _require_node(graph, req.source)
    try:
        return algorithm_service.run_bfs(graph, source)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/dfs", response_model=DfsResult)
def run_dfs(req: AlgorithmRequest):
    """DFS a partir de um aeroporto de origem. Retorna ordem de visitação, ciclos e classificação de arestas."""
    graph = _graph()
    source = _require_node(graph, req.source)
    try:
        return algorithm_service.run_dfs(graph, source)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/dijkstra", response_model=PathResult)
def run_dijkstra(req: AlgorithmRequest):
    """Dijkstra entre origem e destino. Retorna custo mínimo e caminho."""
    if not req.target:
        raise HTTPException(
            status_code=400,
            detail="Campo 'target' é obrigatório para Dijkstra.",
        )
    graph = _graph()
    source = _require_node(graph, req.source, "source")
    target = _require_node(graph, req.target, "target")
    try:
        return algorithm_service.run_dijkstra(graph, source, target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/bellman-ford", response_model=PathResult)
def run_bellman_ford(req: AlgorithmRequest):
    """Bellman-Ford com detecção de ciclos negativos. Target é opcional."""
    graph = _graph()
    source = _require_node(graph, req.source, "source")
    target = _require_node(graph, req.target, "target") if req.target else None
    try:
        return algorithm_service.run_bellman_ford(graph, source, target)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
