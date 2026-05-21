"""
algorithms.py

Módulo com a implementação dos algoritmos de grafos.
"""

from typing import TypedDict
from src.graphs.graph import Graph

class DadosNo(TypedDict):
    estado: str
    distancia: int
    pai: str | None


def bfs(graph: Graph, raiz: str) -> None: # None por enquanto
    dados_nos: dict[str, DadosNo] = {
        no: {"estado": "NAO_VISITADO", "distancia": 0, "pai": None}
        for no in graph.iter_nodes
    }


def dfs(graph: Graph, raiz: str) -> tuple[list[str], bool, dict[tuple[str, str], str]]:
    """
    Executa a Busca em Profundidade (DFS) a partir de uma raiz.

    Retorna uma tupla com:
    - ordem de visitação (lista de nós na ordem em que foram descobertos),
    - booleano indicando se foi detectado ciclo,
    - dicionário classificando cada aresta (tupla ordenada (u, v)) como
      "ARVORE", "RETORNO" ou "CRUZAMENTO".

    Observações:
    - O grafo fornecido é o `Graph` definido em graph.py (não-direcionado).
    - As arestas são armazenadas com chave ordenada (min, max) para evitar
      duplicação devido ao armazenamento bidirecional das arestas.
    - Lança KeyError se a raiz não existir no grafo.
    """
    if not graph.has_node(raiz):
        raise KeyError(f"Nó raiz '{raiz}' não encontrado no grafo.")

    # Inicialização
    estados: dict[str, Estado] = {no: NAO_VISITADO for no in graph.iter_nodes()}
    pais: dict[str, Pai] = {no: None for no in graph.iter_nodes()}
    tin: dict[str, int] = {no: 0 for no in graph.iter_nodes()}
    tout: dict[str, int] = {no: 0 for no in graph.iter_nodes()}
    ordem_visitacao: list[str] = []
    classificacao_arestas: dict[tuple[str, str], str] = {}

    # Contadores/flags
    tempo = 0
    tem_ciclo = False

    def edge_key(a: str, b: str) -> tuple[str, str]:
        return (a, b) if a < b else (b, a)

    def dfs_visit(u: str) -> None:
        nonlocal tempo, tem_ciclo

        estados[u] = VISITADO
        tempo += 1
        tin[u] = tempo
        ordem_visitacao.append(u)

        for aresta in graph.get_neighbors(u):
            v = aresta.destino

            # Em grafos não-direcionados a aresta espelhada leva ao pai; ignoramos
            # esse caso para não classificar a aresta do pai como retorno.
            if pais[u] == v:
                continue

            key = edge_key(u, v)

            if estados[v] == NAO_VISITADO:
                pais[v] = u
                if key not in classificacao_arestas:
                    classificacao_arestas[key] = "ARVORE"
                dfs_visit(v)

            elif estados[v] == VISITADO:
                # Aresta para um ancestral na pilha -> ciclo (retorno)
                if key not in classificacao_arestas:
                    classificacao_arestas[key] = "RETORNO"
                tem_ciclo = True

            else:  # estados[v] == ENCERRADO
                # v já foi totalmente explorado. Decide-se entre cruzamento
                # (ou avanço) — aqui unificamos como CRUZAMENTO.
                if key not in classificacao_arestas:
                    classificacao_arestas[key] = "CRUZAMENTO"

        estados[u] = ENCERRADO
        tempo += 1
        tout[u] = tempo

    # Inicia a DFS a partir da raiz (single-source)
    dfs_visit(raiz)

    return ordem_visitacao, tem_ciclo, classificacao_arestas
