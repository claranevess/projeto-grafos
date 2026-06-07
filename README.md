# Rede de Aeroportos do Brasil – Teoria dos Grafos

Projeto final interdisciplinar das disciplinas de **Teoria dos Grafos** e **Análise e Visualização de Dados (AVD)**.

Implementação manual de **BFS, DFS, Dijkstra e Bellman-Ford** aplicados a uma rede de aeroportos brasileiros (Parte 1) e
a um grafo de filmes do MCU Marvel (Parte 2).

---

## Estrutura do Projeto

```
projeto-grafos/
├── README.md
├── requirements.txt              # dependências Python
│
├── Backend/
│   ├── api/                      # API REST (FastAPI)
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── data/
│   │   ├── aeroportos_data.csv          # fornecido pelo professor
│   │   ├── adjacencias_aeroportos.csv   # construído pelo grupo (Parte 1)
│   │   ├── rotas.csv                    # pares de rotas (Parte 1)
│   │   └── dataset_parte2/              # dataset Marvel Movies (Parte 2)
│   └── src/
│       ├── cli.py                # ponto de entrada CLI (argparse)
│       ├── solve.py              # orquestração e gravação de resultados
│       └── graphs/
│           ├── io.py             # leitura e validação dos CSVs
│           ├── graph.py          # estrutura: lista de adjacência
│           └── algorithms.py     # BFS, DFS, Dijkstra, Bellman-Ford
│
├── Frontend/                     # SPA React + Vite
│   ├── src/
│   │   ├── pages/                # AirportMapPage (/) e MarvelPage (/marvel)
│   │   ├── hooks/
│   │   ├── store/                # Zustand slices
│   │   └── lib/
│   ├── aeroportos/               # componentes D3 da Parte 1
│   ├── marvel/                   # componentes Recharts da Parte 2
│   ├── shared/                   # TopBar, BridgeAlert, StatusIndicator
│   └── package.json
│
├── out/                          # saídas geradas
│   ├── metricas/                 # JSONs de métricas estruturais
│   ├── tabelas/                  # CSVs (graus, ego, distâncias)
│   ├── arvores/                  # PNGs das árvores de percurso
│   ├── visualizacoes/            # gráficos analíticos PNG + HTML
│   ├── grafo/                    # grafo_interativo.html
│   └── parte2/                   # relatório e métricas da Parte 2
│
└── tests/
    ├── test_bfs.py
    ├── test_dfs.py
    ├── test_dijkstra.py
    └── test_bellman_ford.py
```

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Python     | 3.11+         |
| Node.js    | 18+           |
| npm        | 9+            |

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/claranevess/projeto-grafos
cd projeto-grafos
```

### 2. Backend (Python)

```bash
# Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux / macOS
.venv\Scripts\activate           # Windows

# Instale as dependências
pip install -r requirements.txt
```

### 3. Frontend (Node.js)

```bash
cd Frontend
npm install
```

---

## Como Executar

### Backend — API REST (FastAPI)

Inicie o servidor a partir da **raiz do projeto**:

```bash
uvicorn Backend.api.main:app --reload --port 8000
```

A API ficará disponível em `http://localhost:8000`.  
Documentação interativa (Swagger): `http://localhost:8000/docs`.

---

### Frontend — Interface React (Vite)

Em outro terminal, dentro da pasta `Frontend/`:

```bash
cd Frontend
npm run dev
```

A aplicação abrirá em `http://localhost:5173`.

> O Vite já está configurado para fazer proxy de `/api` para `localhost:8000`,
> portanto o Backend precisa estar rodando antes de abrir o Frontend.

| Rota      | Conteúdo                                        |
|-----------|-------------------------------------------------|
| `/`       | Mapa interativo de aeroportos — Parte 1         |
| `/marvel` | Grafo de filmes Marvel + gráficos AVD — Parte 2 |

---

### CLI Python (geração de saídas estáticas)

Os arquivos da pasta `out/` também podem ser regenerados via CLI, sem precisar do Frontend:

**BFS a partir de Recife:**

```bash
python -m Backend.src.cli --dataset Backend/data/aeroportos_data.csv --alg BFS --source REC --out ./out/
```

**Dijkstra — Recife → Porto Alegre:**

```bash
python -m Backend.src.cli --dataset Backend/data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
```

**DFS a partir de Manaus:**

```bash
python -m Backend.src.cli --dataset Backend/data/aeroportos_data.csv --alg DFS --source MAO --out ./out/
```

**Bellman-Ford — Manaus → São Paulo:**

```bash
python -m Backend.src.cli --dataset Backend/data/aeroportos_data.csv --alg BELLMAN-FORD --source MAO --target GRU --out ./out/
```

---

## Algoritmos Implementados

| Flag           | Algoritmo                                                        | Requer `--target`?  |
|----------------|------------------------------------------------------------------|---------------------|
| `BFS`          | Busca em Largura                                                 | Não (single-source) |
| `DFS`          | Busca em Profundidade                                            | Não (single-source) |
| `DIJKSTRA`     | Dijkstra (pesos ≥ 0)                                             | Opcional            |
| `BELLMAN-FORD` | Bellman-Ford (suporta pesos negativos, detecta ciclos negativos) | Opcional            |

> **Restrição do enunciado:** nenhuma lib de algoritmos prontos é utilizada
> (sem NetworkX, igraph, etc.). Toda a lógica está em `Backend/src/graphs/algorithms.py`.

> **Nota sobre a interface da Parte 1:** a UI expõe apenas BFS, DFS e Dijkstra. Bellman-Ford
> está disponível via CLI e é utilizado na Parte 2, onde existem pesos negativos — seu uso
> na Parte 1 não se aplica pois o grafo de aeroportos não possui arestas com peso negativo.

---

## Navegação entre Partes

A transição da Parte 1 para a Parte 2 é feita de forma narrativa pela interface:

1. Na rota `/`, selecione **Dijkstra** como algoritmo
2. Defina **GIG** (Aeroporto Internacional do Galeão) como destino
3. Execute a rota — após a animação do avião concluir, um modal de alerta será exibido
4. Clique em **"Clique aqui para saber mais"** para ser redirecionado à Parte 2 (`/marvel`)

---

## Testes

```bash
python -m pytest tests/ -v
```

| Arquivo                | O que testa                                                          |
|------------------------|----------------------------------------------------------------------|
| `test_bfs.py`          | Níveis corretos, raiz inválida, grafo desconectado                   |
| `test_dfs.py`          | Detecção de ciclo, classificação de arestas                          |
| `test_dijkstra.py`     | Caminhos com pesos ≥ 0; rejeita peso negativo                        |
| `test_bellman_ford.py` | Peso negativo sem ciclo → distâncias corretas; ciclo negativo → flag |

---

## Saídas Geradas (`out/`)

| Pasta            | Arquivo                    | Descrição                                    |
|------------------|----------------------------|----------------------------------------------|
| `metricas/`      | `global.json`              | Ordem, tamanho e densidade do grafo completo |
| `metricas/`      | `regioes.json`             | Métricas por região geográfica               |
| `metricas/`      | `ego_aeroportos.json`      | Ego-rede de cada aeroporto                   |
| `metricas/`      | `graus.json`               | Grau de cada aeroporto                       |
| `metricas/`      | `degree_distribution.json` | Distribuição de graus                        |
| `metricas/`      | `top_hubs.json`            | Top aeroportos por grau                      |
| `tabelas/`       | `graus.csv`                | Grau de cada aeroporto (CSV)                 |
| `tabelas/`       | `ego_aeroportos.csv`       | Ego-rede por aeroporto (CSV)                 |
| `tabelas/`       | `distancias_rotas.csv`     | Custos e caminhos calculados pelo Dijkstra   |
| `arvores/`       | `arvore_rec_poa.png`       | Árvore de percurso REC → POA                 |
| `arvores/`       | `arvore_mao_gru.png`       | Árvore de percurso MAO → GRU                 |
| `visualizacoes/` | `viz_1_*`                  | Histograma de distribuição de graus          |
| `visualizacoes/` | `viz_2_*`                  | Scatter: grau × densidade ego                |
| `visualizacoes/` | `viz_3_*`                  | Ranking de hubs por grau                     |
| `visualizacoes/` | `viz_4_*`                  | Comparação de métricas por região            |
| `visualizacoes/` | `viz_5_mapa_grafo.png`     | Mapa do grafo sobre o Brasil                 |
| `grafo/`         | `grafo_interativo.html`    | Grafo completo interativo (pyvis)            |
| `parte2/`        | `parte2_report.json`       | Métricas de desempenho da Parte 2            |
| `parte2/`        | `description.png`          | Descrição visual do dataset Marvel           |

---

## Dataset Parte 2 — Marvel Movies

Fonte: [Kaggle — Marvel Movies](https://www.kaggle.com/datasets/joebeachcapital/marvel-movies)

O arquivo `MARVEL.csv` já está incluído em `Backend/data/dataset_parte2/`.  
Caso queira baixar a versão mais recente via CLI do Kaggle:

```bash
kaggle datasets download -d joebeachcapital/marvel-movies \
  -p Backend/data/dataset_parte2 --unzip
```

### Modelagem das arestas (conexões entre filmes)

O `MARVEL.csv` traz dados ricos de bilheteria/orçamento/desempenho (`category`,
`budget`, `worldwide gross ($m)`, `% budget recovered`, `year` etc.), mas **não**
possui nenhuma coluna de elenco/personagens — por isso o modelo de arestas
"personagens compartilhados" (cogitado inicialmente) não é viável com este
dataset, e foi descartado.

Conectamos os filmes (arestas não-direcionadas, peso uniforme `1.0`) por dois
critérios reais e diretamente derivados do CSV — **"Model A+"**:

1. **Mesma categoria/franquia** (`category`) — ex.: todos os filmes do "Iron
   Man" se conectam entre si.
2. **Mesmo ano de lançamento** (`year`) — filmes lançados no mesmo ano
   competiram pela mesma janela de bilheteria/atenção do público, uma relação
   real e justificável sem precisar inventar nenhum dado novo.

Cada aresta registra o motivo da conexão em `tipo_conexao`/`justificativa`
(`"same category: <franquia>"` ou `"same release year: <ano>"`).

**Por que somar o critério de ano:** usando só `category` ("Model A" original),
o grafo resultante (30 nós) tinha apenas **35 arestas**, ficava **fragmentado em
10 componentes conexos isolados** (ex.: "Thor" nunca se conectava a "Iron Man")
e era menor/mais esparso que o grafo da Parte 1 (20 nós / 73 arestas) — o que
tornava a comparação de algoritmos pouco significativa (tudo roda em
microssegundos, BFS/Dijkstra nunca atravessam fronteiras de cluster). Somando
o critério de ano, o grafo passa a ter **56 arestas** e **um único componente
conexo** (sem nós isolados), aproximando-o da densidade da Parte 1 e permitindo
que os quatro algoritmos (BFS, DFS, Dijkstra, Bellman-Ford) percorram o grafo
inteiro de ponta a ponta.

---

## Autores

- Julia Torres de Barros – [@JuliaTBarros](https://github.com/JuliaTBarros)
- Maria Clara de Souza Almeida Neves – [@claranevess](https://github.com/claranevess)
- Maria Cláudia Rodrigues Corrêa de Oliveira Andrade – [@Maria-ClaudiaA](https://github.com/Maria-ClaudiaA)
- Vinícius Bernardo da Silva – [@Vinib80](https://github.com/Vinib80)

---

## Licença

Uso acadêmico — Disciplinas de Teoria dos Grafos e Análise e Visualização de Dados (AVD).