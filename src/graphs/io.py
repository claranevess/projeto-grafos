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

import csv
import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from src.graphs.graph import Graph

# ---------------------------------------------------------------------------
# Configuração de logging
# ---------------------------------------------------------------------------

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

# Colunas obrigatórias no CSV de aeroportos
_REQUIRED_COLUMNS: frozenset[str] = frozenset({"iata", "cidade", "regiao"})

# Regiões válidas do Brasil (para validação)
_VALID_REGIONS: frozenset[str] = frozenset(
    {"Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"}
)


# ---------------------------------------------------------------------------
# Funções auxiliares de validação
# ---------------------------------------------------------------------------

def _validate_columns(df: pd.DataFrame, filepath: Path) -> None:
    """
    Verifica se o DataFrame possui todas as colunas obrigatórias.
    Levanta ValueError com mensagem descritiva caso alguma esteja ausente.
    """
    present = frozenset(df.columns.str.strip().str.lower())
    missing = _REQUIRED_COLUMNS - present

    if missing:
        raise ValueError(
            f"Colunas ausentes em '{filepath.name}': {sorted(missing)}. "
            f"Colunas encontradas: {sorted(present)}."
        )


def _validate_row(row: pd.Series, line_number: int) -> Optional[str]:
    """
    Valida uma linha individual do CSV.

    Retorna uma string de aviso se houver problema (linha ignorada),
    ou None se a linha for válida.
    """
    iata: str = str(row["iata"]).strip().upper()
    cidade: str = str(row["cidade"]).strip()
    regiao: str = str(row["regiao"]).strip()

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

def load_airports(filepath: str | Path, encoding: str = "utf-8") -> Graph:
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

    # --- Leitura via pandas ---------------------------------------------------
    df = pd.read_csv(filepath, encoding=encoding, dtype=str)

    # Normalizar nomes de colunas (strip + lowercase) para robustez
    df.columns = df.columns.str.strip().str.lower()

    _validate_columns(df, filepath)

    # --- Popular o grafo ------------------------------------------------------
    graph = Graph()
    skipped = 0
    duplicates = 0

    for line_number, (_, row) in enumerate(df.iterrows(), start=2):
        # Linha 1 é o cabeçalho; dados começam na linha 2
        warning = _validate_row(row, line_number)

        if warning:
            logger.warning(warning)
            skipped += 1
            continue

        iata: str = str(row["iata"]).strip().upper()
        cidade: str = str(row["cidade"]).strip()
        regiao: str = str(row["regiao"]).strip()

        if graph.has_node(iata):
            logger.warning(
                "[Linha %d] IATA '%s' duplicado — mantendo o primeiro registro.",
                line_number,
                iata,
            )
            duplicates += 1
            continue

        graph.add_node(iata=iata, cidade=cidade, regiao=regiao)

    # --- Relatório de carregamento --------------------------------------------
    total_valid = graph.order()
    total_read = len(df)

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

def load_edges(graph: Graph, filepath: str | Path, encoding: str = "utf-8") -> int:
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

    _EDGE_COLUMNS: frozenset[str] = frozenset(
        {"origem", "destino", "tipo_conexao", "justificativa", "peso"}
    )

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
            origem = row.get("origem", "").strip().upper()
            destino = row.get("destino", "").strip().upper()
            tipo = row.get("tipo_conexao", "").strip()
            justificativa = row.get("justificativa", "").strip()

            try:
                peso = float(row.get("peso", "1.0").strip())
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

def carregar_grafo(dataset_path: str | Path) -> Graph:
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
