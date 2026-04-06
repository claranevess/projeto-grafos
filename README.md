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
|----------------|--------------------------------|---------------------|
| `BFS`          | Busca em Largura               | Não (single-source) |
| `DFS`          | Busca em Profundidade          | Não (single-source) |
| `DIJKSTRA`     | Dijkstra (pesos ≥ 0)           | Opcional            |
| `BELLMAN-FORD` | Bellman-Ford (pesos negativos) | Opcional            |

> **Restrição:** nenhuma lib de algoritmos prontos é utilizada
> (sem NetworkX, igraph, etc.). Toda a lógica está em `src/graphs/algorithms.py`.

---

## Executar os Testes

```bash
pytest tests/ -v
```

---

## Saídas Geradas (pasta `out/`)

| Arquivo                 | Descrição                                         |
|-------------------------|---------------------------------------------------|
| `global.json`           | Ordem, tamanho e densidade do grafo completo      |
| `regioes.json`          | Métricas por região geográfica                    |
| `ego_aeroportos.csv`    | Ego-rede de cada aeroporto                        |
| `graus.csv`             | Grau de cada aeroporto                            |
| `distancias_rotas.csv`  | Custos e caminhos calculados                      |
| `arvore_percurso.html`  | Visualização interativa dos caminhos obrigatórios |
| `grafo_interativo.html` | Grafo completo interativo (pyvis)                 |
| `parte2_report.json`    | Métricas de desempenho da Parte 2                 |

---

## Dependências

Listadas em `requirements.txt`:

```
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