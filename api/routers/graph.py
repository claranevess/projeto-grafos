from fastapi import APIRouter

from api.schemas.graph import GraphSchema, NodeSchema
from api.services import graph_service

router = APIRouter(tags=["graph"])


@router.get("/graph", response_model=GraphSchema)
def get_graph():
    """Retorna o grafo completo: nós (aeroportos) e arestas (rotas)."""
    return graph_service.get_graph_schema()


@router.get("/airports", response_model=list[NodeSchema])
def list_airports():
    """Lista todos os aeroportos ordenados por IATA — usado para autocomplete."""
    return graph_service.get_airports_list()
