"""
analytics.py
Visualizações analíticas e grafo interativo para a Parte 1.

  — 4 visualizações adicionais (histograma, scatter, barras, radar)
  — Grafo interativo HTML (pyvis) com tooltip, busca e caminhos
  — 2 exploratórias + 2 explanatórias (AVD)

Ponto de entrada:
    python -m src.analytics --out ./out/
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D
import matplotlib.patheffects as pe
import numpy as np
import pandas as pd

from src.graphs.io import carregar_grafo
from src.graphs.algorithms import dijkstra

logger = logging.getLogger(__name__)

# Coordenadas geográficas aproximadas (lat, lon) dos aeroportos
COORDS: dict[str, tuple[float, float]] = {
    "MAO": (-3.04, -60.05),
    "BEL": (-1.38, -48.48),
    "PVH": (-8.71, -63.90),
    "RBR": (-9.87, -67.90),
    "REC": (-8.13, -34.92),
    "SSA": (-12.91, -38.32),
    "FOR": (-3.78, -38.53),
    "NAT": (-5.84, -35.25),
    "JPA": (-7.15, -34.95),
    "THE": (-5.06, -42.82),
    "GRU": (-23.43, -46.47),
    "CGH": (-23.63, -47.40),
    "GIG": (-22.81, -43.25),
    "CNF": (-19.63, -43.97),
    "VIX": (-20.26, -40.29),
    "BSB": (-15.87, -47.92),
    "GYN": (-16.63, -49.22),
    "CWB": (-25.53, -49.17),
    "FLN": (-27.67, -48.55),
    "POA": (-29.99, -51.17),
}

CORES_REGIAO: dict[str, str] = {
    "Norte": "#2196F3",
    "Nordeste": "#FF9800",
    "Sudeste": "#E91E63",
    "Sul": "#4CAF50",
    "Centro-Oeste": "#9C27B0",
}


# Helpers

def _lat_lon_to_svg(lat: float, lon: float,
                    lat_min: float = -33.8, lat_max: float = 5.3,
                    lon_min: float = -74.0, lon_max: float = -28.5,
                    w: float = 450, h: float = 460,
                    pad: float = 30) -> tuple[float, float]:
    """Projeta lat/lon para coordenadas SVG do mapa.html (450×460)."""
    x = pad + (lon - lon_min) / (lon_max - lon_min) * (w - 2 * pad)
    y = pad + (lat_max - lat) / (lat_max - lat_min) * (h - 2 * pad)
    return round(x, 1), round(y, 1)


def _salvar_fig(fig: plt.Figure, path: Path, dpi: int = 150) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=dpi, bbox_inches="tight")
    plt.close(fig)
    logger.info("Salvo: %s", path)


# VIZ 1 — EXPLORATÓRIA: Histograma de distribuição de graus

def viz_histograma_graus(graus_df: pd.DataFrame, out_dir: Path) -> None:
    """
    Visualização exploratória 1.
    Mostra como os graus se distribuem — identifica se há poucos hubs
    dominantes ou uma distribuição homogênea.
    """
    graus = graus_df["Grau"].values

    fig, ax = plt.subplots(figsize=(9, 5), facecolor="#f8f9fa")
    ax.set_facecolor("#f0f4f8")

    bins = range(int(graus.min()), int(graus.max()) + 2)
    n, bins_out, patches = ax.hist(graus, bins=bins, color="#2196F3",
                                   edgecolor="white", linewidth=0.8, rwidth=0.85)

    # Destaca o bin do maior grau (GRU=18)
    for patch, b in zip(patches, bins_out):
        if b >= 15:
            patch.set_facecolor("#E91E63")

    # Linha da média
    media = graus.mean()
    ax.axvline(media, color="#FF9800", linewidth=2, linestyle="--", label=f"Média = {media:.1f}")

    ax.set_title("Distribuição de Graus dos Aeroportos", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Grau (número de conexões)", fontsize=11)
    ax.set_ylabel("Frequência (nº de aeroportos)", fontsize=11)

    legend_handles = [
        mpatches.Patch(color="#2196F3", label="Aeroportos"),
        mpatches.Patch(color="#E91E63", label="Hubs nacionais (grau ≥ 15)"),
        Line2D([0], [0], color="#FF9800", linewidth=2, linestyle="--", label=f"Média = {media:.1f}"),
    ]
    ax.legend(handles=legend_handles, fontsize=9, framealpha=0.9)

    ax.grid(axis="y", alpha=0.4, linestyle=":")
    ax.set_axisbelow(True)

    _salvar_fig(fig, out_dir / "viz_1_histograma_graus.png")


# VIZ 2 — EXPLORATÓRIA: Scatter grau × densidade da ego-rede

def viz_scatter_grau_densidade(ego_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """
    Visualização exploratória 2.
    Relaciona o grau de cada aeroporto com a densidade da sua ego-rede,
    revelando se aeroportos muito conectados formam clusters densos ou esparsos.
    """
    regioes = [graph.get_node(iata).regiao for iata in ego_df["aeroporto"]]
    cores = [CORES_REGIAO[r] for r in regioes]

    fig, ax = plt.subplots(figsize=(10, 6), facecolor="#f8f9fa")
    ax.set_facecolor("#f0f4f8")

    scatter = ax.scatter(
        ego_df["grau"], ego_df["densidade_ego"],
        c=cores, s=120, edgecolors="white", linewidth=0.8, zorder=3, alpha=0.9
    )

    # Rótulos dos pontos extremos e hubs principais
    destaques = {"GRU", "BSB", "GIG", "MAO", "REC", "FOR", "CGH", "SSA"}
    for _, row in ego_df.iterrows():
        if row["aeroporto"] in destaques:
            ax.annotate(
                row["aeroporto"],
                (row["grau"], row["densidade_ego"]),
                textcoords="offset points", xytext=(6, 4),
                fontsize=8, fontweight="bold",
                path_effects=[pe.withStroke(linewidth=2, foreground="white")]
            )

    # Linha de tendência (regressão linear)
    z = np.polyfit(ego_df["grau"], ego_df["densidade_ego"], 1)
    p = np.poly1d(z)
    x_line = np.linspace(ego_df["grau"].min(), ego_df["grau"].max(), 100)
    ax.plot(x_line, p(x_line), "--", color="#607D8B", linewidth=1.5,
            alpha=0.7, label="Tendência linear")

    ax.set_title("Grau × Densidade da Ego-Rede por Aeroporto",
                 fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Grau (número de conexões diretas)", fontsize=11)
    ax.set_ylabel("Densidade da ego-rede", fontsize=11)

    legend_handles = [mpatches.Patch(color=c, label=r)
                      for r, c in CORES_REGIAO.items()]
    legend_handles.append(
        Line2D([0], [0], color="#607D8B", linestyle="--", linewidth=1.5, label="Tendência linear")
    )
    ax.legend(handles=legend_handles, fontsize=9, framealpha=0.9,
              loc="upper right")

    ax.set_ylim(0.35, 1.05)
    ax.grid(alpha=0.35, linestyle=":")
    ax.set_axisbelow(True)

    _salvar_fig(fig, out_dir / "viz_2_scatter_grau_densidade.png")


# VIZ 3 — EXPLANATÓRIA: Ranking dos aeroportos por grau (barras horizontais)

def viz_ranking_hubs(graus_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """
    Visualização explanatória 1.
    Ranking claro e ordenado dos aeroportos mais conectados, colorido por região.
    Mensagem: GRU, BSB e GIG dominam a conectividade nacional.
    """
    df = graus_df.copy()
    df["regiao"] = df["IATA"].apply(lambda x: graph.get_node(x).regiao)
    df["cidade"] = df["IATA"].apply(lambda x: graph.get_node(x).cidade)
    df = df.sort_values("Grau", ascending=True)

    fig, ax = plt.subplots(figsize=(10, 8), facecolor="#f8f9fa")
    ax.set_facecolor("#f0f4f8")

    bars = ax.barh(
        df["IATA"], df["Grau"],
        color=[CORES_REGIAO[r] for r in df["regiao"]],
        edgecolor="white", linewidth=0.5, height=0.75
    )

    # Valor no final de cada barra
    for bar, val in zip(bars, df["Grau"]):
        ax.text(bar.get_width() + 0.2, bar.get_y() + bar.get_height() / 2,
                str(int(val)), va="center", fontsize=9, fontweight="bold")

    # Linha de média
    media = df["Grau"].mean()
    ax.axvline(media, color="#607D8B", linestyle="--", linewidth=1.5,
               label=f"Média = {media:.1f}")

    ax.set_title("Ranking de Aeroportos por Número de Conexões",
                 fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Grau (número de conexões)", fontsize=11)
    ax.set_ylabel("")

    legend_handles = [mpatches.Patch(color=c, label=r)
                      for r, c in CORES_REGIAO.items()]
    legend_handles.append(
        Line2D([0], [0], color="#607D8B", linestyle="--", linewidth=1.5,
               label=f"Média = {media:.1f}")
    )
    ax.legend(handles=legend_handles, fontsize=9, framealpha=0.9,
              loc="lower right")

    ax.set_xlim(0, df["Grau"].max() + 2.5)
    ax.grid(axis="x", alpha=0.4, linestyle=":")
    ax.set_axisbelow(True)

    _salvar_fig(fig, out_dir / "viz_3_ranking_hubs.png")


# VIZ 4 — EXPLANATÓRIA: Comparação entre regiões (barras agrupadas)

def viz_comparacao_regioes(regioes_data: list[dict], out_dir: Path) -> None:
    """
    Visualização explanatória 2.
    Compara ordem, tamanho e densidade entre as 5 regiões do Brasil.
    Mensagem: Sul e Norte têm alta densidade interna; Sudeste concentra mais arestas.
    """
    df = pd.DataFrame(regioes_data)

    x = np.arange(len(df))
    width = 0.25

    fig, axes = plt.subplots(1, 3, figsize=(14, 6), facecolor="#f8f9fa")
    fig.suptitle("Comparação de Métricas por Região Geográfica",
                 fontsize=14, fontweight="bold", y=1.01)

    metricas = [
        ("ordem", "Ordem (nº de aeroportos)", "#2196F3"),
        ("tamanho", "Tamanho (nº de arestas)", "#FF9800"),
        ("densidade", "Densidade intra-regional", "#4CAF50"),
    ]

    cores_regioes = [CORES_REGIAO[r] for r in df["regiao"]]

    for ax, (col, titulo, _) in zip(axes, metricas):
        ax.set_facecolor("#f0f4f8")
        bars = ax.bar(df["regiao"], df[col],
                      color=cores_regioes, edgecolor="white", linewidth=0.5, width=0.65)

        # Valores acima das barras
        for bar, val in zip(bars, df[col]):
            label = f"{val:.2f}" if col == "densidade" else str(int(val))
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01 * df[col].max(),
                    label, ha="center", va="bottom", fontsize=9, fontweight="bold")

        ax.set_title(titulo, fontsize=11, fontweight="bold", pad=8)
        ax.set_ylabel(titulo, fontsize=9)
        ax.set_xticks(range(len(df)))
        ax.set_xticklabels(df["regiao"], rotation=25, ha="right", fontsize=9)
        ax.grid(axis="y", alpha=0.4, linestyle=":")
        ax.set_axisbelow(True)
        if col == "densidade":
            ax.set_ylim(0, 1.15)

    fig.tight_layout()
    _salvar_fig(fig, out_dir / "viz_4_comparacao_regioes.png")


# VIZ 5 — BÔNUS EXPLORATÓRIA: Mapa posicional do grafo com cores por região


def viz_mapa_grafo(ego_df: pd.DataFrame, graph, out_dir: Path) -> None:
    """
    Visualização exploratória bônus.
    Nós posicionados geograficamente por lat/lon; tamanho proporcional ao grau.
    Arestas coloridas pelo tipo de conexão.
    """
    fig, ax = plt.subplots(figsize=(10, 11), facecolor="#0d1b2a")
    ax.set_facecolor("#0d1b2a")

    # --- Arestas ---
    for origem, edge in graph.iter_edges():
        if origem not in COORDS or edge.destino not in COORDS:
            continue
        lat0, lon0 = COORDS[origem]
        lat1, lon1 = COORDS[edge.destino]
        if edge.tipo_conexao == "regional":
            color, alpha, lw = "#4FC3F7", 0.55, 0.8
        elif edge.tipo_conexao == "hub":
            color, alpha, lw = "#FFB300", 0.4, 0.6
        else:
            color, alpha, lw = "#CE93D8", 0.35, 0.6
        ax.plot([lon0, lon1], [lat0, lat1], color=color, alpha=alpha, linewidth=lw, zorder=1)

    # --- Nós ---
    ego_map = ego_df.set_index("aeroporto")
    for iata, (lat, lon) in COORDS.items():
        nd = graph.get_node(iata)
        if nd is None:
            continue
        grau = graph.degree(iata)
        cor = CORES_REGIAO[nd.regiao]
        tamanho = 40 + grau * 12

        ax.scatter(lon, lat, s=tamanho, color=cor, edgecolors="white",
                   linewidth=0.8, zorder=3, alpha=0.95)
        ax.text(lon, lat, iata, fontsize=7.5, ha="center", va="center",
                color="white", fontweight="bold", zorder=4,
                path_effects=[pe.withStroke(linewidth=2, foreground="black")])

    ax.set_title("Rede de Aeroportos do Brasil — Mapa Geográfico",
                 fontsize=13, fontweight="bold", color="white", pad=10)
    ax.set_xlabel("Longitude", fontsize=9, color="#90CAF9")
    ax.set_ylabel("Latitude", fontsize=9, color="#90CAF9")
    ax.tick_params(colors="#90CAF9")
    for spine in ax.spines.values():
        spine.set_edgecolor("#1a3050")

    legend_handles = [mpatches.Patch(color=c, label=r)
                      for r, c in CORES_REGIAO.items()]
    legend_handles += [
        Line2D([0], [0], color="#4FC3F7", linewidth=1.5, label="Regional"),
        Line2D([0], [0], color="#FFB300", linewidth=1.5, label="Hub"),
        Line2D([0], [0], color="#CE93D8", linewidth=1.5, label="Inter-regional"),
    ]
    ax.legend(handles=legend_handles, fontsize=8, framealpha=0.25,
              facecolor="#1a2a3a", labelcolor="white", loc="lower left")

    _salvar_fig(fig, out_dir / "viz_5_mapa_grafo.png")


# Seção 9 — Grafo interativo HTML (pyvis)


def render_grafo_interativo(
        ego_df: pd.DataFrame,
        graph,
        paths_obrigatorios: dict[str, list[str]],
        out_html: Path,
) -> None:
    """
    Gera out/grafo_interativo.html com:
    - Tooltip por aeroporto: grau, região, densidade_ego
    - Caixa de busca embutida
    - Destaque dos caminhos obrigatórios (REC→POA, MAO→GRU)
    """
    try:
        from pyvis.network import Network
    except ImportError:
        logger.error("pyvis não instalado. Execute: pip install pyvis")
        return

    ego_map = ego_df.set_index("aeroporto")

    # Arestas dos caminhos obrigatórios
    highlighted_edges: set[tuple[str, str]] = set()
    for path in paths_obrigatorios.values():
        for a, b in zip(path, path[1:]):
            highlighted_edges.add((min(a, b), max(a, b)))

    net = Network(
        height="750px", width="100%",
        bgcolor="#0d1b2a", font_color="#e2efff",
        directed=False,
    )
    net.set_options("""
    {
      "nodes": {
        "borderWidth": 2,
        "shadow": { "enabled": true, "size": 8 }
      },
      "edges": {
        "smooth": { "type": "curvedCW", "roundness": 0.1 }
      },
      "physics": {
        "enabled": true,
        "barnesHut": {
          "gravitationalConstant": -8000,
          "centralGravity": 0.3,
          "springLength": 130,
          "springConstant": 0.04
        }
      },
      "interaction": {
        "hover": true,
        "tooltipDelay": 100,
        "navigationButtons": true,
        "keyboard": { "enabled": true }
      }
    }
    """)

    # --- Nós ---
    for iata in graph.iter_nodes():
        nd = graph.get_node(iata)
        row = ego_map.loc[iata] if iata in ego_map.index else None
        grau = graph.degree(iata)
        densidade = f"{row['densidade_ego']:.3f}" if row is not None else "—"
        cor = CORES_REGIAO.get(nd.regiao, "#888888")

        title = (
            f"<b>{iata}</b> — {nd.cidade}<br>"
            f"Região: {nd.regiao}<br>"
            f"Grau: {grau}<br>"
            f"Densidade ego: {densidade}"
        )

        # Tamanho proporcional ao grau; hubs com anel branco
        size = 10 + grau * 1.8
        border = "#ffffff" if grau >= 12 else cor

        # Posição geográfica convertida para layout D3
        lat, lon = COORDS.get(iata, (-15.0, -50.0))
        # Normaliza para coordenada de tela (pyvis usa x horizontal, y vertical)
        x = (lon + 74) / (74 - 28.5) * 1000 - 500
        y = -((lat + 33.8) / (33.8 + 5.3) * 800 - 200)

        net.add_node(
            iata, label=iata, title=title,
            color={"background": cor, "border": border,
                   "highlight": {"background": "#FFB300", "border": "#fff"}},
            size=size, x=x, y=y,
            font={"size": 11, "color": "#ffffff", "bold": True},
        )

    # --- Arestas ---
    for origem, edge in graph.iter_edges():
        key = (min(origem, edge.destino), max(origem, edge.destino))
        is_hl = key in highlighted_edges

        if is_hl:
            color = "#FFB300"
            width = 4
            dashes = False
        elif edge.tipo_conexao == "regional":
            color = "#4FC3F7"
            width = 1.5
            dashes = False
        elif edge.tipo_conexao == "hub":
            color = "#7986CB"
            width = 1.2
            dashes = False
        else:
            color = "#CE93D8"
            width = 1.0
            dashes = True

        net.add_edge(
            origem, edge.destino,
            title=f"peso={edge.peso:.1f} | {edge.tipo_conexao}",
            color=color, width=width,
            dashes=dashes,
        )

    out_html.parent.mkdir(parents=True, exist_ok=True)

    # Gera HTML base via pyvis e depois injeta busca + legenda
    tmp_html = out_html.with_stem(out_html.stem + "_tmp")
    net.save_graph(str(tmp_html))

    _injetar_ui(tmp_html, out_html, paths_obrigatorios)
    tmp_html.unlink(missing_ok=True)
    logger.info("Grafo interativo salvo: %s", out_html)


def _injetar_ui(src: Path, dst: Path, paths: dict[str, list[str]]) -> None:
    """Injeta caixa de busca e painel de legenda/caminhos no HTML do pyvis."""
    html = src.read_text(encoding="utf-8")

    # Tabela de caminhos para o painel
    linhas_caminhos = ""
    for label, path in paths.items():
        linhas_caminhos += (
            f'<tr><td style="padding:4px 8px;font-weight:bold;color:#FFB300">{label}</td>'
            f'<td style="padding:4px 8px;color:#e2efff">{" → ".join(path)}'
            f' <span style="color:#aaa">(custo={len(path) - 1})</span></td></tr>\n'
        )

    ui_html = f"""
<style>
  #panel {{
    position: fixed; top: 12px; left: 12px; z-index: 9999;
    background: rgba(11,21,38,0.92); border: 1px solid #1a3050;
    border-radius: 8px; padding: 12px 16px; min-width: 280px;
    font-family: 'Inter', system-ui, sans-serif; color: #e2efff;
  }}
  #panel h3 {{ margin: 0 0 8px; font-size: 13px; color: #00d4ff; }}
  #searchBox {{
    width: 100%; padding: 6px 10px; margin-bottom: 10px;
    background: #0f1e35; border: 1px solid #1a3050; border-radius: 4px;
    color: #e2efff; font-size: 12px; box-sizing: border-box;
  }}
  .legenda-item {{ display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 11px; }}
  .legenda-cor {{ width: 22px; height: 4px; border-radius: 2px; }}
  #caminhos-panel {{ margin-top: 10px; border-top: 1px solid #1a3050; padding-top: 8px; }}
  #caminhos-panel h4 {{ margin: 0 0 6px; font-size: 12px; color: #FFB300; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 11px; }}
</style>
<div id="panel">
  <h3>✈ Rede de Aeroportos — Brasil</h3>
  <input id="searchBox" type="text" placeholder="Buscar aeroporto (ex: GRU, REC)..."
         oninput="buscarAeroporto(this.value)" />
  <div class="legenda-item"><div class="legenda-cor" style="background:#4FC3F7"></div>Regional</div>
  <div class="legenda-item"><div class="legenda-cor" style="background:#7986CB"></div>Hub (inter-regional)</div>
  <div class="legenda-item"><div class="legenda-cor" style="background:#CE93D8;border:1px dashed #CE93D8"></div>Inter-regional</div>
  <div class="legenda-item"><div class="legenda-cor" style="background:#FFB300;height:4px"></div>Caminhos obrigatórios</div>
  <div id="caminhos-panel">
    <h4>📍 Caminhos obrigatórios (Dijkstra)</h4>
    <table>{linhas_caminhos}</table>
  </div>
</div>
<script>
function buscarAeroporto(val) {{
  if (!val || val.trim() === '') {{
    if (window.network) window.network.unselectAll();
    return;
  }}
  val = val.trim().toUpperCase();
  if (!window.network) return;
  var allNodes = window.network.body.data.nodes.getIds();
  var match = allNodes.filter(id => id.toUpperCase().includes(val));
  if (match.length > 0) {{
    window.network.selectNodes(match);
    window.network.focus(match[0], {{ scale: 1.5, animation: true }});
  }}
}}
// Expõe a instância da rede para acesso global
document.addEventListener('DOMContentLoaded', function() {{
  var interval = setInterval(function() {{
    if (typeof network !== 'undefined') {{
      window.network = network;
      clearInterval(interval);
    }}
  }}, 200);
}});
</script>
"""

    # Injeta antes do </body>
    html = html.replace("</body>", ui_html + "\n</body>")
    dst.write_text(html, encoding="utf-8")


# Orquestrador principal


def gerar_todas_visualizacoes(out_dir: str | Path = "out") -> None:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("[analytics] Carregando grafo...")
    graph = carregar_grafo("data/aeroportos_data.csv")

    graus_df = pd.read_csv(out_dir / "graus.csv")
    ego_df = pd.read_csv(out_dir / "ego_aeroportos.csv")

    with open(out_dir / "regioes.json", encoding="utf-8") as f:
        regioes_data = json.load(f)

    # Caminhos obrigatórios via Dijkstra
    paths_obrigatorios: dict[str, list[str]] = {}
    all_paths: list[list[str]] = []
    for origem, destino, label in [("REC", "POA", "REC -> POA"), ("MAO", "GRU", "MAO -> GRU")]:
        try:
            _, caminho = dijkstra(graph, origem, destino)
            paths_obrigatorios[label] = caminho
            all_paths.append(caminho)
        except Exception as exc:
            logger.warning("Dijkstra %s->%s falhou: %s", origem, destino, exc)
            paths_obrigatorios[label] = []

    print("[analytics] Gerando viz 1 - Histograma de graus (exploratorio)...")
    viz_histograma_graus(graus_df, out_dir)

    print("[analytics] Gerando viz 2 - Scatter grau x densidade (exploratorio)...")
    viz_scatter_grau_densidade(ego_df, graph, out_dir)

    print("[analytics] Gerando viz 3 - Ranking de hubs (explanatorio)...")
    viz_ranking_hubs(graus_df, graph, out_dir)

    print("[analytics] Gerando viz 4 - Comparacao regional (explanatorio)...")
    viz_comparacao_regioes(regioes_data, out_dir)

    print("[analytics] Gerando viz 5 - Mapa geografico do grafo (bonus)...")
    viz_mapa_grafo(ego_df, graph, out_dir)

    print("[analytics] Gerando arvore de percurso - Secao 7 (HTML interativo)...")
    from src.viz import render_routes
    highlighted = {("REC", "POA"), ("MAO", "GRU")}
    render_routes(graph, all_paths, highlighted, out_dir / "arvore_percurso.html")

    print("[analytics] Gerando grafo interativo (Secao 9)...")
    render_grafo_interativo(ego_df, graph, paths_obrigatorios, out_dir / "grafo_interativo.html")

    print(f"[analytics] Concluido. Arquivos em '{out_dir}/'")


# CLI


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="src.analytics",
        description="Gera visualizações analíticas e grafo interativo (Parte 1).",
    )
    parser.add_argument("--out", default="out", help="Diretório de saída (padrão: out/)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    gerar_todas_visualizacoes(args.out)


if __name__ == "__main__":
    main()
