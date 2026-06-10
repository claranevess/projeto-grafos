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
import time

from .graphs.io import (
    carregar_grafo,
    grau_ego_aeroporto,
    densidade_ego_aeroporto,
    salvar_report_parte_2,
    carregar_dataset_parte2, 
    carregar_cenario_bellman_ford
)

from .graphs.algorithms import bfs, dfs, dijkstra, bellman_ford

logger = logging.getLogger(__name__)

# Ordem canônica das regiões nos arquivos de saída
REGIOES = ["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"]

# Caminho absoluto para o dataset da Parte 2 — resolvido a partir deste
# arquivo (não do cwd), pois `calcular_tempo_execucao` é chamado tanto a
# partir da raiz do projeto (`python -m Backend.src.cli ...`) quanto de
# dentro de `Backend/`, e o caminho relativo "data/dataset_parte2" só
# existe relativo a `Backend/`.
DATASET_PARTE2_DIR = Path(__file__).resolve().parent.parent / "data" / "dataset_parte2"


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
    Persiste out/global.json, out/regioes.json e gera os CSVs para graus e ego networks.

    Parâmetros
    ----------
    graph   : Grafo completo já carregado.
    out_dir : Diretório de saída (criado automaticamente se não existir).
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    global_m, regional_m = calcular_metricas(graph)

    # Gravar JSONs finais
    try:
        with open(out_dir / "global.json", "w", encoding="utf-8") as f:
            json.dump(global_m, f, ensure_ascii=False, indent=2)
        logger.info("Salvo: %s", out_dir / "global.json")
    except Exception:
        logger.exception("Falha ao salvar global.json em %s", out_dir)

    try:
        with open(out_dir / "regioes.json", "w", encoding="utf-8") as f:
            json.dump(regional_m, f, ensure_ascii=False, indent=2)
        logger.info("Salvo: %s", out_dir / "regioes.json")
    except Exception:
        logger.exception("Falha ao salvar regioes.json em %s", out_dir)

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

    # Gravar CSV de Graus Manualmente
    lista = graph.all_degrees()
    caminho_graus = out_dir / "graus.csv"
    try:
        with open(caminho_graus, mode="w", newline="", encoding="utf-8") as f:
            if lista:
                writer = csv.DictWriter(f, fieldnames=["node", "degree"])
                writer.writeheader()
                for item in lista:
                    # Garantindo compatibilidade se a lista retornar tuplas em vez de dicionários
                    if isinstance(item, tuple) or isinstance(item, list):
                        writer.writerow({"node": item[0], "degree": item[1]})
                    else:
                        writer.writerow(item)
        logger.info("Salvo: %s", caminho_graus)
    except Exception:
        logger.exception("Falha ao salvar graus.csv em %s", out_dir)

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

    # Gravar CSV do Ego Network Manualmente
    caminho_ego = Path(out_dir) / "ego_aeroportos.csv"
    try:
        with open(caminho_ego, mode="w", newline="", encoding="utf-8") as f:
            if resultado_ego:
                fieldnames = ["aeroporto", "grau", "ordem_ego", "tamanho_ego", "densidade_ego"]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(resultado_ego)
        logger.info("Salvo: %s", caminho_ego)
    except Exception:
        logger.exception("Falha ao salvar ego_aeroportos.csv em %s", out_dir)

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

def calcular_tempo_execucao(dataset_dir=DATASET_PARTE2_DIR):
    """
    Roda BFS, DFS, Dijkstra e Bellman-Ford sobre o dataset da Parte 2,
    medindo tempo de execução e registrando corretude (camadas/ciclos/
    caminhos/detecção de ciclo negativo). Persiste o relatório completo em
    `out/parte2_report.json`.

    Cobertura exigida pelo enunciado da Parte 2:
      - BFS/DFS a partir de >= 3 fontes distintas (ordem, camadas, ciclos).
      - Dijkstra com pesos >= 0 para >= 5 pares origem-destino.
      - Bellman-Ford em dois cenários: peso negativo sem ciclo (distâncias
        corretas) e ciclo negativo (detectado e sinalizado).
    """
    grafo = carregar_dataset_parte2(dataset_dir)

    fontes = ["FILM_ANT-MAN", "FILM_CAPTAIN-AMERICA", "FILM_IRON-MAN"]

    pares_dijkstra = [
        ("FILM_IRON-MAN", "FILM_IRON-MAN-3"),
        ("FILM_THE-AVENGERS", "FILM_AVENGERS-END-GAME"),
        ("FILM_BLACK-WIDOW", "FILM_SHANG-CHI"),
        ("FILM_THOR", "FILM_THOR-RAGNAROK"),
        ("FILM_CAPTAIN-AMERICA", "FILM_CAPTAIN-AMERICA-WINTER-SOLDIER"),
    ]

    resultados = {"bfs": {}, "dfs": {}, "dijkstra": {}, "bellman_ford": {}}

    # --- BFS / DFS a partir de >= 3 fontes distintas -------------------------
    for no_origem in fontes:
        start = time.perf_counter()
        distancia_bfs, _pais_bfs, ordem_bfs = bfs(grafo, no_origem)
        tempo_bfs = time.perf_counter() - start

        camadas = {}
        for no, dist in distancia_bfs.items():
            if dist != float("inf"):
                camadas.setdefault(int(dist), []).append(no)

        resultados["bfs"][no_origem] = {
            "node": no_origem,
            "time": tempo_bfs,
            "nos_alcancados": len(ordem_bfs),
            "camadas": {str(nivel): nos for nivel, nos in sorted(camadas.items())},
        }

        start = time.perf_counter()
        ordem_dfs, ciclo_dfs, classificacao_arestas_dfs = dfs(grafo, no_origem)
        tempo_dfs = time.perf_counter() - start

        resultados["dfs"][no_origem] = {
            "node": no_origem,
            "time": tempo_dfs,
            "nos_visitados": len(ordem_dfs),
            "tem_ciclo": ciclo_dfs,
            "arestas_classificadas": dict(
                (f"{a}-{b}", tipo) for (a, b), tipo in classificacao_arestas_dfs.items()
            ),
        }

    # --- Dijkstra para >= 5 pares origem-destino (pesos >= 0) ----------------
    for origem, destino in pares_dijkstra:
        start = time.perf_counter()
        custo, caminho = dijkstra(grafo, origem, destino)
        tempo_dijkstra = time.perf_counter() - start

        resultados["dijkstra"][f"{origem}->{destino}"] = {
            "origem": origem,
            "destino": destino,
            "time": tempo_dijkstra,
            "custo": custo if custo != float("inf") else None,
            "caminho": caminho,
        }

    # --- Bellman-Ford: cenário com peso negativo (sem ciclo negativo) --------
    grafo_peso_negativo = carregar_cenario_bellman_ford(dataset_dir, "negative_edges.csv")
    fonte_bf1 = "FILM_IRON-MAN"
    start = time.perf_counter()
    distancias_bf1, _pais_bf1, ciclo_bf1 = bellman_ford(grafo_peso_negativo, fonte_bf1)
    tempo_bf1 = time.perf_counter() - start

    resultados["bellman_ford"]["peso_negativo_sem_ciclo"] = {
        "fonte": fonte_bf1,
        "time": tempo_bf1,
        "tem_ciclo_negativo": ciclo_bf1,
        "distancias": {
            no: (dist if dist != float("inf") else None)
            for no, dist in distancias_bf1.items()
            if dist != float("inf")
        },
    }

    # --- Bellman-Ford: cenário com ciclo negativo -----------------------------
    grafo_ciclo_negativo = carregar_cenario_bellman_ford(dataset_dir, "negative_cycle.csv")
    fonte_bf2 = "FILM_THE-AVENGERS"
    start = time.perf_counter()
    _distancias_bf2, _pais_bf2, ciclo_bf2 = bellman_ford(grafo_ciclo_negativo, fonte_bf2)
    tempo_bf2 = time.perf_counter() - start

    resultados["bellman_ford"]["ciclo_negativo"] = {
        "fonte": fonte_bf2,
        "time": tempo_bf2,
        "tem_ciclo_negativo": ciclo_bf2,
    }

    salvar_report_parte_2(resultados)

    return resultados

if __name__ == "__main__":
    # Configuração básica de log para exibir as mensagens no console
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    
    # Resolve os caminhos relativos ao arquivo solve.py
    camino_base = Path(__file__).resolve().parent.parent # Sobe para a pasta Backend/
    dataset_csv = camino_base / "data" / "aeroportos_data.csv"
    saida_dir = camino_base.parent / "out" # Cria a pasta out na raiz do projeto
    
    print(f"Iniciando processamento direto...")
    # Carrega o grafo usando a função importada
    grafo_aeroportos = carregar_grafo(dataset_csv)
    
    # Executa a persistência dos arquivos solicitados
    salvar_metricas(grafo_aeroportos, saida_dir)