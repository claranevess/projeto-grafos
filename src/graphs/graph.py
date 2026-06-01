"""
graph.py
Estrutura de dados principal: Grafo não-direcionado baseado em Lista de Adjacência.

Design:
  - _adjacency : dict[str, list[EdgeData]]  → estrutura de busca (algoritmos)
  - _nodes     : dict[str, NodeData]        → metadados dos nós (cidade, região)

Os dois dicionários são mantidos separados propositalmente:
  * Os algoritmos (BFS, DFS, Dijkstra, Bellman-Ford) iteram apenas sobre _adjacency,
    sem precisar filtrar campos extras.
  * Os metadados em _nodes são consultados apenas para exibição/análise.
"""

from __future__ import annotations

"""Estrutura de dados principal: Grafo não-direcionado baseado em Lista de Adjacência.

Este módulo foi refatorado para não usar `dataclasses` nem anotações do
`typing` no núcleo, mantendo a API pública compatível.
"""


# ---------------------------------------------------------------------------
# Tipos de dados
# ---------------------------------------------------------------------------

class NodeData:
    """Metadados associados a um nó (aeroporto).

    Implementado como classe simples (substitui dataclass) para obedecer
    às restrições da disciplina. Preserva atributos públicos `iata`,
    `cidade` e `regiao`.
    """
    def __init__(self, iata, cidade, regiao):
        self.iata = iata
        self.cidade = cidade
        self.regiao = regiao

    def __repr__(self):
        return f"NodeData(iata={self.iata!r}, cidade={self.cidade!r}, regiao={self.regiao!r})"


class EdgeData:
    """Representa uma aresta na lista de adjacência.

    Implementado como classe simples com atributos públicos para garantir
    compatibilidade com o restante do código e testes que constroem
    `EdgeData(...)` diretamente.
    """
    def __init__(self, destino, peso, tipo_conexao, justificativa):
        self.destino = destino
        self.peso = peso
        self.tipo_conexao = tipo_conexao
        self.justificativa = justificativa

    def __repr__(self):
        try:
            peso_fmt = f"{self.peso:.2f}"
        except Exception:
            peso_fmt = str(self.peso)
        return f"Edge(→{self.destino}, peso={peso_fmt}, tipo='{self.tipo_conexao}')"


# ---------------------------------------------------------------------------
# Classe principal
# ---------------------------------------------------------------------------

class Graph:
    """Grafo não-direcionado com pesos, implementado via Lista de Adjacência.

    Implementação sem `dataclasses` nem anotações `typing` no núcleo, para
    obedecer às restrições disciplinares. As estruturas internas são:
      - `_adjacency`: dict simples mapeando código do nó para lista de `EdgeData`.
      - `_nodes`: dict mapeando código do nó para `NodeData`.
    """

    def __init__(self):
        self._adjacency = {}
        self._nodes = {}

    # ------------------------------------------------------------------
    # Nós
    # ------------------------------------------------------------------

    def add_node(self, iata, cidade, regiao):
        """
        Adiciona um nó ao grafo. Se o código IATA já existir, não faz nada
        (comportamento idempotente — seguro para chamadas duplicadas).

        Parâmetros
        ----------
        iata   : Código IATA do aeroporto (identificador único).
        cidade : Nome da cidade onde o aeroporto está localizado.
        regiao : Região geográfica do Brasil (Norte, Nordeste, etc.).
        """
        if iata in self._nodes:
            return  # nó já presente — idempotente
        self._nodes[iata] = NodeData(iata, cidade, regiao)
        self._adjacency[iata] = []   # lista de vizinhos começa vazia

    def get_node(self, iata):
        """Retorna os metadados de um nó ou None se não existir."""
        return self._nodes.get(iata)

    def has_node(self, iata):
        """Verifica se um nó está presente no grafo."""
        return iata in self._nodes

    # ------------------------------------------------------------------
    # Arestas
    # ------------------------------------------------------------------

    def add_edge(self, origem, destino, peso, tipo_conexao, justificativa, allow_negative=False):
        """
        Adiciona uma aresta não-direcionada entre origem e destino.
        Ambos os nós devem existir previamente; caso contrário,
        levanta KeyError com mensagem descritiva.

        O grafo é não-direcionado: a aresta é espelhada automaticamente
        (origem→destino e destino→origem).

        Parâmetros
        ----------
        origem        : Código IATA do nó de partida.
        destino       : Código IATA do nó de chegada.
        peso          : Custo/peso da aresta (≥ 0 recomendado na Parte 1).
        tipo_conexao  : Categoria da conexão (ex.: "regional", "hub").
        justificativa : Razão textual da conexão (obrigatória pelo enunciado).

        Raises
        ------
        KeyError  : Se origem ou destino não existirem no grafo.
        ValueError: Se o peso for negativo (Parte 1 — Dijkstra).
        """
        for no in (origem, destino):
            if not self.has_node(no):
                raise KeyError(
                    f"Nó '{no}' não encontrado. "
                    "Adicione o nó antes de criar arestas."
                )

        if peso < 0 and not allow_negative:
            raise ValueError(
                f"Peso negativo ({peso}) não permitido sem 'allow_negative=True'."
            )

        # Aresta origem → destino
        self._adjacency[origem].append(
            EdgeData(destino, peso, tipo_conexao, justificativa)
        )

        # Espelho: destino → origem (grafo não-direcionado)
        self._adjacency[destino].append(
            EdgeData(origem, peso, tipo_conexao, justificativa)
        )

    def add_directed_edge(self, origem, destino, peso, tipo_conexao, justificativa, allow_negative=False):
        """Adiciona uma aresta dirigida (origem -> destino) sem espelhar.

        Permite pesos negativos apenas se `allow_negative=True`.
        """
        for no in (origem, destino):
            if not self.has_node(no):
                raise KeyError(
                    f"Nó '{no}' não encontrado. Adicione o nó antes de criar arestas."
                )

        if peso < 0 and not allow_negative:
            raise ValueError(
                f"Peso negativo ({peso}) não permitido sem 'allow_negative=True'."
            )

        self._adjacency[origem].append(EdgeData(destino, peso, tipo_conexao, justificativa))

    def get_neighbors(self, iata):
        """Retorna a lista de vizinhos (EdgeData) de um nó. Lança KeyError se o nó não existir."""
        if not self.has_node(iata):
            raise KeyError(f"Nó '{iata}' não encontrado no grafo.")
        return self._adjacency[iata]

    def has_edge(self, origem, destino):
        """Verifica se existe aresta entre origem e destino."""
        if not self.has_node(origem):
            return False
        return any(e.destino == destino for e in self._adjacency[origem])

    # ------------------------------------------------------------------
    # Propriedades e iteradores
    # ------------------------------------------------------------------

    @property
    def nodes(self):
        """Dicionário somente-leitura dos metadados de todos os nós."""
        return self._nodes

    @property
    def adjacency(self):
        """Lista de adjacência completa (usada pelos algoritmos)."""
        return self._adjacency

    def iter_nodes(self):
        """Itera sobre os códigos IATA de todos os nós."""
        return iter(self._nodes)

    def iter_edges(self):
        """
        Itera sobre todas as arestas do grafo (sem duplicatas).
        Retorna tuplas (origem, EdgeData).

        Como o grafo é não-direcionado, cada par (u, v) aparece duas vezes
        em _adjacency. Este método garante que cada aresta seja emitida
        apenas uma vez usando a convenção: emite (u, v) somente se u < v.
        """
        for origem, vizinhos in self._adjacency.items():
            for edge in vizinhos:
                if origem < edge.destino:  # evita duplicatas
                    yield origem, edge

    # ------------------------------------------------------------------
    # Métricas básicas
    # ------------------------------------------------------------------

    def order(self):
        """Ordem do grafo: |V| (número de nós)."""
        return len(self._nodes)

    def size(self):
        """Tamanho do grafo: |E| (número de arestas sem duplicatas)."""
        return sum(1 for _ in self.iter_edges())

    def density(self):
        """
        Densidade do grafo não-direcionado:
            d = 2|E| / (|V| * (|V| - 1))
        Retorna 0.0 se |V| < 2.
        """
        v = self.order()
        if v < 2:
            return 0.0
        return (2 * self.size()) / (v * (v - 1))

    def degree(self, iata):
        """Grau de um nó: número de vizinhos diretos."""
        return len(self.get_neighbors(iata))
    
    # Método para percorrer todos os nós e analisar os seus graus
    # Retorna uma lista de tuplas (no, grau)
    def all_degrees(self):
        lista = []
        for i in self.adjacency:
            lista.append((i, self.degree(i)))
        return lista
    
    def criar_ego_subgrafo(self, iata):
        subgrafo = Graph()
        vizinhos = self.get_neighbors(iata)
        vizinhos_iata = [edge.destino for edge in vizinhos]

        ego_node = self.get_node(iata)
        subgrafo.add_node(ego_node.iata, ego_node.cidade, ego_node.regiao)
        
        for i in vizinhos_iata:
            subgrafo.add_node(i, self.get_node(i).cidade, self.get_node(i).regiao)
        
        nos_subgrafo = [iata] + vizinhos_iata

        for i in nos_subgrafo:
            for j in nos_subgrafo:
                if i < j and self.has_edge(i,j):
                    edge = next(edge for edge in self.get_neighbors(i) if edge.destino == j)
                    subgrafo.add_edge(i, j, edge.peso, edge.tipo_conexao, edge.justificativa)
        
        return subgrafo


    # ------------------------------------------------------------------
    # Representação textual
    # ------------------------------------------------------------------

    def __len__(self):
        return self.order()

    def __contains__(self, iata):
        return isinstance(iata, str) and self.has_node(iata)

    def __repr__(self):
        return (
            f"Graph("
            f"nós={self.order()}, "
            f"arestas={self.size()}, "
            f"densidade={self.density():.4f})"
        )