"""
io.py
Funções de entrada/saída para o grafo de aeroportos.

Responsabilidade deste módulo
------------------------------
  - Ler e validar o CSV fornecido (aeroportos_data.csv).
  - Popular o grafo APENAS com nós (aeroportos isolados).
  - O CSV original não contém conexões explícitas; arestas são
    construídas em etapa posterior (via adjacencias_aeroportos.csv).
"""

from __future__ import annotations

import ast
import csv
import itertools
import json
import logging
import re
import shutil
import statistics
import subprocess
import zipfile
from collections import defaultdict, Counter
from pathlib import Path

import unicodedata

from .graph import Graph
# Plotagem e visualização ficam centralizadas em src.viz (apenas viz.py
# pode importar matplotlib/pyvis/plotly). Importa-se apenas as funções de
# plotagem reutilizáveis aqui.
from ..viz import plot_degree_histogram, plot_degree_distribution, render_description

# ---------------------------------------------------------------------------
# Configuração de logging
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

# Colunas obrigatórias no CSV de aeroportos
_REQUIRED_COLUMNS = frozenset({"iata", "cidade", "regiao"})

# Regiões válidas do Brasil (para validação)
_VALID_REGIONS = frozenset({"Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"})


# ---------------------------------------------------------------------------
# Funções auxiliares de validação
# ---------------------------------------------------------------------------

def _validate_columns(headers, filepath):
    """Verifica se os headers (lista de nomes) contêm as colunas obrigatórias.

    Recebe uma lista/iterável de nomes de coluna e normaliza (strip + lower).
    """
    present = frozenset(h.strip().lower() for h in (headers or []) if h)
    missing = _REQUIRED_COLUMNS - present

    if missing:
        raise ValueError(
            f"Colunas ausentes em '{filepath.name}': {sorted(missing)}. "
            f"Colunas encontradas: {sorted(present)}."
        )


def _validate_row(row, line_number):
    """
    Valida uma linha individual do CSV.

    Retorna uma string de aviso se houver problema (linha ignorada),
    ou None se a linha for válida.
    """
    iata = str(row["iata"]).strip().upper()
    cidade = str(row["cidade"]).strip()
    regiao = str(row["regiao"]).strip()

    # Verificar campos vazios
    if not iata or iata in ("NAN", "NONE", ""):
        return f"[Linha {line_number}] Código IATA vazio — ignorado."

    if len(iata) != 3 or not iata.isalpha():
        return (
            f"[Linha {line_number}] Código IATA inválido: '{iata}' "
            "(esperado: 3 letras) — ignorado."
        )

    if not cidade or cidade.upper() in ("NAN", "NONE"):
        return f"[Linha {line_number}] Cidade vazia para IATA '{iata}' — ignorado."

    if regiao not in _VALID_REGIONS:
        return (
            f"[Linha {line_number}] Região '{regiao}' inválida para '{iata}'. "
            f"Regiões válidas: {sorted(_VALID_REGIONS)} — ignorado."
        )

    return None  # linha OK


# ---------------------------------------------------------------------------
# Função principal de carregamento
# ---------------------------------------------------------------------------

def load_airports(filepath, encoding="utf-8"):
    """
    Lê o arquivo CSV de aeroportos e retorna um grafo populado apenas
    com nós isolados (sem arestas).

    As arestas devem ser carregadas em etapa posterior, a partir do
    arquivo `adjacencias_aeroportos.csv`, via `load_edges()`.

    Parâmetros
    ----------
    filepath : Caminho para o arquivo `aeroportos_data.csv`.
    encoding : Codificação do arquivo (padrão: "utf-8").

    Retorna
    -------
    Graph
        Instância de Graph com todos os aeroportos válidos como nós.

    Raises
    ------
    FileNotFoundError : Se o arquivo não existir.
    ValueError        : Se colunas obrigatórias estiverem ausentes.
    """
    filepath = Path(filepath)

    if not filepath.exists():
        raise FileNotFoundError(
            f"Arquivo não encontrado: '{filepath}'. "
            "Verifique o caminho e tente novamente."
        )

    logger.info("Carregando aeroportos de '%s'...", filepath.name)

    # --- Leitura via csv.DictReader (substitui pandas) -----------------------
    graph = Graph()
    skipped = 0
    duplicates = 0
    total_read = 0

    with Path(filepath).open(encoding=encoding, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        if reader.fieldnames is None:
            raise ValueError(f"Arquivo vazio: '{filepath}'")

        headers = [h.strip() for h in reader.fieldnames if h]
        _validate_columns(headers, filepath)

        for line_number, row in enumerate(reader, start=2):
            total_read += 1
            # Normalize row keys to lowercase stripped names
            row_norm = {(k.strip().lower() if k is not None else ""): (v or "").strip() for k, v in row.items()}

            warning = _validate_row(row_norm, line_number)
            if warning:
                logger.warning(warning)
                skipped += 1
                continue

            iata = str(row_norm.get("iata", "")).upper()
            cidade = str(row_norm.get("cidade", ""))
            regiao = str(row_norm.get("regiao", ""))

            if graph.has_node(iata):
                logger.warning(
                    "[Linha %d] IATA '%s' duplicado — mantendo o primeiro registro.",
                    line_number,
                    iata,
                )
                duplicates += 1
                continue

            graph.add_node(iata, cidade, regiao)

    # --- Relatório de carregamento --------------------------------------------
    total_valid = graph.order()
    # total_read conta apenas linhas de dados (exclui cabeçalho)
    try:
        total_read
    except NameError:
        total_read = 0

    logger.info(
        "Carregamento concluído: %d nós adicionados | "
        "%d ignorados | %d duplicatas | %d lidas no total.",
        total_valid,
        skipped,
        duplicates,
        total_read,
    )

    if total_valid == 0:
        raise ValueError(
            "Nenhum aeroporto válido encontrado no arquivo. "
            "Verifique o conteúdo do CSV."
        )

    return graph


# ---------------------------------------------------------------------------
# Carregamento de arestas (etapa posterior — Parte 1, Seção 2)
# ---------------------------------------------------------------------------

def load_edges(graph, filepath, encoding="utf-8"):
    """
    Lê o arquivo `adjacencias_aeroportos.csv` e adiciona as arestas
    ao grafo existente.

    Esta função é separada de `load_airports` propositalmente:
    o enunciado define que as arestas são construídas manualmente
    pelo grupo e armazenadas em arquivo próprio.

    Formato esperado do CSV
    -----------------------
    origem,destino,tipo_conexao,justificativa,peso
    REC,SSA,regional,"mesma região",1.0

    Parâmetros
    ----------
    graph    : Instância de Graph já populada com nós via `load_airports`.
    filepath : Caminho para `adjacencias_aeroportos.csv`.
    encoding : Codificação do arquivo.

    Retorna
    -------
    int : Número de arestas adicionadas com sucesso.

    Raises
    ------
    FileNotFoundError : Se o arquivo não existir.
    """
    filepath = Path(filepath)

    if not filepath.exists():
        raise FileNotFoundError(
            f"Arquivo de adjacências não encontrado: '{filepath}'."
        )

    _EDGE_COLUMNS = frozenset({"origem", "destino", "tipo_conexao", "justificativa", "peso"})

    logger.info("Carregando arestas de '%s'...", filepath.name)

    edges_added = 0
    edges_skipped = 0

    with filepath.open(encoding=encoding, newline="") as csvfile:
        reader = csv.DictReader(csvfile)

        # Validar cabeçalho
        if reader.fieldnames is None:
            raise ValueError("Arquivo de adjacências está vazio.")

        normalized_fields = frozenset(
            f.strip().lower() for f in reader.fieldnames if f
        )
        missing = _EDGE_COLUMNS - normalized_fields
        if missing:
            raise ValueError(
                f"Colunas ausentes em '{filepath.name}': {sorted(missing)}."
            )

        for line_number, row in enumerate(reader, start=2):
            # Normalize row keys to lowercase stripped names to be robust
            # against header capitalization/spacing differences.
            row_norm = {(k.strip().lower() if k is not None else ""): (v or "").strip() for k, v in row.items()}

            origem = row_norm.get("origem", "").upper()
            destino = row_norm.get("destino", "").upper()
            tipo = row_norm.get("tipo_conexao", "")
            justificativa = row_norm.get("justificativa", "")

            peso_str = row_norm.get("peso", "1.0")
            try:
                peso = float(peso_str)
            except ValueError:
                logger.warning(
                    "[Linha %d] Peso inválido para aresta %s→%s — ignorado.",
                    line_number, origem, destino,
                )
                edges_skipped += 1
                continue

            # Verificar se nós existem
            for no in (origem, destino):
                if not graph.has_node(no):
                    logger.warning(
                        "[Linha %d] Nó '%s' não encontrado no grafo — aresta ignorada.",
                        line_number, no,
                    )
                    edges_skipped += 1
                    break
            else:
                # Evitar aresta duplicada (grafo já é não-direcionado internamente)
                if graph.has_edge(origem, destino):
                    logger.debug(
                        "[Linha %d] Aresta %s↔%s já existe — ignorada.",
                        line_number, origem, destino,
                    )
                    edges_skipped += 1
                    continue

                try:
                    graph.add_edge(
                        origem=origem,
                        destino=destino,
                        peso=peso,
                        tipo_conexao=tipo,
                        justificativa=justificativa,
                    )
                    edges_added += 1
                except (KeyError, ValueError) as exc:
                    logger.warning(
                        "[Linha %d] Aresta %s→%s ignorada: %s",
                        line_number, origem, destino, exc,
                    )
                    edges_skipped += 1

    logger.info(
        "Arestas: %d adicionadas | %d ignoradas.", edges_added, edges_skipped
    )
    return edges_added


# ---------------------------------------------------------------------------
# Função de conveniência: carrega nós + arestas em uma única chamada
# ---------------------------------------------------------------------------

def carregar_grafo(dataset_path):
    """
    Carrega aeroportos e arestas a partir do caminho do CSV de aeroportos.

    Assume que `adjacencias_aeroportos.csv` está no mesmo diretório que
    o arquivo de aeroportos fornecido.

    Parâmetros
    ----------
    dataset_path : Caminho para `aeroportos_data.csv`.

    Retorna
    -------
    Graph : Grafo completo com nós e arestas carregados.
    """
    dataset_path = Path(dataset_path)
    graph = load_airports(dataset_path)

    adjacencias_path = dataset_path.parent / "adjacencias_aeroportos.csv"
    if adjacencias_path.exists():
        load_edges(graph, adjacencias_path)
    else:
        logger.warning(
            "Adjacências não encontradas em '%s' — grafo carregado sem arestas.",
            adjacencias_path,
        )

    return graph


# ---------------------------------------------------------------------------
# Parte 2: download e organização do dataset (etapa mínima)
# ---------------------------------------------------------------------------


def download_dataset_parte2(dest_dir="data/dataset_parte2", kaggle_dataset="joebeachcapital/marvel-movies", unzip=True,
                            clean_archives=True):
    """Tenta baixar e organizar o dataset Parte 2 no diretório destino.

    Estratégia:
    - Se a CLI `kaggle` estiver disponível no PATH, usa-a para baixar e
      descompactar o dataset automaticamente.
    - Caso contrário, instrui o usuário a baixar manualmente e posicionar
      os arquivos em `dest_dir`.
    - Após a presença de CSVs, escolhe o arquivo de dados principal e o copia
     /renomeia para `marvel_movies.csv` para consistência com o pipeline.
    - Cria arquivos stub de teste (`negative_edges.csv`, `negative_cycle.csv`)
      e um `README_dataset.md` com instruções.

    Observação: esta função NÃO executa parsing do dataset — apenas prepara
    o diretório e os arquivos necessários para as etapas seguintes.
    """
    dest = Path(dest_dir)
    dest.mkdir(parents=True, exist_ok=True)

    logger.info("Preparando diretório do dataset em '%s'...", dest)

    # 1) Tentar usar kaggle CLI quando disponível
    kaggle_exec = shutil.which("kaggle")
    if kaggle_exec:
        logger.info("Kaggle CLI detectada em '%s' — tentando download...", kaggle_exec)
        try:
            cmd = [kaggle_exec, "datasets", "download", "-d", kaggle_dataset, "-p", str(dest)]
            if unzip:
                cmd.append("--unzip")
            subprocess.run(cmd, check=True)
            logger.info("Download concluído (via kaggle).")
        except subprocess.CalledProcessError as exc:
            logger.warning("Falha ao executar kaggle CLI: %s", exc)
    else:
        logger.warning(
            "Kaggle CLI não encontrada no PATH. Por favor baixe manualmente: %s",
            "https://www.kaggle.com/datasets/joebeachcapital/marvel-movies",
        )

    # 2) Se houver arquivos zip, descompactar (caso não tenham sido extraídos)
    zip_files = list(dest.glob("*.zip"))
    if zip_files and unzip:
        for z in zip_files:
            try:
                with zipfile.ZipFile(z, "r") as zf:
                    logger.info("Extraindo %s ...", z.name)
                    zf.extractall(dest)
            except Exception as exc:
                logger.warning("Falha ao extrair %s: %s", z.name, exc)

    # 3) Identificar CSVs candidatos e escolher o arquivo principal
    csv_files = [p for p in dest.iterdir() if p.is_file() and p.suffix.lower() == ".csv"]

    def _choose_main_csv(candidates):
        if not candidates:
            return None
        # prefer files containing 'marvel' or 'movie' in the name
        for name in ("marvel", "movies", "movie"):
            for p in candidates:
                if name in p.name.lower():
                    return p
        # fallback: if only one CSV, choose it
        if len(candidates) == 1:
            return candidates[0]
        # otherwise choose the largest CSV (heurística)
        return sorted(candidates, key=lambda x: x.stat().st_size, reverse=True)[0]

    main_csv = _choose_main_csv(csv_files)
    if main_csv:
        target = dest / "marvel_movies.csv"
        try:
            if main_csv.resolve() != target.resolve():
                shutil.copy2(main_csv, target)
                logger.info("Arquivo principal identificado: %s -> %s", main_csv.name, target.name)
            else:
                logger.info("Arquivo principal já em posição: %s", target.name)
        except Exception as exc:
            logger.warning("Não foi possível copiar %s para %s: %s", main_csv, target, exc)
    else:
        logger.warning(
            "Nenhum CSV identificado automaticamente em %s. Por favor coloque o arquivo 'marvel_movies.csv' neste diretório.",
            dest,
        )

    # 4) Limpeza de artefatos opcionais (zip/__MACOSX)
    if clean_archives:
        for z in dest.glob("*.zip"):
            try:
                z.unlink()
                logger.debug("Removido arquivo de archive %s", z)
            except Exception:
                logger.debug("Não foi possível remover %s", z)

        macosx = dest / "__MACOSX"
        if macosx.exists() and macosx.is_dir():
            try:
                shutil.rmtree(macosx)
                logger.debug("Removido diretório %s", macosx)
            except Exception:
                logger.debug("Não foi possível remover %s", macosx)

    # 5) Criar stubs úteis para as etapas seguintes
    readme_path = dest / "README_dataset.md"
    if not readme_path.exists():
        readme_content = (
            "# Dataset Parte 2 — Marvel Movies\n"
            "Fonte: https://www.kaggle.com/datasets/joebeachcapital/marvel-movies\n\n"
            "Instruções:\n"
            "- Preferência: use a CLI do kaggle para baixar e descompactar:\n"
            "  `kaggle datasets download -d joebeachcapital/marvel-movies -p data/dataset_parte2 --unzip`\n"
            "- Caso não tenha a CLI, baixe manualmente e posicione os arquivos em `data/dataset_parte2/`.\n"
            "- O arquivo principal esperado para as próximas etapas será `marvel_movies.csv`.\n"
        )
        try:
            readme_path.write_text(readme_content, encoding="utf-8")
            logger.info("README do dataset criado: %s", readme_path)
        except Exception:
            logger.warning("Falha ao criar %s", readme_path)

    # 6) Criar placeholders para testes do Bellman-Ford (vazios com cabeçalho)
    neg_edges = dest / "negative_edges.csv"
    neg_cycle = dest / "negative_cycle.csv"
    header = "origin,destination,weight,tipo_conexao,justificativa\n"
    for p in (neg_edges, neg_cycle):
        if not p.exists():
            try:
                p.write_text(header, encoding="utf-8")
                logger.info("Stub criado: %s", p)
            except Exception:
                logger.warning("Não foi possível criar stub %s", p)

    logger.info("Estrutura do dataset pronta em: %s", dest)
    return dest


def salvar_csv_graus(graus, out_dir="out"):
    """Exporta a distribuição de graus como JSON e uma figura PNG.

    NOTE: Mantemos o nome da função por compatibilidade, mas NÃO geramos
    arquivos CSV em `out/` para obedecer à arquitetura do projeto.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # gravar JSON com lista de pares (node, degree)
    json_path = out_dir / "graus.json"
    data = [{"node": n, "degree": int(d)} for n, d in graus]
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # gerar histograma de graus delegando a visualização a src.viz
    try:
        degrees = [d for _, d in graus]
        fig_path = out_dir / "degree_hist.png"
        plot_degree_histogram(degrees, fig_path)
    except Exception:
        logger.warning("Falha ao gerar degree_hist.png em %s", out_dir)


def salvar_ego_aeroporto_csv(ego_data, out_dir="out"):
    """Salva resultados de ego network como JSON em `out_dir`.

    Mantemos o nome original por compatibilidade com chamadas existentes,
    mas não geramos CSVs no diretório `out/`.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "ego_aeroportos.json"
    path.write_text(json.dumps(ego_data, ensure_ascii=False, indent=2), encoding="utf-8")


def grau_ego_aeroporto(out_dir="out"):
    """Lê `ego_aeroportos.json` do `out_dir` e retorna lista de (aeroporto, grau)."""
    lista_graus = []
    path = Path(out_dir) / "ego_aeroportos.json"
    if not path.exists():
        return lista_graus
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data:
            lista_graus.append((row.get("aeroporto"), int(row.get("grau", 0))))
    except Exception:
        logger.warning("Falha ao ler ego_aeroportos.json em %s", out_dir)
    return lista_graus


def densidade_ego_aeroporto(out_dir="out"):
    """Lê `ego_aeroportos.json` do `out_dir` e retorna lista de (aeroporto, densidade_ego)."""
    lista = []
    path = Path(out_dir) / "ego_aeroportos.json"
    if not path.exists():
        return lista
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data:
            lista.append((row.get("aeroporto"), float(row.get("densidade_ego", 0.0))))
    except Exception:
        logger.warning("Falha ao ler ego_aeroportos.json em %s", out_dir)
    return lista


# ---------------------------------------------------------------------------
# Parte 2: loader do dataset (parsing -> Graph)
# ---------------------------------------------------------------------------


def _find_cast_column(headers):
    """Detecta a coluna mais provável que contém o elenco/atores a partir dos headers.

    Estratégia leve baseada apenas nos nomes das colunas (headers).
    """
    if not headers:
        return None
    cols = [c for c in headers]
    low = [c.strip().lower() for c in cols]

    candidates = [
        'cast', 'actors', 'cast_list', 'castings', 'acting', 'cast_names'
    ]

    for cand in candidates:
        for c, lc in zip(cols, low):
            if lc == cand:
                return c

    for c, lc in zip(cols, low):
        if 'cast' in lc or 'actor' in lc or 'actors' in lc or 'cast_list' in lc:
            return c

    return None


def _parse_cast_field(raw):
    """Converte o conteúdo bruto de uma célula de elenco em lista de nomes.

    Aceita formatos comuns: JSON array, Python list repr, strings separadas por '|', ';', '/', '\n' ou vírgula.
    Remove entradas vazias e faz strip dos nomes.
    """
    if raw is None:
        return []

    if not isinstance(raw, str):
        raw = str(raw)

    s = raw.strip()
    if not s or s.lower() in ('nan', 'none'):
        return []

    # Tenta JSON / Python literal (listas)
    if (s.startswith('[') and s.endswith(']')) or s.startswith('(\"') or s.startswith("['"):
        try:
            parsed = ast.literal_eval(s)
            if isinstance(parsed, (list, tuple)):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass

    # Heurística de separadores preferenciais
    for sep in ['|', ';', '\n', '/', ' // ', ' /// ', ' & ']:
        if sep in s:
            parts = [p.strip() for p in s.split(sep) if p.strip()]
            if len(parts) > 1:
                return parts

    # Fallback para vírgula — cuidado com formatos "Last, First"; assume-se lista curta
    if ',' in s:
        parts = [p.strip() for p in s.split(',') if p.strip()]
        # se a maioria dos tokens tiver mais de uma palavra, provavelmente é lista de nomes
        count_multiword = sum(1 for p in parts if len(p.split()) > 1)
        if count_multiword >= max(1, len(parts) // 2):
            return parts

    # último recurso: devolve a string inteira como único nome
    return [s]


def _slugify_actor(name):
    """Gera um slug ASCII a partir do nome do ator.

    Retorna em minúsculas sem acentos, espaços trocados por '-', caracteres não alfanuméricos removidos.
    """
    if not isinstance(name, str):
        name = str(name)
    name = name.strip()
    # Normaliza acentos
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_name = nfkd.encode('ascii', 'ignore').decode('ascii')
    # minusculas
    s = ascii_name.lower()
    # substituir não alfanum por hífen
    s = re.sub(r"[^a-z0-9]+", '-', s)
    s = s.strip('-')
    if not s:
        s = re.sub(r"[^a-z0-9]+", '', ascii_name).lower() or 'unknown'
    return s


def carregar_dataset_parte2(
        dataset_dir="data/dataset_parte2",
        cast_column=None,
        min_coappearances=1,
        validate=True,
):
    """Carrega o dataset Parte 2 (Marvel Movies) e retorna um Graph actor–actor.

    Parâmetros
    ----------
    dataset_dir: Diretório contendo `marvel_movies.csv` (ou CSV equivalente).
    cast_column: Coluna explicitamente informada que contém o elenco (opcional).
    min_coappearances: mínimo de co-aparições para criar uma aresta (>=1).
    validate: se True, executa verificações básicas (nós>0, pesos>0).

    Retorna
    -------
    Graph: grafo não-direcionado com atores como nós e arestas de co-aparição.
    """
    dataset_path = Path(dataset_dir)
    if dataset_path.is_file():
        csv_path = dataset_path
    else:
        # procurar por marvel_movies.csv ou heurística similar
        candidates = list(dataset_path.glob('*.csv'))

        def choose(cands):
            if not cands:
                return None
            for name in ('marvel', 'movies', 'movie'):
                for p in cands:
                    if name in p.name.lower():
                        return p
            if len(cands) == 1:
                return cands[0]
            return sorted(cands, key=lambda x: x.stat().st_size, reverse=True)[0]

        csv_path = choose(candidates)

    if csv_path is None or not csv_path.exists():
        raise FileNotFoundError(
            f"Arquivo CSV do dataset não encontrado em '{dataset_dir}'. "
            "Execute download_dataset_parte2() ou coloque 'marvel_movies.csv' no diretório."
        )

    logger.info("Carregando dataset Parte2 a partir de '%s'...", csv_path)

    # Leitura inicial (via csv.DictReader)
    with csv_path.open(encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError(f"Arquivo CSV vazio: {csv_path}")
        headers = [h.strip() for h in reader.fieldnames if h]

        # Detectar coluna de elenco
        cast_col = cast_column or _find_cast_column(headers)
        if not cast_col:
            raise ValueError(
                "Não foi possível detectar a coluna de elenco no CSV. "
                "Forneça 'cast_column' ou ajuste o arquivo para conter uma coluna 'cast' ou 'actors'."
            )

        logger.info("Usando coluna de elenco: '%s'", cast_col)

        # Co-contagem por par de atores
        co_count = defaultdict(int)
        actor_names = {}  # slug -> display name
        slug_collisions = {}

        for idx, row in enumerate(reader):
            raw = row.get(cast_col, '')
            cast_list = _parse_cast_field(raw)

            # unique by normalized name to avoid duplicates in same movie
            seen = []
            for name in cast_list:
                n = name.strip()
                if not n:
                    continue
                if n in seen:
                    continue
                seen.append(n)

            if len(seen) < 2:
                continue

            slugs = []
            for name in seen:
                base = _slugify_actor(name)
                slug = base
                # handle collisions deterministically
                if slug in actor_names and actor_names[slug] != name:
                    count = slug_collisions.get(slug, 1) + 1
                    slug_collisions[slug] = count
                    slug = f"{base}-{count}"
                actor_names[slug] = name
                slugs.append(slug)

            # increment counts for combinations
            for a, b in itertools.combinations(sorted(set(slugs)), 2):
                key = (a, b) if a < b else (b, a)
                co_count[key] += 1

    # Construir o grafo
    graph = Graph()

    # Adicionar nós
    for slug, name in actor_names.items():
        node_key = f"ACTOR_{slug.upper()}"
        # cidade -> nome do ator; regiao -> 'actor'
        graph.add_node(node_key, name, 'actor')

    # Adicionar arestas
    edges_added = 0
    for (a, b), cnt in co_count.items():
        if cnt < max(1, min_coappearances):
            continue
        node_a = f"ACTOR_{a.upper()}"
        node_b = f"ACTOR_{b.upper()}"
        # peso inverso à frequência (maior co-aparição -> menor custo)
        peso = 1.0 / (1 + cnt)
        justificativa = f"{cnt} filmes em comum"
        try:
            graph.add_edge(node_a, node_b, peso, tipo_conexao='coappearance', justificativa=justificativa)
            edges_added += 1
        except Exception as exc:
            logger.warning("Falha ao adicionar aresta %s-%s: %s", node_a, node_b, exc)

    logger.info("Grafo construído: %d nós, %d arestas (pares com pelo menos %d co-aparições)", graph.order(),
                graph.size(), min_coappearances)

    # Validações simples
    if validate:
        if graph.order() == 0:
            raise ValueError("Grafo vazio: nenhum ator encontrado no dataset.")
        # garantir pesos não-negativos
        for origem, edge in graph.iter_edges():
            if edge.peso is None or not isinstance(edge.peso, (int, float)):
                raise ValueError(f"Aresta {origem}→{edge.destino} com peso inválido: {edge.peso}")
            if edge.peso < 0:
                raise ValueError(f"Aresta {origem}→{edge.destino} tem peso negativo: {edge.peso}")

    return graph


# ---------------------------------------------------------------------------
# Dataset description (metrics, degree distribution, plots)
# ---------------------------------------------------------------------------


def _percentile(sorted_values, percentile):
    """Calcula percentil (0-100) em lista ordenada usando interpolação linear."""
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (percentile / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_values) - 1)
    if f == c:
        return float(sorted_values[int(k)])
    d0 = sorted_values[f] * (c - k)
    d1 = sorted_values[c] * (k - f)
    return float(d0 + d1)


def save_dataset_description(graph, out_dir="out"):
    """Gera descrição do grafo: |V|, |E|, tipo, distribuição de graus.

    Arquivos gerados em `out_dir`:
      - `description.json` : resumo com estatísticas descritivas
      - `degree_distribution.csv` : tabela `degree,frequency`
      - `degree_hist.png` : histograma / gráfico de barras legível
      - `methodology.md` : explicação sucinta da metodologia usada
      - `top_hubs.csv` : top-20 nós por grau

    Retorna o dicionário com a descrição (também gravado em JSON).
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Métricas básicas
    num_vertices = graph.order()
    num_edges = graph.size()

    # Detectar se o grafo é dirigido (heurística: falta de espelho em alguma aresta)
    directed = False
    for origem, vizinhos in graph.adjacency.items():
        for edge in vizinhos:
            destino = edge.destino
            if not graph.has_edge(destino, origem):
                directed = True
                break
        if directed:
            break
    graph_type = "directed" if directed else "undirected"

    # Lista de graus
    degrees = [deg for _, deg in graph.all_degrees()]

    # Estatísticas descritivas
    degree_stats = {}
    if degrees:
        sorted_degs = sorted(degrees)
        degree_stats["min"] = int(sorted_degs[0])
        degree_stats["max"] = int(sorted_degs[-1])
        degree_stats["mean"] = float(round(statistics.mean(sorted_degs), 6))
        degree_stats["median"] = float(round(statistics.median(sorted_degs), 6))
        degree_stats["stdev"] = float(round(statistics.stdev(sorted_degs), 6)) if len(sorted_degs) > 1 else 0.0
        degree_stats["25%"] = float(round(_percentile(sorted_degs, 25), 6))
        degree_stats["50%"] = float(round(_percentile(sorted_degs, 50), 6))
        degree_stats["75%"] = float(round(_percentile(sorted_degs, 75), 6))
    else:
        degree_stats = {"min": 0, "max": 0, "mean": 0.0, "median": 0.0, "stdev": 0.0, "25%": 0.0, "50%": 0.0,
                        "75%": 0.0}

    # Distribuição de graus (degree -> frequency)
    degree_counter = Counter(degrees)

    # Validação de consistência: para grafo não-direcionado soma dos graus = 2*|E|
    sum_degrees = sum(degrees)
    expected_sum = 2 * num_edges if not directed else None
    consistency = True
    consistency_message = ""
    if not directed:
        if sum_degrees != expected_sum:
            consistency = False
            consistency_message = (
                f"Soma dos graus ({sum_degrees}) != 2*|E| ({expected_sum})."
            )
            logger.warning(consistency_message)
        else:
            consistency_message = "Consistente: soma dos graus == 2*|E|."
    else:
        consistency_message = "Grafo dirigido: verificação de soma dos graus não aplicável."

    # Gravar degree_distribution.json (degree -> frequency)
    dist_path = out_dir / "degree_distribution.json"
    dist_list = [{"degree": int(d), "frequency": int(freq)} for d, freq in sorted(degree_counter.items())]
    dist_path.write_text(json.dumps(dist_list, ensure_ascii=False, indent=2), encoding="utf-8")

    # Gerar figura legível delegando para src.viz
    fig_path = out_dir / "degree_hist.png"
    try:
        plot_degree_distribution(degrees, degree_counter, fig_path)
    except Exception:
        logger.warning("Falha ao gerar %s", fig_path)

    # Preparar descrição em memória
    description = {
        "vertices": num_vertices,
        "edges": num_edges,
        "graph_type": graph_type,
        "degree_stats": degree_stats,
        "sum_degrees": sum_degrees,
        "consistency": consistency,
        "consistency_message": consistency_message,
    }

    # Salvar top hubs (20) em JSON (mantido como auxiliar)
    top_hubs = sorted(graph.all_degrees(), key=lambda x: x[1], reverse=True)[:20]
    hubs_path = out_dir / "top_hubs.json"
    hubs_data = [{"node": n, "degree": int(d)} for n, d in top_hubs]
    hubs_path.write_text(json.dumps(hubs_data, ensure_ascii=False, indent=2), encoding="utf-8")

    # Renderizar descrição como PNG
    desc_png = out_dir / "description.png"
    try:
        render_description(description, dist_list, hubs_data, desc_png)
    except Exception:
        logger.warning("Falha ao gerar %s", desc_png)

    logger.info("Descrição do dataset salva em: %s", out_dir)
    return description
