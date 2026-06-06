"""
analytics_interactive.py
Gera visualizações interativas com Plotly para filtros dinâmicos.

Ponto de entrada:
    python -m src.analytics_interactive --out ./out/
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
import sys

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Adiciona o diretório Backend ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.graphs.io import carregar_grafo

logger = logging.getLogger(__name__)

CORES_REGIAO: dict[str, str] = {
    "Norte": "#2196F3",
    "Nordeste": "#FF9800",
    "Sudeste": "#E91E63",
    "Sul": "#4CAF50",
    "Centro-Oeste": "#9C27B0",
}


def gerar_histograma_interativo(graus_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """Histograma interativo de distribuição de graus com filtro por região."""
    regioes = [graph.get_node(iata).regiao for iata in graus_df["IATA"]]
    graus_df_extended = graus_df.copy()
    graus_df_extended["regiao"] = regioes

    fig = go.Figure()

    # Adiciona trace para cada região
    for regiao in sorted(CORES_REGIAO.keys()):
        df_regiao = graus_df_extended[graus_df_extended["regiao"] == regiao]
        fig.add_trace(go.Histogram(
            x=df_regiao["Grau"],
            name=regiao,
            marker_color=CORES_REGIAO[regiao],
            opacity=0.7,
            nbinsx=15,
        ))

    fig.update_layout(
        title="Distribuição de Graus dos Aeroportos",
        xaxis_title="Grau (número de conexões)",
        yaxis_title="Frequência",
        barmode="overlay",
        template="plotly_dark",
        paper_bgcolor="#0d1b2a",
        plot_bgcolor="#1a2a3a",
        font=dict(color="#e2efff", family="Inter, sans-serif"),
        hovermode="x unified",
        height=500,
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    fig.write_html(out_dir / "viz_1_histograma_interativo.html")
    logger.info("Salvo: viz_1_histograma_interativo.html")


def gerar_scatter_interativo(ego_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """Scatter grau × densidade interativo com hover info e filtros."""
    regioes = [graph.get_node(iata).regiao for iata in ego_df["aeroporto"]]
    ego_df_extended = ego_df.copy()
    ego_df_extended["regiao"] = regioes

    fig = go.Figure()

    # Adiciona trace para cada região
    for regiao in sorted(CORES_REGIAO.keys()):
        df_regiao = ego_df_extended[ego_df_extended["regiao"] == regiao]
        fig.add_trace(go.Scatter(
            x=df_regiao["grau"],
            y=df_regiao["densidade_ego"],
            mode="markers",
            name=regiao,
            marker=dict(
                size=10,
                color=CORES_REGIAO[regiao],
                opacity=0.8,
                line=dict(width=1, color="white"),
            ),
            text=[f"<b>{iata}</b><br>Grau: {g}<br>Densidade: {d:.3f}"
                  for iata, g, d in zip(df_regiao["aeroporto"], df_regiao["grau"], df_regiao["densidade_ego"])],
            hovertemplate="%{text}<extra></extra>",
        ))

    fig.update_layout(
        title="Grau × Densidade da Ego-Rede por Aeroporto",
        xaxis_title="Grau (número de conexões diretas)",
        yaxis_title="Densidade da ego-rede",
        template="plotly_dark",
        paper_bgcolor="#0d1b2a",
        plot_bgcolor="#1a2a3a",
        font=dict(color="#e2efff", family="Inter, sans-serif"),
        hovermode="closest",
        height=500,
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    fig.write_html(out_dir / "viz_2_scatter_interativo.html")
    logger.info("Salvo: viz_2_scatter_interativo.html")


def gerar_ranking_interativo(graus_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """Ranking horizontal interativo com cores por região."""
    df = graus_df.copy()
    df["regiao"] = [graph.get_node(iata).regiao for iata in df["IATA"]]
    df = df.sort_values("Grau", ascending=True)

    fig = go.Figure()

    for regiao in sorted(CORES_REGIAO.keys()):
        df_regiao = df[df["regiao"] == regiao]
        fig.add_trace(go.Bar(
            y=df_regiao["IATA"],
            x=df_regiao["Grau"],
            name=regiao,
            marker_color=CORES_REGIAO[regiao],
            orientation="h",
            text=df_regiao["Grau"],
            textposition="outside",
            hovertemplate="<b>%{y}</b><br>Grau: %{x}<extra></extra>",
        ))

    media = df["Grau"].mean()
    fig.add_vline(x=media, line_dash="dash", line_color="#FF9800", 
                  annotation_text=f"Média: {media:.1f}", annotation_position="top right")

    fig.update_layout(
        title="Ranking de Aeroportos por Número de Conexões",
        xaxis_title="Grau",
        yaxis_title="",
        template="plotly_dark",
        paper_bgcolor="#0d1b2a",
        plot_bgcolor="#1a2a3a",
        font=dict(color="#e2efff", family="Inter, sans-serif"),
        barmode="group",
        height=600,
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    fig.write_html(out_dir / "viz_3_ranking_interativo.html")
    logger.info("Salvo: viz_3_ranking_interativo.html")


def gerar_comparacao_regioes_interativo(regioes_data: list[dict], out_dir: Path) -> None:
    """Comparação regional interativa com 3 subgráficos."""
    df = pd.DataFrame(regioes_data)

    fig = make_subplots(
        rows=1, cols=3,
        subplot_titles=("Ordem (nº de aeroportos)", "Tamanho (nº de arestas)", "Densidade intra-regional"),
        specs=[[{"type": "bar"}, {"type": "bar"}, {"type": "bar"}]],
    )

    cores_regioes = [CORES_REGIAO[r] for r in df["regiao"]]

    for col_idx, col_name in enumerate(["ordem", "tamanho", "densidade"], 1):
        fig.add_trace(
            go.Bar(
                x=df["regiao"],
                y=df[col_name],
                marker_color=cores_regioes,
                text=df[col_name].round(2),
                textposition="outside",
                hovertemplate="<b>%{x}</b><br>" + col_name.capitalize() + ": %{y}<extra></extra>",
                showlegend=False,
            ),
            row=1, col=col_idx,
        )

    fig.update_layout(
        title_text="Comparação de Métricas por Região Geográfica",
        template="plotly_dark",
        paper_bgcolor="#0d1b2a",
        plot_bgcolor="#1a2a3a",
        font=dict(color="#e2efff", family="Inter, sans-serif"),
        height=450,
        showlegend=False,
    )

    fig.update_xaxes(title_text="", row=1, col=1)
    fig.update_xaxes(title_text="", row=1, col=2)
    fig.update_xaxes(title_text="", row=1, col=3)

    out_dir.mkdir(parents=True, exist_ok=True)
    fig.write_html(out_dir / "viz_4_comparacao_interativo.html")
    logger.info("Salvo: viz_4_comparacao_interativo.html")


def gerar_todas_interativas(out_dir: str | Path = "out") -> None:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("[analytics_interactive] Carregando grafo...")
    graph = carregar_grafo("Backend/data/aeroportos_data.csv")

    graus_df = pd.read_csv(out_dir / "graus.csv")
    ego_df = pd.read_csv(out_dir / "ego_aeroportos.csv")

    with open(out_dir / "regioes.json", encoding="utf-8") as f:
        regioes_data = json.load(f)

    print("[analytics_interactive] Gerando histograma interativo...")
    gerar_histograma_interativo(graus_df, graph, out_dir)

    print("[analytics_interactive] Gerando scatter interativo...")
    gerar_scatter_interativo(ego_df, graph, out_dir)

    print("[analytics_interactive] Gerando ranking interativo...")
    gerar_ranking_interativo(graus_df, graph, out_dir)

    print("[analytics_interactive] Gerando comparação regional interativa...")
    gerar_comparacao_regioes_interativo(regioes_data, out_dir)

    print(f"[analytics_interactive] Concluido. Gráficos interativos em '{out_dir}/'")


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="src.analytics_interactive",
        description="Gera visualizações interativas com Plotly.",
    )
    parser.add_argument("--out", default="out", help="Diretório de saída (padrão: out/)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    gerar_todas_interativas(args.out)


if __name__ == "__main__":
    main()
