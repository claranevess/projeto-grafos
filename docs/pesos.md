# Metodologia de Pesos das Arestas — Rede de Aeroportos do Brasil

## Visão Geral

O modelo de pesos adotado é **híbrido**, combinando dois critérios independentes que refletem a realidade operacional da aviação civil brasileira: a penalidade por mudança de região geográfica e a penalidade pela ausência de hubs aeroportuários.

---

## Fórmula

```
peso = 1.0 + penalidade_regiao + penalidade_hub
```

---

## Componentes

### Base (`1.0`)
Valor mínimo atribuído a qualquer aresta. Representa o custo mínimo intrínseco de qualquer conexão aérea (combustível, tempo de voo, operação).

---

### `penalidade_regiao`

| Condição | Valor |
|---|---|
| Conexão **intra-regional** (mesma região) | `0.0` |
| Conexão **inter-regional** (regiões diferentes) | `1.0` |

**Justificativa:** Voos entre regiões distintas do Brasil envolvem distâncias maiores, mais tempo de voo, maior consumo de combustível e, frequentemente, necessidade de escala. A penalidade de 1.0 reflete esse custo adicional de forma normalizada.

---

### `penalidade_hub`

| Condição | Valor |
|---|---|
| Pelo menos um aeroporto é **hub** | `0.0` |
| Nenhum dos aeroportos é hub | `1.0` |

**Hubs definidos:** `GRU`, `BSB`, `GIG`, `REC`, `MAO`, `FOR`, `BEL`

**Critério de classificação como hub:**
- Volume de passageiros acima da média nacional
- Localização estratégica (capital federal, capitais de grande porte)
- Presença de múltiplas companhias aéreas e voos internacionais
- Função de redistribuição de tráfego para aeroportos menores

**Justificativa:** Aeroportos hub possuem maior infraestrutura, maior frequência de voos e menor tempo de espera. Uma conexão envolvendo um hub é operacionalmente mais eficiente (menor custo logístico) do que uma conexão entre dois aeroportos secundários, que normalmente exige voos com menor frequência e maior custo por assento.

---

## Tabela de Pesos Resultantes

| Cenário | `penalidade_regiao` | `penalidade_hub` | **Peso Final** |
|---|---|---|---|
| Intra-regional, com hub | 0.0 | 0.0 | **1.0** |
| Intra-regional, sem hub | 0.0 | 1.0 | **2.0** |
| Inter-regional, com hub | 1.0 | 0.0 | **2.0** |
| Inter-regional, sem hub | 1.0 | 1.0 | **3.0** |

---

## Exemplos Concretos

| Aresta | Tipo | Peso | Explicação |
|---|---|---|---|
| `REC → SSA` | regional | 1.0 | Mesma região (Nordeste), REC é hub |
| `NAT → JPA` | regional | 2.0 | Mesma região (Nordeste), nenhum é hub |
| `GRU → BSB` | hub | 2.0 | Regiões diferentes, ambos são hubs |
| `GYN → CNF` | inter-regional | 3.0 | Regiões diferentes, nenhum é hub |

---

## Garantias do Modelo

1. **Não-negatividade:** Todos os pesos são ≥ 1.0, compatíveis com o algoritmo de Dijkstra utilizado na Parte 1.
2. **Conectividade:** O grafo resultante é conectado (verificado via BFS a partir de REC, alcançando todos os 20 aeroportos).
3. **Intra-regional em todas as regiões:** Existem arestas `tipo_conexao = "regional"` dentro de cada uma das 5 regiões brasileiras.
4. **Inter-regional:** Existem 45 arestas inter-regionais cobrindo todos os pares de regiões.
5. **Não-trivialidade:** O grafo possui 72 arestas para 20 nós (densidade ≈ 0.379), evitando tanto a esparsidade extrema quanto a completude.

---

## Distribuição das Arestas

| Tipo | Quantidade |
|---|---|
| Intra-regional (regional) | 27 |
| Inter-regional (hub / inter-regional) | 45 |
| **Total** | **72** |

| Região | Arestas intra-regionais |
|---|---|
| Nordeste | 10 |
| Sudeste | 8 |
| Sul | 3 |
| Norte | 5 |
| Centro-Oeste | 1 |

*Nota: Centro-Oeste possui apenas 2 aeroportos (BSB e GYN), resultando em apenas 1 aresta intra-regional possível. A conectividade da região é complementada por suas extensas ligações inter-regionais via hub BSB.*

---

## Limitações e Decisões de Design

- **Pesos discretos (1, 2, 3):** A escolha de valores inteiros facilita a verificação manual e a depuração dos algoritmos. Em um modelo real, seriam usadas distâncias geográficas em km ou tempo médio de voo.
- **CGH × GRU:** Ambos são aeroportos de São Paulo. Modelados como nós distintos com aresta de peso 1.0, representando a conexão operacional entre os terminais.
- **Pesos negativos:** Ausentes na Parte 1 por requisito do enunciado (compatibilidade com Dijkstra). Pesos negativos serão introduzidos apenas na Parte 2, com Bellman-Ford.