import pytest

from src.graphs.algorithms import dijkstra
from src.graphs.graph import EdgeData, Graph


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def weighted_graph() -> Graph:
    """
    Grafo ponderado para testes:

        A --1-- B --2-- D
        |               |
        3               1
        |               |
        C ------4------ E

    Distâncias mínimas a partir de A:
        A=0, B=1, C=3, D=3, E=4
    Caminho A→D: A → B → D (custo 3)
    Caminho A→E: A → B → D → E (custo 4)
    """
    g = Graph()
    for iata in ["A", "B", "C", "D", "E"]:
        g.add_node(iata, f"Cidade {iata}", "Norte")

    g.add_edge("A", "B", 1.0, "regional", "teste")
    g.add_edge("A", "C", 3.0, "regional", "teste")
    g.add_edge("B", "D", 2.0, "regional", "teste")
    g.add_edge("D", "E", 1.0, "regional", "teste")
    g.add_edge("C", "E", 4.0, "regional", "teste")

    return g


@pytest.fixture
def disconnected_graph() -> Graph:
    """Grafo com nó C desconectado de A e B."""
    g = Graph()
    for iata in ["A", "B", "C"]:
        g.add_node(iata, f"Cidade {iata}", "Norte")
    g.add_edge("A", "B", 1.0, "regional", "teste")
    return g


# ---------------------------------------------------------------------------
# Caminho mais curto com target especificado
# ---------------------------------------------------------------------------

def test_shortest_path_cost_and_route(weighted_graph: Graph):
    """Custo e percurso corretos para caminho A→D."""
    custo, caminho = dijkstra(weighted_graph, "A", "D")
    assert custo == 3.0
    assert caminho == ["A", "B", "D"]


def test_shortest_path_longer_route(weighted_graph: Graph):
    """Custo e percurso corretos para caminho A→E."""
    custo, caminho = dijkstra(weighted_graph, "A", "E")
    assert custo == 4.0
    assert caminho == ["A", "B", "D", "E"]


def test_shortest_path_to_self(weighted_graph: Graph):
    """Custo de A para A é 0 e o caminho contém apenas A."""
    custo, caminho = dijkstra(weighted_graph, "A", "A")
    assert custo == 0.0
    assert caminho == ["A"]


# ---------------------------------------------------------------------------
# Modo sem target: todas as distâncias mínimas
# ---------------------------------------------------------------------------

def test_all_distances_from_source(weighted_graph: Graph):
    """Distâncias mínimas de A para todos os nós."""
    distancias = dijkstra(weighted_graph, "A")
    assert distancias["A"] == 0.0
    assert distancias["B"] == 1.0
    assert distancias["C"] == 3.0
    assert distancias["D"] == 3.0
    assert distancias["E"] == 4.0


def test_all_distances_unreachable_node(disconnected_graph: Graph):
    """Nó inalcançável deve ter distância infinita no modo sem target."""
    distancias = dijkstra(disconnected_graph, "A")
    assert distancias["C"] == float("inf")


# ---------------------------------------------------------------------------
# Nós inalcançáveis com target especificado
# ---------------------------------------------------------------------------

def test_unreachable_target_returns_inf_and_empty_path(disconnected_graph: Graph):
    """Quando target é inalcançável, retorna (inf, [])."""
    custo, caminho = dijkstra(disconnected_graph, "A", "C")
    assert custo == float("inf")
    assert caminho == []


# ---------------------------------------------------------------------------
# Peso negativo levanta ValueError
# ---------------------------------------------------------------------------

def test_negative_weight_raises_value_error():
    """Dijkstra deve levantar ValueError ao encontrar aresta com peso negativo."""
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")
    g.add_node("B", "Cidade B", "Norte")

    # Insere aresta negativa diretamente, contornando a validação do add_edge
    g._adjacency["A"].append(
        EdgeData(destino="B", peso=-1.0, tipo_conexao="test", justificativa="test")
    )
    g._adjacency["B"].append(
        EdgeData(destino="A", peso=-1.0, tipo_conexao="test", justificativa="test")
    )

    with pytest.raises(ValueError, match="negativ"):
        dijkstra(g, "A", "B")


def test_negative_weight_without_target_raises_value_error():
    """ValueError também é levantado no modo sem target ao encontrar peso negativo."""
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")
    g.add_node("B", "Cidade B", "Norte")

    g._adjacency["A"].append(
        EdgeData(destino="B", peso=-5.0, tipo_conexao="test", justificativa="test")
    )
    g._adjacency["B"].append(
        EdgeData(destino="A", peso=-5.0, tipo_conexao="test", justificativa="test")
    )

    with pytest.raises(ValueError, match="negativ"):
        dijkstra(g, "A")


# ---------------------------------------------------------------------------
# Validação de nó de origem inexistente
# ---------------------------------------------------------------------------

def test_missing_source_raises_key_error(weighted_graph: Graph):
    """KeyError ao passar source que não existe no grafo."""
    with pytest.raises(KeyError, match="Z"):
        dijkstra(weighted_graph, "Z", "A")
