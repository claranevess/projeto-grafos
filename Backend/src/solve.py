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

import csv
import json
import logging
from pathlib import Path
import csv
import time

from .graphs.io import (
    salvar_csv_graus,
    carregar_grafo,
    salvar_ego_aeroporto_csv,
    grau_ego_aeroporto,
    densidade_ego_aeroporto,
    salvar_report_parte_2
)
from src.viz import render_global, render_regioes
from src.graphs.io import carregar_dataset_parte2
from src.graphs.algorithms import bfs, dfs

logger = logging.getLogger(__name__)

# Ordem canônica das regiões nos arquivos de saída
REGIOES = ["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"]


# ---------------------------------------------------------------------------
# Funções internas
# ---------------------------------------------------------------------------

def _densidade(v, e):
    """Densidade de grafo não-direcionado: 2|E| / (|V| * (|V| - 1))."""
    if v < 2:
        return 0.0
    return (2 * e) / (v * (v - 1))


# ---------------------------------------------------------------------------
# Métricas globais
# ---------------------------------------------------------------------------

def metricas_globais(graph):
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

def metricas_regionais(graph):
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
    resultados = []

    for regiao in REGIOES:
        # Conjunto de nós que pertencem à região
        nos_regiao = {
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

def calcular_metricas(graph):
    """
    Calcula e retorna métricas globais e regionais.

    Retorna
    -------
    (global_dict, lista_regional)
        global_dict   : {'ordem': int, 'tamanho': int, 'densidade': float}
        lista_regional: lista de dicts por região, mesmas chaves + 'regiao'
    """
    return metricas_globais(graph), metricas_regionais(graph)


def salvar_metricas(graph, out_dir):
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

    # Renderizar PNGs finais em vez de gravar JSONs
    try:
        render_global(global_m, out_dir / "global.png")
        logger.info("Salvo: %s", out_dir / "global.png")
    except Exception:
        logger.exception("Falha ao renderizar global PNG em %s", out_dir)

    try:
        render_regioes(regional_m, out_dir / "regioes.png")
        logger.info("Salvo: %s", out_dir / "regioes.png")
    except Exception:
        logger.exception("Falha ao renderizar regioes PNG em %s", out_dir)

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

    lista = graph.all_degrees()
    salvar_csv_graus(lista, out_dir)
    gerar_analise_ego_network(graph, out_dir)


def gerar_analise_ego_network(graph, out_dir):
    """Gera análise de ego network usando o grafo já carregado.

    Anteriormente esta função carregava o CSV internamente; agora aceita
    o `Graph` para evitar hardcode de datasets.
    """
    grafo_principal = graph

    resultado_ego = []

    for iata in grafo_principal.iter_nodes():
        subgrafo = grafo_principal.criar_ego_subgrafo(iata)
        aeroporto = grafo_principal.get_node(iata)
        grau = grafo_principal.degree(iata)
        ordem_ego = subgrafo.order()
        tamanho_ego = subgrafo.size()
        densidade_ego = subgrafo.density()

        resultado_ego.append({
            "aeroporto": iata,
            "grau": grau,
            "ordem_ego": ordem_ego,
            "tamanho_ego": tamanho_ego,
            "densidade_ego": densidade_ego,
        })

    salvar_ego_aeroporto_csv(resultado_ego, out_dir)

    if resultado_ego:
        # recebe a lista resultado_ego e analisa qual o aeroporto com maior grau
        maior_grau = max(resultado_ego, key=lambda x: x["grau"])
        print(
            f"[solve] Aeroporto com maior grau: {maior_grau['aeroporto']} | Grau = {maior_grau['grau']}"
        )

        # recebe a lista resultado_ego e analisa qual o aeroporto com maior densidade
        maior_densidade = max(resultado_ego, key=lambda x: x["densidade_ego"])
        print(
            f"[solve] Aeroporto com maior densidade: {maior_densidade['aeroporto']} | Densidade = {maior_densidade['densidade_ego']}"
        )


def compute_routes(
        airports_csv="data/aeroportos_data.csv",
        routes_csv="data/rotas.csv",
        out_dir="out",
        out_csv_name="distancias_rotas.csv",
):
    """
    Carrega o grafo, calcula rotas especificadas em `routes_csv` usando Dijkstra
    e persiste o CSV `out/distancias_rotas.csv`.

    Retorna o DataFrame gravado para facilitar testes.
    """
    from .graphs.algorithms import dijkstra

    airports_csv = Path(airports_csv)
    routes_csv = Path(routes_csv)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Carrega grafo completo (nós + arestas)
    graph = carregar_grafo(airports_csv)

    # Lê rotas
    if not routes_csv.exists():
        raise FileNotFoundError(f"Rotas não encontrado: {routes_csv}")

    resultados = []

    # Ler CSV de rotas via csv.DictReader para evitar pandas no núcleo
    with routes_csv.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError("Arquivo de rotas está vazio ou sem header.")
        headers = [h.strip().lower() for h in reader.fieldnames if h]
        if "origin" not in headers or "destination" not in headers:
            raise ValueError("Arquivo de rotas deve conter header: origin,destination")

        for row in reader:
            origem = str(row.get("origin", "")).strip().upper()
            destino = str(row.get("destination", "")).strip().upper()

            if not graph.has_node(origem):
                resultados.append({"origin": origem, "destination": destino, "custo": "", "caminho": ""})
                continue

            if not graph.has_node(destino):
                resultados.append({"origin": origem, "destination": destino, "custo": "", "caminho": ""})
                continue

            try:
                custo, caminho = dijkstra(graph, origem, destino)
            except Exception as exc:
                logging.getLogger(__name__).error(
                    "Erro ao calcular Dijkstra para %s→%s: %s", origem, destino, exc
                )
                resultados.append({"origin": origem, "destination": destino, "custo": "", "caminho": ""})
                continue

            if custo == float("inf"):
                resultados.append({"origin": origem, "destination": destino, "custo": "", "caminho": ""})
            else:
                resultados.append({
                    "origin": origem,
                    "destination": destino,
                    "custo": f"{custo:.2f}",
                    "caminho": ";".join(caminho),
                })

    # Persistir resultados como JSON (não gerar CSV em out/)
    out_path = Path(out_dir) / Path(out_csv_name).with_suffix('.json').name
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    logging.getLogger(__name__).info("Gravado: %s", out_path)
    return resultados

def calcular_tempo_execucao():
    grafo = carregar_dataset_parte2("data/dataset_parte2")

    lista_nos = ["FILM_ANT-MAN", "FILM_CAPTAIN-AMERICA", "FILM_IRON-MAN"]

    bfs_dfs = {"bfs": {}, "dfs" : {}}

    for no_origem in lista_nos:

        start = time.perf_counter()
        distancia_bfs, pais_bfs, ordem_bfs = bfs(grafo, no_origem)
        end = time.perf_counter()
        tempo_total_bfs = end - start
        bfs_dfs["bfs"][no_origem] = {"node": no_origem, "time": tempo_total_bfs}
        
        start = time.perf_counter()
        ordem_dfs, ciclo_dfs, classificacao_arestas_dfs = dfs(grafo, no_origem)
        end = time.perf_counter()
        tempo_total_dfs = end - start
        bfs_dfs["dfs"][no_origem] = {"node": no_origem, "time": tempo_total_dfs}

        salvar_report_parte_2(bfs_dfs)

        return distancia_bfs, pais_bfs, ordem_bfs, ordem_dfs, ciclo_dfs, classificacao_arestas_dfs
       