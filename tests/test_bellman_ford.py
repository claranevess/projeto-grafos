import pytest

from Backend.src.graphs.algorithms import bellman_ford
from Backend.src.graphs.graph import Graph


def test_bellman_ford_com_pesos_negativos_sem_ciclo():
    """
    Testa Bellman-Ford com uma aresta de peso negativo.
    Para não formar um ciclo não-direcionado negativo de ida e volta,
    inserimos a aresta apenas de B para C no ambiente de teste,
    simulando um caminho de fluxo à frente.
    Caminho: A --(1.0)--> B --(-2.0)--> C
    """
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")
    g.add_node("B", "Cidade B", "Norte")
    g.add_node("C", "Cidade C", "Norte")

    # Inserção segura para peso positivo (A <-> B)
    g.add_edge("A", "B", 1.0, "regional", "justificativa")

    # Inserimos apenas na saída de B para C para permitir o teste do peso negativo
    # sem criar o ciclo de retorno automático (C -> B) que invalidaria o teste
    g.add_directed_edge("B", "C", -2.0, "regional", "justificativa", allow_negative=True)
    # Deixamos a lista de C vazia para ser um nó terminal no fluxo

    distancias, pais, tem_ciclo = bellman_ford(g, "A")

    assert tem_ciclo is False
    assert distancias["A"] == 0.0
    assert distancias["B"] == 1.0
    assert distancias["C"] == -1.0
    assert pais["C"] == "B"
    assert pais["B"] == "A"


def test_bellman_ford_com_ciclo_negativo():
    """
    Testa se o algoritmo detecta corretamente um ciclo negativo.
    Em um grafo não-direcionado, uma única aresta negativa cria 
    um ciclo de ida e volta negativo.
    """
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")
    g.add_node("B", "Cidade B", "Norte")

    # Inserção mútua com peso negativo -> Ciclo negativo de ida e volta imediato
    g.add_directed_edge("A", "B", -5.0, "regional", "justificativa", allow_negative=True)
    g.add_directed_edge("B", "A", -5.0, "regional", "justificativa", allow_negative=True)

    distancias, pais, tem_ciclo = bellman_ford(g, "A")

    assert tem_ciclo is True


def test_bellman_ford_raiz_inexistente():
    g = Graph()
    g.add_node("A", "Cidade A", "Norte")

    with pytest.raises(KeyError, match="Nó raiz 'Z' não encontrado no grafo."):
        bellman_ford(g, "Z")
