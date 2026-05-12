"""
cli.py – Ponto de entrada da ferramenta de linha de comando.

Uso:
    python -m src.cli --help
    python -m src.cli --dataset data/aeroportos_data.csv --alg BFS --source REC --out ./out/
    python -m src.cli --dataset data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
"""

import argparse
import sys
import os
import time


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

ALGORITMOS_VALIDOS = {"BFS", "DFS", "DIJKSTRA", "BELLMAN-FORD"}


# ---------------------------------------------------------------------------
# Helpers de validação
# ---------------------------------------------------------------------------

def _validar_dataset(caminho: str) -> str:
    """Verifica se o caminho do dataset existe (arquivo ou diretório)."""
    if not os.path.exists(caminho):
        raise argparse.ArgumentTypeError(
            f"Dataset não encontrado: '{caminho}'"
        )
    return caminho


def _validar_alg(valor: str) -> str:
    """Normaliza e valida o nome do algoritmo."""
    normalizado = valor.upper()
    if normalizado not in ALGORITMOS_VALIDOS:
        raise argparse.ArgumentTypeError(
            f"Algoritmo inválido: '{valor}'. "
            f"Opções: {', '.join(sorted(ALGORITMOS_VALIDOS))}"
        )
    return normalizado


def _validar_out(caminho: str) -> str:
    """Cria o diretório de saída se ainda não existir."""
    os.makedirs(caminho, exist_ok=True)
    return caminho


# ---------------------------------------------------------------------------
# Construção do parser
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="src.cli",
        description=(
            "Rede de Aeroportos do Brasil – Teoria dos Grafos\n"
            "Implementações próprias de BFS, DFS, Dijkstra e Bellman-Ford."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Exemplos:\n"
            "  python -m src.cli --dataset data/aeroportos_data.csv "
            "--alg BFS --source REC --out ./out/\n"
            "  python -m src.cli --dataset data/aeroportos_data.csv "
            "--alg DIJKSTRA --source REC --target POA --out ./out/\n"
            "  python -m src.cli --dataset data/dataset_parte2/ "
            "--alg DIJKSTRA --source A --target B --out ./out/"
        ),
    )

    # --- Argumentos obrigatórios ---
    parser.add_argument(
        "--dataset",
        required=True,
        type=_validar_dataset,
        metavar="CAMINHO",
        help="Caminho para o arquivo CSV ou diretório de dados.",
    )
    parser.add_argument(
        "--alg",
        required=True,
        type=_validar_alg,
        metavar="ALGORITMO",
        help=f"Algoritmo a executar. Opções: {', '.join(sorted(ALGORITMOS_VALIDOS))}.",
    )
    parser.add_argument(
        "--source",
        required=True,
        metavar="ORIGEM",
        help="Código IATA (ou ID) do nó de origem (ex.: REC, GRU).",
    )

    # --- Argumentos opcionais ---
    parser.add_argument(
        "--target",
        default=None,
        metavar="DESTINO",
        help=(
            "Código IATA (ou ID) do nó de destino. "
            "Obrigatório para DIJKSTRA e BELLMAN-FORD quando se deseja "
            "um caminho ponto-a-ponto."
        ),
    )
    parser.add_argument(
        "--out",
        default="./out/",
        type=_validar_out,
        metavar="DIR_SAIDA",
        help="Diretório onde os arquivos de saída serão gravados (padrão: ./out/).",
    )

    return parser


# ---------------------------------------------------------------------------
# Despachante de algoritmos
# ---------------------------------------------------------------------------

def _executar(args: argparse.Namespace) -> None:
    """
    Carrega o grafo, gera métricas e despacha para o algoritmo escolhido.

    Os módulos de I/O e algoritmos são importados aqui para que o
    `--help` funcione mesmo com stubs ainda não implementados.
    """
    from src.graphs.io import carregar_grafo
    from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford
    from src.solve import salvar_metricas

    print(f"[cli] Carregando dataset: {args.dataset}")
    grafo = carregar_grafo(args.dataset)

    # --- Métricas estruturais (sempre geradas ao carregar o grafo) -----------
    salvar_metricas(grafo, args.out)
    print(f"[cli] Métricas salvas em '{args.out}' (global.json, regioes.json)")

    # --- Despacha para o algoritmo -------------------------------------------
    print(f"[cli] Executando {args.alg} | origem={args.source} | destino={args.target}")
    inicio = time.perf_counter()

    if args.alg == "BFS":
        resultado = bfs(grafo, args.source)

    elif args.alg == "DFS":
        resultado = dfs(grafo, args.source)

    elif args.alg == "DIJKSTRA":
        if args.target is None:
            print(
                "[aviso] --target não informado: calculando distâncias "
                "de single-source para todos os nós.",
                file=sys.stderr,
            )
        resultado = dijkstra(grafo, args.source, args.target)

    elif args.alg == "BELLMAN-FORD":
        if args.target is None:
            print(
                "[aviso] --target não informado: calculando distâncias "
                "de single-source para todos os nós.",
                file=sys.stderr,
            )
        resultado = bellman_ford(grafo, args.source, args.target)

    else:
        print(f"[erro] Algoritmo desconhecido: {args.alg}", file=sys.stderr)
        sys.exit(1)

    elapsed = time.perf_counter() - inicio
    print(f"[cli] Concluído em {elapsed:.4f}s")
    print(f"[cli] Resultado: {resultado}")


# ---------------------------------------------------------------------------
# Ponto de entrada
# ---------------------------------------------------------------------------

def main(argv=None) -> None:
    parser = _build_parser()
    args = parser.parse_args(argv)

    # Validação semântica extra: algoritmos de caminho precisam de --target
    if args.alg in {"DIJKSTRA", "BELLMAN-FORD"} and args.target is None:
        # Permitido (single-source), mas avisamos ao usuário
        pass  # O aviso é emitido dentro de _executar

    _executar(args)


if __name__ == "__main__":
    main()