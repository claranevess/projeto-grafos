import heapq
from collections import deque

# NOTE: typing annotations removed from core algorithm module to comply with
# discipline rules; types are documented in docstrings and comments.

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

# Tipos documentados apenas nos docstrings; removeram-se aliases e
# anotações para obedecer à política do núcleo (sem typing).

# Constantes para estados dos nós
NAO_VISITADO = "NAO_VISITADO"
VISITADO = "VISITADO"
ENCERRADO = "ENCERRADO"


def bfs(graph, raiz):
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
    estados = {no: NAO_VISITADO for no in graph.iter_nodes()}
    distancias = {no: float("inf") for no in graph.iter_nodes()}
    pais = {no: None for no in graph.iter_nodes()}
    ordem_visitacao = []

    # 2. Configuração da raiz
    estados[raiz] = VISITADO
    distancias[raiz] = 0
    # pais[raiz] já é None

    fila = deque([raiz])

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


def dfs(graph, raiz):
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
    estados = {no: NAO_VISITADO for no in graph.iter_nodes()}
    pais = {no: None for no in graph.iter_nodes()}
    tin = {no: 0 for no in graph.iter_nodes()}
    tout = {no: 0 for no in graph.iter_nodes()}
    ordem_visitacao = []
    classificacao_arestas = {}

    # Contadores/flags
    tempo = 0
    tem_ciclo = False

    def edge_key(a, b):
        return (a, b) if a < b else (b, a)

    def dfs_visit(u):
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

    dist = {no: float("inf") for no in graph.iter_nodes()}
    dist[source] = 0.0
    pred = {no: None for no in graph.iter_nodes()}

    # Implementação simples sem heap (O(V^2)): seleciona o nó não visitado
    # com menor distância. Evita dependência de `heapq` no núcleo.
    unvisited = set(graph.iter_nodes())

    while unvisited:
        # seleciona nó com menor distância atual
        u = min(unvisited, key=lambda n: dist.get(n, float("inf")))
        d = dist.get(u, float("inf"))

        # se o menor é infinito, nós restantes são inalcançáveis
        if d == float("inf"):
            break

        unvisited.remove(u)

        # early stop se atingimos o alvo
        if target is not None and u == target:
            break

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

    if target is None:
        return dist

    # Nó inalcançável
    if dist[target] == float("inf"):
        return float("inf"), []

    # Reconstrói o caminho via dicionário de predecessores
    caminho = []
    node = target
    while node is not None:
        caminho.append(node)
        node = pred[node]
    caminho.reverse()

    return dist[target], caminho


def bellman_ford(graph, raiz, target=None):
    """
    Executa o algoritmo de Bellman-Ford a partir de um nó raiz.

    O algoritmo calcula as distâncias mínimas permitindo pesos negativos
    e detecta a presença de ciclos de peso negativo alcançáveis a partir da raiz.

    Parâmetros
    ----------
    graph : Graph
        O grafo (não-direcionado) no qual o algoritmo será executado.
    raiz : str
        O código IATA do nó inicial.

    Returns
    -------
    tuple
        - Se `target` for None: (distancias: dict[node, float], pais: dict[node, parent], tem_ciclo: bool)
        - Se `target` for informado: (custo: float, caminho: list[node])

    Raises
    ------
    KeyError
        Se o nó raiz não existir no grafo.
    """
    if not graph.has_node(raiz):
        raise KeyError(f"Nó raiz '{raiz}' não encontrado no grafo.")

    # 1. Inicialização
    distancias = {no: float("inf") for no in graph.iter_nodes()}
    pais = {no: None for no in graph.iter_nodes()}
    distancias[raiz] = 0.0

    nos = list(graph.iter_nodes())
    num_vertices = len(nos)

    # 2. Relaxamento das arestas (V - 1) vezes
    for _ in range(num_vertices - 1):
        mudou = False
        for u in nos:
            if distancias[u] == float("inf"):
                continue
            for aresta in graph.get_neighbors(u):
                v = aresta.destino
                # No seu objeto, assume-se que 'aresta.peso' guarda o valor numérico
                peso = aresta.peso

                if distancias[u] + peso < distancias[v]:
                    distancias[v] = distancias[u] + peso
                    pais[v] = u
                    mudou = True
        if not mudou:
            break

    # 3. Verificação de ciclos negativos (passagem V)
    tem_ciclo_negativo = False
    for u in nos:
        if distancias[u] == float("inf"):
            continue
        for aresta in graph.get_neighbors(u):
            v = aresta.destino
            peso = aresta.peso
            if distancias[u] + peso < distancias[v]:
                tem_ciclo_negativo = True
                break
        if tem_ciclo_negativo:
            break

    # Se target não foi informado, retornamos a API clássica (distancias, pais, tem_ciclo_negativo)
    if target is None:
        return distancias, pais, tem_ciclo_negativo

    # Se target foi informado, convertemos para API ponto-a-ponto semelhante ao Dijkstra
    if tem_ciclo_negativo:
        raise ValueError("Ciclo de peso negativo detectado; caminho não confiável.")

    if distancias.get(target, float("inf")) == float("inf"):
        return float("inf"), []

    # Reconstrói caminho usando o dicionário de predecessores
    caminho = []
    node = target
    while node is not None:
        caminho.append(node)
        node = pais[node]
    caminho.reverse()

    return distancias[target], caminho
