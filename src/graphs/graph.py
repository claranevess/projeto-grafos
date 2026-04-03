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

from dataclasses import dataclass, field
from typing import Iterator, Optional


# ---------------------------------------------------------------------------
# Tipos de dados
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class NodeData:
    """
    Metadados associados a um nó (aeroporto).
    frozen=True garante imutabilidade após inserção.
    """
    iata: str       # Código IATA  — chave primária (ex.: "REC")
    cidade: str     # Nome da cidade (ex.: "Recife")
    regiao: str     # Região geográfica (ex.: "Nordeste")


@dataclass
class EdgeData:
    """
    Representa uma aresta na lista de adjacência.
    Armazena o destino e todos os atributos da conexão.
    """
    destino: str            # Código IATA do nó de destino
    peso: float             # Peso da aresta (≥ 0 na Parte 1)
    tipo_conexao: str       # Ex.: "regional", "hub", "inter-regional"
    justificativa: str      # Descrição da razão da conexão

    def __repr__(self) -> str:
        return (
            f"Edge(→{self.destino}, peso={self.peso:.2f}, "
            f"tipo='{self.tipo_conexao}')"
        )


# ---------------------------------------------------------------------------
# Classe principal
# ---------------------------------------------------------------------------

class Graph:
    """
    Grafo não-direcionado com pesos, implementado via Lista de Adjacência.

    Atributos internos
    ------------------
    _adjacency : dict[str, list[EdgeData]]
        Lista de adjacência. Chave = código IATA do nó origem;
        valor = lista de EdgeData representando cada vizinho.

    _nodes : dict[str, NodeData]
        Índice de metadados dos nós. Separado de _adjacency para
        não interferir na lógica dos algoritmos de busca.

    Exemplo de estado interno após adicionar REC e GRU com aresta entre eles:

        _nodes = {
            "REC": NodeData(iata="REC", cidade="Recife",    regiao="Nordeste"),
            "GRU": NodeData(iata="GRU", cidade="São Paulo", regiao="Sudeste"),
        }

        _adjacency = {
            "REC": [EdgeData(destino="GRU", peso=2.0, ...)],
            "GRU": [EdgeData(destino="REC", peso=2.0, ...)],
        }
    """

    def __init__(self) -> None:
        self._adjacency: dict[str, list[EdgeData]] = {}
        self._nodes: dict[str, NodeData] = {}

    # ------------------------------------------------------------------
    # Nós
    # ------------------------------------------------------------------

    def add_node(self, iata: str, cidade: str, regiao: str) -> None:
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

        self._nodes[iata] = NodeData(iata=iata, cidade=cidade, regiao=regiao)
        self._adjacency[iata] = []   # lista de vizinhos começa vazia

    def get_node(self, iata: str) -> Optional[NodeData]:
        """Retorna os metadados de um nó ou None se não existir."""
        return self._nodes.get(iata)

    def has_node(self, iata: str) -> bool:
        """Verifica se um nó está presente no grafo."""
        return iata in self._nodes

    # ------------------------------------------------------------------
    # Arestas
    # ------------------------------------------------------------------

    def add_edge(
        self,
        origem: str,
        destino: str,
        peso: float,
        tipo_conexao: str,
        justificativa: str,
    ) -> None:
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

        if peso < 0:
            raise ValueError(
                f"Peso negativo ({peso}) não permitido na Parte 1. "
                "Use Bellman-Ford na Parte 2 para pesos negativos."
            )

        # Aresta origem → destino
        self._adjacency[origem].append(
            EdgeData(
                destino=destino,
                peso=peso,
                tipo_conexao=tipo_conexao,
                justificativa=justificativa,
            )
        )

        # Espelho: destino → origem (grafo não-direcionado)
        self._adjacency[destino].append(
            EdgeData(
                destino=origem,
                peso=peso,
                tipo_conexao=tipo_conexao,
                justificativa=justificativa,
            )
        )

    def get_neighbors(self, iata: str) -> list[EdgeData]:
        """
        Retorna a lista de vizinhos (EdgeData) de um nó.
        Lançará KeyError se o nó não existir.
        """
        if not self.has_node(iata):
            raise KeyError(f"Nó '{iata}' não encontrado no grafo.")
        return self._adjacency[iata]

    def has_edge(self, origem: str, destino: str) -> bool:
        """Verifica se existe aresta entre origem e destino."""
        if not self.has_node(origem):
            return False
        return any(e.destino == destino for e in self._adjacency[origem])

    # ------------------------------------------------------------------
    # Propriedades e iteradores
    # ------------------------------------------------------------------

    @property
    def nodes(self) -> dict[str, NodeData]:
        """Dicionário somente-leitura dos metadados de todos os nós."""
        return self._nodes

    @property
    def adjacency(self) -> dict[str, list[EdgeData]]:
        """Lista de adjacência completa (usada pelos algoritmos)."""
        return self._adjacency

    def iter_nodes(self) -> Iterator[str]:
        """Itera sobre os códigos IATA de todos os nós."""
        return iter(self._nodes)

    def iter_edges(self) -> Iterator[tuple[str, EdgeData]]:
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

    def order(self) -> int:
        """Ordem do grafo: |V| (número de nós)."""
        return len(self._nodes)

    def size(self) -> int:
        """Tamanho do grafo: |E| (número de arestas sem duplicatas)."""
        return sum(1 for _ in self.iter_edges())

    def density(self) -> float:
        """
        Densidade do grafo não-direcionado:
            d = 2|E| / (|V| * (|V| - 1))
        Retorna 0.0 se |V| < 2.
        """
        v = self.order()
        if v < 2:
            return 0.0
        return (2 * self.size()) / (v * (v - 1))

    def degree(self, iata: str) -> int:
        """Grau de um nó: número de vizinhos diretos."""
        return len(self.get_neighbors(iata))

    # ------------------------------------------------------------------
    # Representação textual
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return self.order()

    def __contains__(self, iata: object) -> bool:
        return isinstance(iata, str) and self.has_node(iata)

    def __repr__(self) -> str:
        return (
            f"Graph("
            f"nós={self.order()}, "
            f"arestas={self.size()}, "
            f"densidade={self.density():.4f})"
        )