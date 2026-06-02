"""
viz.py
Visualização dos percursos calculados. Preferência por `pyvis` (HTML
interativo). Se `pyvis` não estiver instalado, gera um PNG estático via
`matplotlib` como fallback.

Funções principais:
 - render_routes_pyvis(graph, paths, highlighted_pairs, out_html)
 - render_routes_matplotlib(graph, paths, highlighted_pairs, out_png)
 - render_routes(graph, paths, highlighted_pairs, out_path)
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Iterable, List, Set, Tuple

logger = logging.getLogger(__name__)

try:
    from pyvis.network import Network  # type: ignore

    _HAS_PYVIS = True
except Exception:  # pragma: no cover - optional dependency
    _HAS_PYVIS = False

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

from .graphs.graph import Graph


def plot_degree_histogram(degrees, out_png):
    """Gera um histograma simples a partir da lista de graus e salva em PNG."""
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        fig, ax = plt.subplots(figsize=(8, 4))
        if degrees:
            ax.hist(degrees, bins=min(50, max(1, len(set(degrees)))), color="C0", edgecolor="black")
            ax.set_xlabel("Degree")
            ax.set_ylabel("Frequency")
            ax.set_title("Degree histogram")
            fig.tight_layout()
            fig.savefig(out_png, dpi=150)
        else:
            # salva figura vazia mínima
            fig.savefig(out_png, dpi=150)
        plt.close(fig)
        logger.info("Histograma salvo: %s", out_png)
    except Exception:
        logger.warning("Falha ao gerar histograma em: %s", out_png)


def plot_degree_distribution(degrees, degree_counter, out_png):
    """Gera gráfico de distribuição de graus (barras ou histograma) e salva em PNG."""
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        unique_degrees = len(degree_counter)
        if unique_degrees <= 50:
            items = sorted(degree_counter.items())
            xs = [str(d) for d, _ in items]
            ys = [f for _, f in items]
            ax.bar(range(len(xs)), ys, color="C0")
            ax.set_xticks(range(len(xs)))
            ax.set_xticklabels(xs, rotation=45, ha="right", fontsize=8)
            ax.set_xlabel("Degree")
            ax.set_ylabel("Frequency")
            ax.set_title("Degree distribution (frequency per degree)")
        else:
            ax.hist(degrees, bins=50, color="C0", edgecolor="black")
            ax.set_xlabel("Degree")
            ax.set_ylabel("Frequency")
            ax.set_title("Degree histogram (50 bins)")
        ax.grid(axis="y", alpha=0.25)
        fig.tight_layout()
        fig.savefig(out_png, dpi=150)
        plt.close(fig)
        logger.info("Distribuição salva: %s", out_png)
    except Exception:
        logger.warning("Falha ao gerar distribuição em: %s", out_png)


def _collect_edges_from_paths(paths: Iterable[List[str]]) -> Set[Tuple[str, str]]:
    """Return a set of canonical undirected edges for given paths.

    Each edge is represented as a tuple (min(u,v), max(u,v)).
    """
    edges: Set[Tuple[str, str]] = set()
    for path in paths:
        for a, b in zip(path, path[1:]):
            if not a or not b:
                continue
            u, v = (a, b) if a < b else (b, a)
            edges.add((u, v))
    return edges


def render_routes_pyvis(
        graph: Graph,
        paths: Iterable[List[str]],
        highlighted_pairs: Set[Tuple[str, str]],
    out_html: str | Path = "out/arvore.html",
) -> None:
    net = Network(height="800px", width="100%", directed=False)

    # Nó: define label e tooltip (nome da cidade quando disponível)
    nodes_in_paths = {n for p in paths for n in p}
    for iata in nodes_in_paths:
        nd = graph.get_node(iata)
        title = f"{nd.cidade} ({nd.regiao})" if nd else iata
        net.add_node(iata, label=iata, title=title)

    path_edges = _collect_edges_from_paths(paths)

    # Precompute highlighted edges (canonical)
    canonical_highlights = {(a, b) if a < b else (b, a) for a, b in highlighted_pairs}
    highlighted_edges: Set[Tuple[str, str]] = set()
    for p in paths:
        if len(p) < 2:
            continue
        canonical_pair = (p[0], p[-1]) if p[0] < p[-1] else (p[-1], p[0])
        if canonical_pair in canonical_highlights:
            # add all canonical edges of this path
            for a, b in zip(p, p[1:]):
                u, v = (a, b) if a < b else (b, a)
                highlighted_edges.add((u, v))

    # Adiciona cada aresta canônica uma vez
    for u, v in sorted(path_edges):
        is_highlight = (u, v) in highlighted_edges
        color = "#d62728" if is_highlight else "#B0B0B0"
        width = 4 if is_highlight else 1
        # Peso (se disponível) — tenta ambos sentidos
        weight = None
        try:
            for e in graph.get_neighbors(u):
                if e.destino == v:
                    weight = e.peso
                    break
        except KeyError:
            weight = None

        title = f"peso={weight:.2f}" if weight is not None else ""
        net.add_edge(u, v, color=color, width=width, title=title)

    out_html = Path(out_html)
    out_html.parent.mkdir(parents=True, exist_ok=True)
    net.save_graph(str(out_html))
    logger.info("Visualização salva: %s", out_html)


def render_routes_matplotlib(
        graph: Graph,
        paths: Iterable[List[str]],
        highlighted_pairs: Set[Tuple[str, str]],
    out_png: str | Path = "out/arvore.png",
) -> None:
    # Layout circular simples (fallback sem coordenadas geográficas)
    nodes = sorted({n for p in paths for n in p})
    n = len(nodes)
    if n == 0:
        raise ValueError("Nenhum nó para desenhar.")

    import math

    # Circular layout com espaçamento uniforme
    angles = [2 * math.pi * i / n for i in range(n)]
    scale = 1.0
    pos = {nodes[i]: (scale * math.cos(angles[i]), scale * math.sin(angles[i])) for i in range(n)}

    # Preparar coleções de linhas com destaque canônico
    paths_list = list(paths)
    canonical_highlights = {(a, b) if a < b else (b, a) for a, b in highlighted_pairs}
    highlighted_edges = set()
    for p in paths_list:
        if len(p) < 2:
            continue
        canonical_pair = (p[0], p[-1]) if p[0] < p[-1] else (p[-1], p[0])
        if canonical_pair in canonical_highlights:
            for a, b in zip(p, p[1:]):
                u, v = (a, b) if a < b else (b, a)
                highlighted_edges.add((u, v))

    all_segments = []
    all_colors = []
    all_widths = []

    for path in paths_list:
        for a, b in zip(path, path[1:]):
            if a not in pos or b not in pos:
                continue
            all_segments.append((pos[a], pos[b]))
            u, v = (a, b) if a < b else (b, a)
            if (u, v) in highlighted_edges:
                all_colors.append('#d62728')
                all_widths.append(6.0)
            else:
                all_colors.append('#B0B0B0')
                all_widths.append(1.2)

    # Desenha coleções
    lc = LineCollection(all_segments, colors=all_colors, linewidths=all_widths, zorder=1, alpha=0.95)

    fig, ax = plt.subplots(figsize=(12, 12), facecolor='white')
    ax.add_collection(lc)

    # Nós (círculos preenchidos) e rótulos com contorno para legibilidade
    xs = [pos[n][0] for n in nodes]
    ys = [pos[n][1] for n in nodes]
    ax.scatter(xs, ys, s=350, color='#2B7CE9', edgecolors='black', linewidth=0.8, zorder=2)

    # rótulos com contorno (stroke) para contraste
    try:
        import matplotlib.patheffects as pe
        has_pe = True
    except Exception:
        has_pe = False

    for n in nodes:
        x, y = pos[n]
        if has_pe:
            ax.text(x, y, n, fontsize=10, ha='center', va='center', color='white', fontweight='bold', zorder=3,
                    path_effects=[pe.withStroke(linewidth=3, foreground='black')])
        else:
            ax.text(x, y, n, fontsize=10, ha='center', va='center', color='white', fontweight='bold', zorder=3)

    # Legenda clara
    from matplotlib.lines import Line2D
    legend_handles = [
        Line2D([0], [0], color='#d62728', lw=6, label='Rotas obrigatórias (REC → POA, MAO → GRU)'),
        Line2D([0], [0], color='#B0B0B0', lw=1.5, label='Outras rotas')
    ]
    # Let matplotlib pick a non-overlapping location
    ax.legend(handles=legend_handles, loc='best', framealpha=0.95)

    ax.set_axis_off()

    # Ajusta limites do eixo com base nas posições geradas para garantir
    # que o grafo ocupe boa parte da imagem (evita bbox_inches='tight' que
    # em alguns ambientes gera imagens enormes).
    xs_vals = [p[0] for p in pos.values()]
    ys_vals = [p[1] for p in pos.values()]
    minx, maxx = min(xs_vals), max(xs_vals)
    miny, maxy = min(ys_vals), max(ys_vals)
    dx = maxx - minx
    dy = maxy - miny
    # margem relativa (reduzida para evitar grandes áreas em branco)
    if dx == 0 and dy == 0:
        margin = 0.6
    else:
        margin = max(dx, dy) * 0.25
    # cap a margem para valores razoáveis
    if margin < 0.4:
        margin = 0.4
    if margin > 3.0:
        margin = 3.0

    ax.set_xlim(minx - margin, maxx + margin)
    ax.set_ylim(miny - margin, maxy + margin)
    ax.set_aspect('equal', adjustable='box')

    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_png, dpi=150)
    plt.close(fig)
    logger.info("Visualização salva: %s", out_png)

    # Também gera um HTML simples incorporando o PNG (fallback interativo quando pyvis não funcionar)
    html_path = out_png.with_suffix('.html')
    html_content = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Árvore de Percurso — Rotas destacadas</title>
  <style>body{{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#222;margin:16px}} .legend{{margin:8px 0 16px}} img{{max-width:100%;height:auto;border:1px solid #ddd}}</style>
</head>
<body>
  <h2>Árvore de Percurso</h2>
  <div class="legend">
    <strong>Legenda:</strong>
    <ul>
      <li><span style="color:#d62728;font-weight:bold">■</span> Rotas obrigatórias: REC → POA, MAO → GRU (cor vermelha, espessura aumentada)</li>
      <li><span style="color:#B0B0B0">■</span> Outras rotas (cinza, finas)</li>
    </ul>
  </div>
  <div>
    <img src="{out_png.name}" alt="Árvore de Percurso">
  </div>
  <p>Gerado automaticamente pelo pipeline.</p>
</body>
</html>
'''

    with html_path.open('w', encoding='utf-8') as f:
        f.write(html_content)

    logger.info("HTML fallback salvo: %s", html_path)


def render_routes(
        graph: Graph,
        paths: Iterable[List[str]],
        highlighted_pairs: Set[Tuple[str, str]],
    out_path: str | Path = "out/arvore.html",
) -> None:
    out_path = Path(out_path)
    # Tenta Pyvis quando disponível e solicitado (HTML);
    # se falhar, cai para o fallback estático via matplotlib (PNG).
    if _HAS_PYVIS and out_path.suffix.lower() in {'.html', '.htm'}:
        try:
            render_routes_pyvis(graph, paths, highlighted_pairs, out_path)
            return
        except Exception as exc:  # pragma: no cover - runtime fallback
            logger.warning("pyvis falhou (%s) — usando fallback matplotlib.", exc)

    # fallback para PNG
    png_path = out_path.with_suffix('.png') if out_path.suffix else Path(str(out_path) + '.png')
    render_routes_matplotlib(graph, paths, highlighted_pairs, png_path)


def render_description(description: dict, degree_dist: list, hubs: list, out_png: str | Path):
    """Gera uma imagem PNG simples com resumo do `description`.

    Parâmetros mínimos esperados (compatibilidade com src.graphs.io.save_dataset_description):
      - description: dict com chaves 'vertices', 'edges', 'graph_type', 'degree_stats'
      - degree_dist: lista de dicts {'degree': int, 'frequency': int}
      - hubs: lista de dicts {'node': str, 'degree': int}
    """
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.axis('off')

        lines = []
        lines.append(f"Vertices: {description.get('vertices')}")
        lines.append(f"Edges: {description.get('edges')}")
        lines.append(f"Graph type: {description.get('graph_type')}")

        deg_stats = description.get('degree_stats', {}) or {}
        if deg_stats:
            lines.append("")
            lines.append("Degree stats:")
            for k in ('min', '25%', '50%', '75%', 'max', 'mean', 'stdev'):
                if k in deg_stats:
                    lines.append(f"  {k}: {deg_stats[k]}")

        # Top hubs
        if hubs:
            lines.append("")
            lines.append("Top hubs:")
            for h in hubs[:10]:
                lines.append(f"  {h.get('node')}: {h.get('degree')}")

        ax.text(0, 1, '\n'.join(lines), va='top', ha='left', fontsize=10, family='sans-serif')

        fig.tight_layout()
        fig.savefig(out_png, dpi=150)
        plt.close(fig)
        logger.info("Description PNG salvo: %s", out_png)
    except Exception as exc:
        logger.warning("Falha ao gerar description PNG (%s): %s", out_png, exc)


def render_global(global_m: dict, out_png: str | Path):
    """Minimal stub to render global metrics to a PNG.

    This creates a small PNG with textual summary or an empty file on failure.
    Kept intentionally small for compatibility with `src.solve.salvar_metricas`.
    """
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.axis('off')
        lines = [
            f"ordem: {global_m.get('ordem')}",
            f"tamanho: {global_m.get('tamanho')}",
            f"densidade: {global_m.get('densidade')}",
        ]
        ax.text(0, 1, "\n".join(lines), va='top', ha='left', fontsize=10, family='sans-serif')
        fig.tight_layout()
        fig.savefig(out_png, dpi=150)
        plt.close(fig)
        logger.info("render_global salvo: %s", out_png)
    except Exception:
        try:
            out_png.write_bytes(b"")
        except Exception:
            logger.warning("Não foi possível criar arquivo de fallback: %s", out_png)


def render_regioes(regional_m: list, out_png: str | Path):
    """Minimal stub to render regional metrics to a PNG.

    Writes a compact summary (top regions) or creates an empty file on failure.
    """
    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    try:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.axis('off')
        lines = []
        for r in (regional_m or [])[:10]:
            lines.append(f"{r.get('regiao')}: ordem={r.get('ordem')} tamanho={r.get('tamanho')} densidade={r.get('densidade')}")
        if not lines:
            lines = ["(no regional data)"]
        ax.text(0, 1, "\n".join(lines), va='top', ha='left', fontsize=9, family='sans-serif')
        fig.tight_layout()
        fig.savefig(out_png, dpi=150)
        plt.close(fig)
        logger.info("render_regioes salvo: %s", out_png)
    except Exception:
        try:
            out_png.write_bytes(b"")
        except Exception:
            logger.warning("Não foi possível criar arquivo de fallback: %s", out_png)
