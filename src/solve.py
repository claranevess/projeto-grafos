"""
solve.py
Cálculo de métricas estruturais do grafo de aeroportos.

Métricas globais  : ordem |V|, tamanho |E|, densidade do grafo completo.
Métricas regionais: mesmas métricas para o subgrafo induzido de cada região.

Restrição crítica dos subgrafos induzidos
-----------------------------------------
Uma aresta é contabilizada no subgrafo de uma região somente se AMBOS os
endpoints (origem e destino) pertencem àquela região.  Arestas inter-regionais
são ignoradas no cálculo regional mesmo que um dos endpoints esteja na região.

Fórmula da densidade (grafo não-direcionado)
--------------------------------------------
    densidade = 2 * |E| / (|V| * (|V| - 1))
    densidade = 0  se |V| < 2
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from src.graphs.graph import Graph

logger = logging.getLogger(__name__)

# Ordem canônica das regiões nos arquivos de saída
REGIOES: list[str] = ["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"]


# ---------------------------------------------------------------------------
# Funções internas
# ---------------------------------------------------------------------------

def _densidade(v: int, e: int) -> float:
    """Densidade de grafo não-direcionado: 2|E| / (|V| * (|V| - 1))."""
    if v < 2:
        return 0.0
    return (2 * e) / (v * (v - 1))


# ---------------------------------------------------------------------------
# Métricas globais
# ---------------------------------------------------------------------------

def metricas_globais(graph: Graph) -> dict:
    """
    Calcula ordem, tamanho e densidade do grafo completo.

    Retorna
    -------
    dict com chaves: 'ordem', 'tamanho', 'densidade'.
    """
    v = graph.order()
    e = graph.size()
    return {
        "ordem": v,
        "tamanho": e,
        "densidade": _densidade(v, e),
    }


# ---------------------------------------------------------------------------
# Métricas regionais (subgrafo induzido)
# ---------------------------------------------------------------------------

def metricas_regionais(graph: Graph) -> list[dict]:
    """
    Calcula ordem, tamanho e densidade para o subgrafo induzido de cada região.

    Subgrafo induzido de uma região R:
      - Nós : todos os aeroportos cuja 'regiao' == R
      - Arestas: apenas as arestas em que AMBOS os endpoints pertencem a R

    Retorna
    -------
    Lista de dicts com chaves: 'regiao', 'ordem', 'tamanho', 'densidade'.
    A ordem das regiões segue a constante REGIOES.
    """
    resultados: list[dict] = []

    for regiao in REGIOES:
        # Conjunto de nós que pertencem à região
        nos_regiao: set[str] = {
            iata
            for iata, nd in graph.nodes.items()
            if nd.regiao == regiao
        }
        v = len(nos_regiao)

        # Conta arestas cujos dois endpoints estão na região
        # graph.iter_edges() já garante que cada aresta aparece uma única vez
        e = sum(
            1
            for origem, edge in graph.iter_edges()
            if origem in nos_regiao and edge.destino in nos_regiao
        )

        resultados.append({
            "regiao": regiao,
            "ordem": v,
            "tamanho": e,
            "densidade": _densidade(v, e),
        })

    return resultados


# ---------------------------------------------------------------------------
# API pública principal
# ---------------------------------------------------------------------------

def calcular_metricas(graph: Graph) -> tuple[dict, list[dict]]:
    """
    Calcula e retorna métricas globais e regionais.

    Retorna
    -------
    (global_dict, lista_regional)
        global_dict   : {'ordem': int, 'tamanho': int, 'densidade': float}
        lista_regional: lista de dicts por região, mesmas chaves + 'regiao'
    """
    return metricas_globais(graph), metricas_regionais(graph)


def salvar_metricas(graph: Graph, out_dir: str | Path) -> None:
    """
    Persiste out/global.json e out/regioes.json no diretório indicado.

    Parâmetros
    ----------
    graph   : Grafo completo já carregado.
    out_dir : Diretório de saída (criado automaticamente se não existir).
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    global_m, regional_m = calcular_metricas(graph)

    global_path = out_dir / "global.json"
    with global_path.open("w", encoding="utf-8") as f:
        json.dump(global_m, f, indent=2, ensure_ascii=False)
    logger.info("Salvo: %s", global_path)

    regioes_path = out_dir / "regioes.json"
    with regioes_path.open("w", encoding="utf-8") as f:
        json.dump(regional_m, f, indent=2, ensure_ascii=False)
    logger.info("Salvo: %s", regioes_path)

    # Log de resumo para validação visual rápida no console
    g = global_m
    logger.info(
        "[global] ordem=%d  tamanho=%d  densidade=%.6f",
        g["ordem"], g["tamanho"], g["densidade"],
    )
    for r in regional_m:
        logger.info(
            "[%s] ordem=%d  tamanho=%d  densidade=%.6f",
            r["regiao"], r["ordem"], r["tamanho"], r["densidade"],
        )
