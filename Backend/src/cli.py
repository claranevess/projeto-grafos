"""
cli.py – Ponto de entrada da ferramenta de linha de comando.

Uso:
    python -m src.cli --help
    python -m src.cli --dataset data/aeroportos_data.csv --alg BFS --source REC --out ./out/
    python -m src.cli --dataset data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
"""

import os
import sys
import time
from pathlib import Path
from types import SimpleNamespace

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

ALGORITMOS_VALIDOS = {"BFS", "DFS", "DIJKSTRA", "BELLMAN-FORD"}


# ---------------------------------------------------------------------------
# Helpers de validação
# ---------------------------------------------------------------------------

def _validar_dataset(caminho):
    """Verifica se o caminho do dataset existe (arquivo ou diretório)."""
    if not os.path.exists(caminho):
        raise ValueError(f"Dataset não encontrado: '{caminho}'")
    return caminho


def _validar_alg(valor):
    """Normaliza e valida o nome do algoritmo."""
    normalizado = valor.upper()
    if normalizado not in ALGORITMOS_VALIDOS:
        raise ValueError(f"Algoritmo inválido: '{valor}'. Opções: {', '.join(sorted(ALGORITMOS_VALIDOS))}")
    return normalizado


def _validar_out(caminho):
    """Cria o diretório de saída se ainda não existir."""
    os.makedirs(caminho, exist_ok=True)
    return caminho


# ---------------------------------------------------------------------------
# Construção do parser
# ---------------------------------------------------------------------------

def parse_args(argv=None):
    """Parseador mínimo de argumentos (substitui argparse no núcleo).

    Suporta argumentos na forma `--key value` ou `--key=value`.
    """
    if argv is None:
        argv = sys.argv[1:]

    # ajuda
    if "-h" in argv or "--help" in argv:
        print(__doc__)
        sys.exit(0)

    kv = {}
    i = 0
    while i < len(argv):
        a = argv[i]
        if not a.startswith("--"):
            i += 1
            continue
        key = a[2:]
        if "=" in key:
            k, v = key.split("=", 1)
            kv[k] = v
            i += 1
            continue
        # valor no próximo token, se existir e não for outra flag
        if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            kv[key] = argv[i + 1]
            i += 2
        else:
            kv[key] = True
            i += 1

    # parâmetro obrigatório mínimo: dataset. '--alg' e '--source' são opcionais
    if "dataset" not in kv:
        print("Usage: --dataset PATH [--alg ALG --source NODE] [--target NODE] [--out DIR]")
        sys.exit(2)

    # aplicar validações e normalizações
    try:
        dataset = _validar_dataset(kv["dataset"])
        out = _validar_out(kv.get("out", "./out/"))

        # Se o usuário forneceu algoritmo, valida-se também 'alg' e 'source'
        alg = None
        source = None
        target = None
        if "alg" in kv:
            alg = _validar_alg(kv["alg"])
            if "source" not in kv:
                raise ValueError("Quando --alg é fornecido, --source é obrigatório.")
            source = kv["source"].strip().upper()
            target = kv.get("target")

    except Exception as exc:
        print(f"Argument error: {exc}", file=sys.stderr)
        sys.exit(2)

    return SimpleNamespace(dataset=dataset, alg=alg, source=source, target=target, out=out)


# ---------------------------------------------------------------------------
# Despachante de algoritmos
# ---------------------------------------------------------------------------

def _executar(args):
    """
    Carrega o grafo, gera métricas e despacha para o algoritmo escolhido.

    Os módulos de I/O e algoritmos são importados aqui para que o
    `--help` funcione mesmo com stubs ainda não implementados.
    """
    from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford
    from src.solve import salvar_metricas, calcular_tempo_execucao

    dataset_path = Path(args.dataset)
    print(f"[cli] Carregando dataset: {args.dataset}")
    # Roteamento determinístico: se o caminho contém o diretório
    # 'dataset_parte2' (qualquer posição na hierarquia), usamos sempre
    # `carregar_dataset_parte2`. Caso contrário preservamos o fluxo
    # legacy de carregamento de aeroportos (com fallback dentro de um
    # diretório para escolher o CSV apropriado).
    try:
        if any(part.lower() == "dataset_parte2" for part in dataset_path.parts):
            try:
                from src.graphs.io import carregar_dataset_parte2
            except Exception:
                carregar_dataset_parte2 = None

            if carregar_dataset_parte2 is None:
                raise RuntimeError("Loader de Parte 2 não disponível no módulo 'src.graphs.io'.")

            print("[cli] Dataset parece ser Parte 2 (dataset_parte2) — usando loader específico.")
            grafo = carregar_dataset_parte2(dataset_path)

        else:
            # Mantém o comportamento anterior para diretórios/arquivos não-Parte2
            if dataset_path.is_dir():
                # fallback: tentar escolher um CSV de aeroportos no diretório
                csvs = [p for p in dataset_path.iterdir() if p.is_file() and p.suffix.lower() == '.csv']
                try:
                    from graphs.io import carregar_grafo
                except Exception:
                    carregar_grafo = None

                if carregar_grafo is None:
                    raise RuntimeError("Loader legacy 'carregar_grafo' não disponível.")

                airports_csv = None
                for p in csvs:
                    if 'aeroport' in p.name.lower():
                        airports_csv = p
                        break
                if airports_csv is None and csvs:
                    airports_csv = sorted(csvs, key=lambda x: x.stat().st_size, reverse=True)[0]
                if airports_csv is None:
                    raise FileNotFoundError(f"Nenhum CSV válido encontrado em '{dataset_path}'")

                print(f"[cli] Usando '{airports_csv.name}' como arquivo de aeroportos (fallback).")
                grafo = carregar_grafo(airports_csv)

            else:
                # dataset_path é um arquivo qualquer — usar loader legacy
                from src.graphs.io import carregar_grafo
                grafo = carregar_grafo(args.dataset)
    except Exception as exc:
        print(f"[erro] Falha ao carregar dataset: {exc}", file=sys.stderr)
        sys.exit(2)

    # --- Métricas estruturais (sempre geradas ao carregar o grafo) -----------
    try:
        # Se detectamos explicitamente Parte 2 (arquivo MARVEL.csv ou
        # marvel_movies.csv) geramos a descrição específica do dataset;
        # caso contrário mantemos fluxo legacy de métricas para aeroportos.
        part2_indicator = False
        if dataset_path.is_dir():
            for p in dataset_path.iterdir():
                if p.is_file() and p.name in ("marvel_movies.csv", "MARVEL.csv", "marvel.csv"):
                    part2_indicator = True
                    break

        if part2_indicator:
            try:
                from src.graphs.io import save_dataset_description
                save_dataset_description(grafo, args.out)
                print(f"[cli] Descrição do dataset Parte 2 salva em '{args.out}'")
            except Exception as exc:
                print(f"[aviso] Falha ao gerar descrição Parte 2: {exc}", file=sys.stderr)
        else:
            salvar_metricas(grafo, args.out)
            print(f"[cli] Métricas salvas em '{args.out}' (global.png, regioes.png)")
        
        resultados = calcular_tempo_execucao()
        print(resultados)

    except Exception as exc:
        print(f"[aviso] Falha ao salvar métricas: {exc}", file=sys.stderr)

    # Se nenhum algoritmo foi solicitado, encerramos após gerar as métricas
    if args.alg is None:
        print("[cli] Nenhum algoritmo solicitado; operação de dataset concluída.")
        return

    # --- Despacha para o algoritmo -------------------------------------------
    print(f"[cli] Executando {args.alg} | origem={args.source} | destino={args.target}")
    inicio = time.perf_counter()

    # Validações básicas de existência dos nós solicitados
    if not grafo.has_node(args.source):
        print(f"[erro] Nó de origem '{args.source}' não encontrado no grafo.", file=sys.stderr)
        sys.exit(3)

    if args.target is not None and not grafo.has_node(args.target):
        print(f"[erro] Nó destino '{args.target}' não encontrado no grafo.", file=sys.stderr)
        sys.exit(3)

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

def main(argv=None):
    args = parse_args(argv)

    # Validação semântica extra: algoritmos de caminho precisam de --target
    if args.alg in {"DIJKSTRA", "BELLMAN-FORD"} and args.target is None:
        # Permitido (single-source), mas avisamos ao usuário
        pass  # O aviso é emitido dentro de _executar

    _executar(args)


if __name__ == "__main__":
    main()
