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

from pathlib import Path
import logging
from typing import Iterable, List, Set, Tuple

logger = logging.getLogger(__name__)

try:
	from pyvis.network import Network  # type: ignore
	_HAS_PYVIS = True
except Exception:  # pragma: no cover - optional dependency
	_HAS_PYVIS = False

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

from src.graphs.graph import Graph


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
	out_html: str | Path = "out/arvore_percurso.html",
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
	net.show(str(out_html))
	logger.info("Visualização salva: %s", out_html)


def render_routes_matplotlib(
	graph: Graph,
	paths: Iterable[List[str]],
	highlighted_pairs: Set[Tuple[str, str]],
	out_png: str | Path = "out/arvore_percurso.png",
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


def render_required_route_pngs(
		graph: Graph,
		paths: Iterable[List[str]],
		out_dir: str | Path = "out",
		required_pairs: Iterable[Tuple[str, str]] | None = None,
) -> None:
		"""Gera um PNG por cada rota em `required_pairs`.

		Cada imagem destaca apenas uma rota obrigatória (os demais arcos ficam neutros).
		Por padrão gera REC→POA e MAO→GRU com nomes:
			- out/arvore_rec_poa.png
			- out/arvore_mao_gru.png
		"""
		out_dir = Path(out_dir)
		out_dir.mkdir(parents=True, exist_ok=True)

		if required_pairs is None:
				required_pairs = [("REC", "POA"), ("MAO", "GRU")]

		for a, b in required_pairs:
				png_name = f"arvore_{a.lower()}_{b.lower()}.png"
				out_png = out_dir / png_name
				render_routes_matplotlib(graph, paths, {(a, b)}, out_png)


def render_routes(
	graph: Graph,
	paths: Iterable[List[str]],
	highlighted_pairs: Set[Tuple[str, str]],
	out_path: str | Path = "out/arvore_percurso.html",
) -> None:
	out_path = Path(out_path)
	# Sempre gera imagens estáticas PNG — não produzir HTML.
	out_dir = out_path.parent if out_path.parent and str(out_path.parent) != '.' else Path("out")

	# Detecta se as rotas obrigatórias REC→POA e MAO→GRU estão entre os highlights.
	canonical_in = {(a, b) if a < b else (b, a) for a, b in highlighted_pairs}
	required = [("REC", "POA"), ("MAO", "GRU")]

	# Se ao menos uma rota obrigatória estiver nas highlights, gera um PNG por rota
	# garantindo que cada PNG destaque apenas a sua rota.
	to_generate = [p for p in required if ((p[0], p[1]) if p[0] < p[1] else (p[1], p[0])) in canonical_in]
	if to_generate:
		render_required_route_pngs(graph, paths, out_dir, required_pairs=to_generate)
		return

	# Caso contrário, gera um único PNG com os highlights recebidos (comportamento legado)
	png_path = out_path.with_suffix('.png') if out_path.suffix else Path(str(out_path) + '.png')
	render_routes_matplotlib(graph, paths, highlighted_pairs, png_path)


def render_description(description, degree_list, top_hubs, out_png="out/description.png"):
	"""Renderiza uma imagem PNG com a descrição do dataset.

	Parameters
	- description: dict com chaves 'vertices','edges','graph_type','degree_stats','sum_degrees','consistency','consistency_message'
	- degree_list: lista de dicts [{'degree': int, 'frequency': int}, ...]
	- top_hubs: lista de dicts [{'node': str, 'degree': int}, ...]
	- out_png: caminho do PNG de saída
	"""
	out_png = Path(out_png)
	out_png.parent.mkdir(parents=True, exist_ok=True)
	try:
		fig = plt.figure(figsize=(10, 6))
		fig.suptitle("Dataset Description", fontsize=14, fontweight='bold')

		# Área esquerda: métricas gerais
		ax_left = fig.add_axes([0.02, 0.15, 0.45, 0.8])
		ax_left.axis('off')
		lines = []
		lines.append(f"Vertices: {description.get('vertices')}")
		lines.append(f"Edges: {description.get('edges')}")
		lines.append(f"Graph type: {description.get('graph_type')}")
		lines.append("")
		ds = description.get('degree_stats', {})
		lines.append("Degree stats:")
		for k in ("min", "max", "mean", "median", "stdev", "25%", "50%", "75%"):
			if k in ds:
				lines.append(f"  {k}: {ds[k]}")
		lines.append("")
		lines.append(f"Sum degrees: {description.get('sum_degrees')}")
		lines.append(f"Consistency: {description.get('consistency')}")
		msg = description.get('consistency_message', '')
		if msg:
			lines.append("")
			lines.append(f"Note: {msg}")

		ax_left.text(0, 1, "\n".join(lines), va='top', fontsize=10, family='monospace')

		# Área direita superior: degree distribution (top 10 frequencies)
		ax_dist = fig.add_axes([0.5, 0.55, 0.48, 0.4])
		ax_dist.set_title('Degree distribution (sample)')
		# show top up to 20 degrees as bar chart for compactness
		sample = degree_list[-20:] if isinstance(degree_list, list) and degree_list else []
		if sample:
			xs = [str(d['degree']) for d in sample]
			ys = [d['frequency'] for d in sample]
			ax_dist.bar(range(len(xs)), ys, color='C0')
			ax_dist.set_xticks(range(len(xs)))
			ax_dist.set_xticklabels(xs, rotation=45, ha='right', fontsize=8)
			ax_dist.set_ylabel('Frequency')
		else:
			ax_dist.text(0.5, 0.5, 'No degree data', ha='center', va='center')

		# Área direita inferior: top hubs
		ax_hubs = fig.add_axes([0.5, 0.15, 0.48, 0.35])
		ax_hubs.axis('off')
		ax_hubs.set_title('Top hubs')
		if top_hubs:
			# build a simple table text
			rows = [f"{i+1}. {h['node']} (deg={h['degree']})" for i, h in enumerate(top_hubs[:10])]
			ax_hubs.text(0, 1, "\n".join(rows), va='top', fontsize=9, family='monospace')
		else:
			ax_hubs.text(0.5, 0.5, 'No hubs data', ha='center', va='center')

		fig.savefig(out_png, dpi=150)
		plt.close(fig)
		logger.info("Description PNG salvo: %s", out_png)
	except Exception:
		logger.exception("Falha ao renderizar description PNG: %s", out_png)


def render_global(global_dict, out_png="out/global.png"):
	"""Renderiza um cartão simples com ordem, tamanho e densidade."""
	out_png = Path(out_png)
	out_png.parent.mkdir(parents=True, exist_ok=True)
	try:
		fig, ax = plt.subplots(figsize=(5, 3))
		ax.axis('off')
		text = (
			f"Ordem: {global_dict.get('ordem')}\n"
			f"Tamanho: {global_dict.get('tamanho')}\n"
			f"Densidade: {global_dict.get('densidade'):.6f}"
		)
		ax.text(0.5, 0.5, text, ha='center', va='center', fontsize=12, family='monospace')
		fig.tight_layout()
		fig.savefig(out_png, dpi=150)
		plt.close(fig)
		logger.info("Global PNG salvo: %s", out_png)
	except Exception:
		logger.exception("Falha ao renderizar global PNG: %s", out_png)


def render_regioes(regions_list, out_png="out/regioes.png"):
	"""Renderiza uma tabela PNG com as métricas regionais.

	regions_list: lista de dicts com chaves 'regiao','ordem','tamanho','densidade'
	"""
	out_png = Path(out_png)
	out_png.parent.mkdir(parents=True, exist_ok=True)
	try:
		n = max(3, len(regions_list))
		fig_height = 0.6 + 0.4 * n
		fig, ax = plt.subplots(figsize=(8, max(2.5, fig_height)))
		ax.axis('off')
		# Table header + rows
		cols = ['Região', 'Ordem', 'Tamanho', 'Densidade']
		cell_text = []
		for r in regions_list:
			cell_text.append([
				r.get('regiao'),
				r.get('ordem'),
				r.get('tamanho'),
				f"{r.get('densidade'):.6f}",
			])

		table = ax.table(cellText=cell_text, colLabels=cols, cellLoc='center', loc='center')
		table.auto_set_font_size(False)
		table.set_fontsize(10)
		table.scale(1, 1.4)
		fig.tight_layout()
		fig.savefig(out_png, dpi=150)
		plt.close(fig)
		logger.info("Regiões PNG salvo: %s", out_png)
	except Exception:
		logger.exception("Falha ao renderizar regioes PNG: %s", out_png)

