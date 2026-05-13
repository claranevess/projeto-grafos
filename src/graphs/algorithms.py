"""
algorithms.py

Módulo com a implementação dos algoritmos de grafos.
"""

import heapq
from collections import deque
from typing import Any, TypeAlias

from .graph import Graph

# Tipos de dados para clareza
Estado: TypeAlias = str
Distancia: TypeAlias = int | float
Pai: TypeAlias = str | None

# Constantes para estados dos nós
NAO_VISITADO = "NAO_VISITADO"
VISITADO = "VISITADO"
ENCERRADO = "ENCERRADO"


def bfs(graph: Graph, raiz: str) -> tuple[dict[str, int], list[str]]:
    """
    Executa a Busca em Largura (BFS) em um grafo a partir de um nó raiz.

    O algoritmo calcula a menor distância (em número de arestas) da raiz
    para todos os outros nós alcançáveis.

    Estruturas de dados auxiliares:
    - Fila (deque): para controlar a ordem de descoberta dos nós.
    - Dicionários: para armazenar estado, distância e pai de cada nó.

    Fluxo de Execução:
    1.  Inicialização: Todos os nós são marcados como NAO_VISITADO,
        com distância infinita e pai nulo, exceto a raiz.
    2.  Raiz: A raiz é marcada como VISITADO, com distância 0, e
        adicionada à fila.
    3.  Laço Principal: Enquanto a fila não estiver vazia:
        a.  Remove-se um nó `u` da fila.
        b.  Para cada vizinho `v` de `u`:
            - Se `v` for NAO_VISITADO, ele é marcado como VISITADO,
              sua distância é atualizada (dist(u) + 1), seu pai é
              definido como `u`, e ele é adicionado à fila.
        c.  Após visitar todos os vizinhos, `u` é marcado como ENCERRADO.

    Parâmetros
    ----------
    graph : Graph
        O grafo (não-direcionado) no qual o algoritmo será executado.
    raiz : str
        O código IATA do nó inicial (raiz da busca).

    Retorno
    -------
    tuple[dict[str, int], list[str]]
        - Um dicionário mapeando cada nó alcançável à sua distância (nível)
          a partir da raiz.
        - Uma lista com a ordem de visitação dos nós.

    Raises
    ------
    KeyError
        Se o nó raiz não existir no grafo.
    """
    if not graph.has_node(raiz):
        raise KeyError(f"Nó raiz '{raiz}' não encontrado no grafo.")

    # 1. Inicialização
    estados: dict[str, Estado] = {no: NAO_VISITADO for no in graph.iter_nodes()}
    distancias: dict[str, Any] = {no: float("inf") for no in graph.iter_nodes()}
    pais: dict[str, Pai] = {no: None for no in graph.iter_nodes()}
    ordem_visitacao: list[str] = []

    # 2. Configuração da raiz
    estados[raiz] = VISITADO
    distancias[raiz] = 0
    # pais[raiz] já é None

    fila: deque[str] = deque([raiz])

    # 3. Laço Principal
    while fila:
        u = fila.popleft()
        ordem_visitacao.append(u)

        for aresta in graph.get_neighbors(u):
            v = aresta.destino
            if estados[v] == NAO_VISITADO:
                estados[v] = VISITADO
                distancias[v] = distancias[u] + 1
                pais[v] = u
                fila.append(v)

        estados[u] = ENCERRADO

    # Filtra o dicionário de distâncias para incluir apenas nós alcançáveis
    niveis = {no: dist for no, dist in distancias.items() if dist != float("inf")}

    return niveis, ordem_visitacao


def dfs(graph: Graph, raiz: str) -> tuple[list[str], set[tuple[str, str]]]:
    """Busca em Profundidade (DFS) — implementação completa pendente."""
    raise NotImplementedError("DFS ainda não implementado.")


def dijkstra(
        graph: Graph,
        source: str,
        target: str | None = None,
) -> dict[str, float] | tuple[float, list[str]]:
    """
    Algoritmo de Dijkstra para caminhos mínimos com pesos não-negativos.

    Parâmetros
    ----------
    graph  : Grafo ponderado não-direcionado.
    source : Nó de origem.
    target : Nó de destino (opcional).
               - Se informado, retorna (custo_total, caminho).
               - Se None, retorna dict com distâncias mínimas de source a todos
                 os nós.

    Raises
    ------
    KeyError   : Se source não existir no grafo.
    ValueError : Se qualquer aresta percorrida tiver peso negativo.
    """
    if not graph.has_node(source):
        raise KeyError(f"Nó origem '{source}' não encontrado no grafo.")

    dist: dict[str, float] = {no: float("inf") for no in graph.iter_nodes()}
    dist[source] = 0.0
    pred: dict[str, str | None] = {no: None for no in graph.iter_nodes()}

    # Heap: (distância acumulada, nó)
    heap: list[tuple[float, str]] = [(0.0, source)]
    visitados: set[str] = set()

    while heap:
        d, u = heapq.heappop(heap)

        if u in visitados:
            continue
        visitados.add(u)

        for aresta in graph.get_neighbors(u):
            if aresta.peso < 0:
                raise ValueError(
                    f"Dijkstra não suporta pesos negativos. "
                    f"Aresta {u}→{aresta.destino} tem peso {aresta.peso}."
                )
            nova_dist = d + aresta.peso
            if nova_dist < dist[aresta.destino]:
                dist[aresta.destino] = nova_dist
                pred[aresta.destino] = u
                heapq.heappush(heap, (nova_dist, aresta.destino))

    if target is None:
        return dist

    # Nó inalcançável
    if dist[target] == float("inf"):
        return float("inf"), []

    # Reconstrói o caminho via dicionário de predecessores
    caminho: list[str] = []
    no: str | None = target
    while no is not None:
        caminho.append(no)
        no = pred[no]
    caminho.reverse()

    return dist[target], caminho


def bellman_ford(
        graph: Graph,
        origem: str,
        destino: str | None = None,
) -> dict[str, float] | tuple[float, list[str]]:
    """Bellman-Ford para pesos negativos — implementação completa pendente."""
    raise NotImplementedError("Bellman-Ford ainda não implementado.")
