# Rede de Aeroportos do Brasil – Teoria dos Grafos

Projeto final da disciplina de Teoria dos Grafos.  
Implementação manual de **BFS, DFS, Dijkstra e Bellman-Ford** aplicados a uma
rede de aeroportos brasileiros (Parte 1).

---

## Estrutura do Projeto

```
projeto-grafos/
├── README.md
├── requirements.txt
├── data/
│   ├── aeroportos_data.csv          # fornecido pelo professor
│   ├── adjacencias_aeroportos.csv   # construído pelo grupo (Parte 1)
│   └── rotas.csv                    # construído pelo grupo (Parte 1)
├── out/                             # saídas geradas (.json / .html / .png / .csv)
│   └── .gitkeep
├── src/
│   ├── cli.py                       # ponto de entrada CLI (argparse)
│   ├── solve.py                     # orquestração e gravação de resultados
│   └── graphs/
│       ├── io.py                    # leitura e validação dos CSVs
│       ├── graph.py                 # estrutura: lista de adjacência
│       └── algorithms.py            # BFS, DFS, Dijkstra, Bellman-Ford
└── tests/
    ├── test_bfs.py
    ├── test_dfs.py
    ├── test_dijkstra.py
    └── test_bellman_ford.py
```

---

## Pré-requisitos

- **Python 3.11+**
- `pip` atualizado

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/claranevess/projeto-grafos
cd projeto-grafos

# 2. (Recomendado) Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows

# 3. Instale as dependências
pip install -r requirements.txt
```

---

## Como Executar

### Parte 1 – Rede de Aeroportos do Brasil

**BFS a partir de Recife:**

```bash
python -m src.cli \
  --dataset data/aeroportos_data.csv \
  --alg BFS \
  --source REC \
  --out ./out/
```

**Dijkstra – menor caminho de Recife até Porto Alegre:**

```bash
python -m src.cli \
  --dataset data/aeroportos_data.csv \
  --alg DIJKSTRA \
  --source REC \
  --target POA \
  --out ./out/
```

**DFS a partir de Manaus:**

```bash
python -m src.cli \
  --dataset data/aeroportos_data.csv \
  --alg DFS \
  --source MAO \
  --out ./out/
```

**Bellman-Ford – Manaus até São Paulo:**

```bash
python -m src.cli \
  --dataset data/aeroportos_data.csv \
  --alg BELLMAN-FORD \
  --source MAO \
  --target GRU \
  --out ./out/
```

### Ajuda completa

```bash
python -m src.cli --help
```

---

## Algoritmos disponíveis

| Flag           | Algoritmo                      | Requer `--target`?  |
| -------------- | ------------------------------ | ------------------- |
| `BFS`          | Busca em Largura               | Não (single-source) |
| `DFS`          | Busca em Profundidade          | Não (single-source) |
| `DIJKSTRA`     | Dijkstra (pesos ≥ 0)           | Opcional            |
| `BELLMAN-FORD` | Bellman-Ford (pesos negativos) | Opcional            |

> **Restrição:** nenhuma lib de algoritmos prontos é utilizada
> (sem NetworkX, igraph, etc.). Toda a lógica está em `src/graphs/algorithms.py`.

---

## Executar os Testes

Para garantir que todos os algoritmos estão funcionando corretamente, navegue até a pasta raiz do projeto e utilize o
comando abaixo:

```bash
cd projeto-grafos
python -m pytest tests/

---

## Saídas Geradas (pasta `out/`)

| Arquivo                 | Descrição                                         |
| ----------------------- | ------------------------------------------------- |
| `global.json`           | Ordem, tamanho e densidade do grafo completo      |
| `regioes.json`          | Métricas por região geográfica                    |
| `ego_aeroportos.csv`    | Ego-rede de cada aeroporto                        |
| `graus.csv`             | Grau de cada aeroporto                            |
| `distancias_rotas.csv`  | Custos e caminhos calculados                      |
| `arvore_rec_poa.html` / `arvore_mao_gru.html` | Visualizações interativas dos caminhos obrigatórias (REC → POA, MAO → GRU) |
| `grafo_interativo.html` | Grafo completo interativo (pyvis)                 |
| `parte2_report.json`    | Métricas de desempenho da Parte 2                 |

---

# Dataset Parte 2 — Marvel Movies

Fonte: https://www.kaggle.com/datasets/joebeachcapital/marvel-movies

Instruções:
- Preferência: use a CLI do `kaggle` para baixar e descompactar:

  ```bash
  kaggle datasets download -d joebeachcapital/marvel-movies -p data/dataset_parte2 --unzip
  ```

- Caso não tenha a CLI, baixe manualmente e posicione os arquivos em `data/dataset_parte2/`.
- O arquivo principal esperado para as próximas etapas será `marvel_movies.csv`.

Arquivos criados como stubs para testes do pipeline:
- `negative_edges.csv` — cabeçalho: `origin,destination,weight,tipo_conexao,justificativa`
- `negative_cycle.csv` — cabeçalho: `origin,destination,weight,tipo_conexao,justificativa`
 ---

## Descrição do dataset — Parte 2 (Marvel Movies)
Fonte: data/dataset_parte2/MARVEL.csv (carregado pelo pipeline Parte 2)
|V| (número de vértices): 30
|E| (número de arestas): 35
Tipo de grafo: não direcionado
Ponderado: sim (as arestas armazenam atributo de peso; no dataset principal as arestas possuem peso 1.0).
Distribuição de graus: lista de graus por nó em out/grausparte2.json e tabela degree→frequency em out/degree_distribution.json
Histograma / figura legível: out/degree_hist.png
Observação de consistência: soma dos graus = 70 = 2·|E| (consistente com grafo não-direcionado)

## Dependências

Listadas em `requirements.txt`:

pandas
matplotlib
pyvis
pytest

```

---

## Autores

- Julia Torres de Barros – `@JuliaTBarros`
- Maria Clara de Souza Almeida Neves – `@claranevess`
- Maria Cláudia Rodrigues Corrêa de Oliveira Andrade – `@Maria-ClaudiaA`
- Vinícius Bernardo da Silva – `@Vinib80`

---

## Licença

Uso acadêmico – Disciplina de Teoria dos Grafos.

```

```
