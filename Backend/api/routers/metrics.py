from fastapi import APIRouter

from Backend.api.schemas.metrics import MetricsResponse
from Backend.api.services import graph_service
from Backend.api.services.metrics_service import get_metrics

router = APIRouter(tags=["metrics"])


@router.get("/metrics", response_model=MetricsResponse)
def metrics():
    """Métricas globais do grafo e por região geográfica."""
    graph = graph_service.get_graph()
    return get_metrics(graph)
