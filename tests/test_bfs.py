import pytest

from src.graphs.algorithms import bfs
from src.graphs.graph import Graph


@pytest.fixture
def sample_graph() -> Graph:
    """
    Cria um grafo de exemplo para os testes.
    Grafo:
        A -- B -- D
        |    |
        C -- E
    """
    g = Graph()
    nodes = {
        "A": ("A", "Cidade A", "Norte"),
        "B": ("B", "Cidade B", "Norte"),
        "C": ("C", "Cidade C", "Norte"),
        "D": ("D", "Cidade D", "Norte"),
        "E": ("E", "Cidade E", "Norte"),
    }
    for iata, cidade, regiao in nodes.values():
        g.add_node(iata, cidade, regiao)

    edges = [
        ("A", "B", 1.0),
        ("A", "C", 1.0),
        ("B", "D", 1.0),
        ("B", "E", 1.0),
        ("C", "E", 1.0),
    ]
    for origem, destino, peso in edges:
        g.add_edge(origem, destino, peso, "regional", "justificativa")

    return g


def test_bfs_basic(sample_graph: Graph):
    """Testa a execução básica do BFS a partir da raiz 'A'."""
    raiz = "A"
    niveis, ordem_visitacao = bfs(sample_graph, raiz)

    # Verifica os níveis (distâncias)
    expected_niveis = {
        "A": 0,
        "B": 1,
        "C": 1,
        "D": 2,
        "E": 2,
    }
    assert niveis == expected_niveis

    # Verifica a ordem de visitação
    # A ordem exata pode variar dependendo da ordem de inserção das arestas.
    # O importante é que a raiz seja a primeira.
    assert ordem_visitacao[0] == raiz
    assert len(ordem_visitacao) == len(expected_niveis)
    assert set(ordem_visitacao) == set(expected_niveis.keys())


def test_bfs_different_root(sample_graph: Graph):
    """Testa a execução do BFS a partir de uma raiz diferente ('D')."""
    raiz = "D"
    niveis, _ = bfs(sample_graph, raiz)

    expected_niveis = {
        "D": 0,
        "B": 1,
        "A": 2,
        "E": 2,
        "C": 3,
    }
    assert niveis == expected_niveis


def test_bfs_non_existent_root(sample_graph: Graph):
    """Verifica se o BFS levanta um erro para um nó raiz que não existe."""
    with pytest.raises(KeyError, match="Nó raiz 'Z' não encontrado no grafo."):
        bfs(sample_graph, "Z")


def test_bfs_disconnected_graph():
    """Testa o BFS em um grafo com componentes desconectados."""
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")
    g.add_node("B", "Cidade B", "Norte")
    g.add_node("C", "Cidade C", "Sul")  # Componente desconectado

    g.add_edge("A", "B", 1.0, "regional", "justificativa")

    niveis, ordem_visitacao = bfs(g, "A")

    # Apenas nós alcançáveis devem estar no resultado
    expected_niveis = {"A": 0, "B": 1}
    expected_ordem = ["A", "B"]

    assert niveis == expected_niveis
    assert set(ordem_visitacao) == set(expected_ordem)
