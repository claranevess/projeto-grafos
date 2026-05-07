"""
algorithms.py

Módulo com a implementação dos algoritmos de grafos.
"""

from collections import deque
from typing import Any, TypeAlias

# Suporte para import quando o módulo é executado diretamente (sem package)
try:
    from .graph import Graph
except Exception:
    # Ao executar o arquivo diretamente, o contexto de pacote pode não existir.
    # Insere o diretório do projeto no sys.path e tenta import absoluto.
    import os
    import sys

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    from src.graphs.graph import Graph

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
