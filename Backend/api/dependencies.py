from Backend.api.services.graph_service import get_graph


def get_graph_dep():
    """Dependência FastAPI que retorna o grafo singleton já carregado."""
    return get_graph()
