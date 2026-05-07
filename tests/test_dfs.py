import pytest

from src.graphs.algorithms import dfs
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


def test_dfs_basic(sample_graph: Graph):
	"""Testa a execução básica do DFS a partir da raiz 'A'."""
	raiz = "A"
	ordem, tem_ciclo, classificacao = dfs(sample_graph, raiz)

	# Verifica a ordem de visitação mínima (raiz primeiro) e cobertura dos nós
	assert ordem[0] == raiz
	assert len(ordem) == 5
	assert set(ordem) == {"A", "B", "C", "D", "E"}

	# O grafo contém um ciclo A-B-E-C-A
	assert tem_ciclo is True

	expected_classificacao = {
		("A", "B"): "ARVORE",
		("B", "D"): "ARVORE",
		("B", "E"): "ARVORE",
		("C", "E"): "ARVORE",
		("A", "C"): "RETORNO",
	}
	assert classificacao == expected_classificacao


def test_dfs_non_existent_root(sample_graph: Graph):
	"""Verifica se o DFS levanta um erro para um nó raiz que não existe."""
	with pytest.raises(KeyError, match="Nó raiz 'Z' não encontrado no grafo."):
		dfs(sample_graph, "Z")


def test_dfs_disconnected_graph():
	"""Testa o DFS em um grafo com componentes desconectados."""
	g = Graph()
	g.add_node("A", "Cidade A", "Norte")
	g.add_node("B", "Cidade B", "Norte")
	g.add_node("C", "Cidade C", "Sul")  # Componente desconectado

	g.add_edge("A", "B", 1.0, "regional", "justificativa")

	ordem, tem_ciclo, classificacao = dfs(g, "A")

	# Apenas nós alcançáveis devem estar no resultado
	expected_ordem = ["A", "B"]
	assert set(ordem) == set(expected_ordem)
	assert tem_ciclo is False
	assert classificacao == {("A", "B"): "ARVORE"}

