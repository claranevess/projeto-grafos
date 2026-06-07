import pytest

from Backend.src.graphs.algorithms import componentes_conexos, nos_isolados
from Backend.src.graphs.graph import Graph


@pytest.fixture
def grafo_conectado() -> Graph:
    """
    Grafo totalmente conectado (um único componente):
        A -- B -- D
        |    |
        C -- E
    """
    g = Graph()
    for iata in ["A", "B", "C", "D", "E"]:
        g.add_node(iata, f"Cidade {iata}", "Norte")

    for origem, destino in [("A", "B"), ("A", "C"), ("B", "D"), ("B", "E"), ("C", "E")]:
        g.add_edge(origem, destino, 1.0, "regional", "justificativa")

    return g


@pytest.fixture
def grafo_desconectado() -> Graph:
    """
    Grafo com três componentes: {A, B}, {C, D, E} e o nó isolado {F}.
        A -- B        C -- D -- E        F
    """
    g = Graph()
    for iata in ["A", "B", "C", "D", "E", "F"]:
        g.add_node(iata, f"Cidade {iata}", "Norte")

    for origem, destino in [("A", "B"), ("C", "D"), ("D", "E")]:
        g.add_edge(origem, destino, 1.0, "regional", "justificativa")

    return g


def test_componentes_conexos_grafo_unico(grafo_conectado: Graph):
    """Um grafo totalmente conectado deve produzir um único componente com todos os nós."""
    componentes = componentes_conexos(grafo_conectado)

    assert len(componentes) == 1
    assert set(componentes[0]) == {"A", "B", "C", "D", "E"}


def test_componentes_conexos_grafo_desconectado(grafo_desconectado: Graph):
    """Detecta corretamente os 3 componentes (incluindo o nó isolado) e os ordena do maior para o menor."""
    componentes = componentes_conexos(grafo_desconectado)

    tamanhos = [len(c) for c in componentes]
    assert tamanhos == [3, 2, 1]

    conjuntos = [set(c) for c in componentes]
    assert {"C", "D", "E"} in conjuntos
    assert {"A", "B"} in conjuntos
    assert {"F"} in conjuntos

    # A partição cobre todos os nós exatamente uma vez
    todos_os_nos = [no for componente in componentes for no in componente]
    assert sorted(todos_os_nos) == ["A", "B", "C", "D", "E", "F"]


def test_componentes_conexos_grafo_vazio():
    """Um grafo sem nós não deve gerar componentes."""
    assert componentes_conexos(Graph()) == []


def test_nos_isolados_identifica_nos_sem_arestas(grafo_desconectado: Graph):
    """Apenas o nó sem nenhuma aresta (grau 0) deve ser reportado como isolado."""
    assert nos_isolados(grafo_desconectado) == ["F"]


def test_nos_isolados_grafo_totalmente_conectado(grafo_conectado: Graph):
    """Em um grafo onde todo nó tem ao menos uma aresta, não há nós isolados."""
    assert nos_isolados(grafo_conectado) == []