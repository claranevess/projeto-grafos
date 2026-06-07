from fastapi import APIRouter, HTTPException

from Backend.api.schemas.marvel import (
    MarvelAlgorithmRequest,
    MarvelBfsResult,
    MarvelDfsResult,
    MarvelGraphSchema,
    MarvelMovieSchema,
    MarvelPathResult,
)
from Backend.api.services import marvel_service

router = APIRouter(prefix="/marvel", tags=["marvel"])


def _require_movie(movie_id: int | None, field: str = "source") -> int:
    if movie_id is None or not marvel_service.has_movie(movie_id):
        raise HTTPException(
            status_code=400,
            detail=f"Filme com movie_id={movie_id} não encontrado no grafo Marvel (campo '{field}').",
        )
    return movie_id


@router.get("/graph", response_model=MarvelGraphSchema)
def get_graph():
    """Retorna o grafo Marvel completo: filmes (nós) e conexões por categoria (arestas)."""
    return marvel_service.get_marvel_graph_schema()


@router.get("/movies", response_model=list[MarvelMovieSchema])
def list_movies():
    """Lista todos os filmes Marvel ordenados por movie_id — usado para seleção de origem/destino."""
    return marvel_service.get_marvel_movies_list()


@router.post("/algorithms/bfs", response_model=MarvelBfsResult)
def run_bfs(req: MarvelAlgorithmRequest):
    """BFS a partir de um filme de origem. Retorna ordem de visitação e camadas por nível."""
    source = _require_movie(req.source)
    try:
        return marvel_service.run_bfs(source)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/algorithms/dfs", response_model=MarvelDfsResult)
def run_dfs(req: MarvelAlgorithmRequest):
    """DFS a partir de um filme de origem. Retorna ordem de visitação, ciclos e classificação de arestas."""
    source = _require_movie(req.source)
    try:
        return marvel_service.run_dfs(source)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/algorithms/dijkstra", response_model=MarvelPathResult)
def run_dijkstra(req: MarvelAlgorithmRequest):
    """Dijkstra entre dois filmes. Retorna custo mínimo e caminho de conexões."""
    if req.target is None:
        raise HTTPException(status_code=400, detail="Campo 'target' é obrigatório para Dijkstra.")
    source = _require_movie(req.source, "source")
    target = _require_movie(req.target, "target")
    try:
        return marvel_service.run_dijkstra(source, target)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/algorithms/bellman-ford", response_model=MarvelPathResult)
def run_bellman_ford(req: MarvelAlgorithmRequest):
    """Bellman-Ford a partir de um filme de origem, com detecção de ciclos negativos. Target é opcional."""
    source = _require_movie(req.source, "source")
    target = _require_movie(req.target, "target") if req.target is not None else None
    try:
        return marvel_service.run_bellman_ford(source, target)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))