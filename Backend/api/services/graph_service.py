import csv
import functools

from Backend.api.config import settings
from Backend.api.schemas.graph import EdgeSchema, GraphSchema, NodeSchema

# Coordenadas geográficas reais de cada aeroporto (lat, lon)
# Fonte: OpenFlights / ANAC — usadas pelo mapa D3 no frontend
IATA_COORDS: dict[str, tuple[float, float]] = {
    "REC": (-8.1264, -34.9236),
    "SSA": (-12.9086, -38.3225),
    "FOR": (-3.7763, -38.5326),
    "NAT": (-5.7681, -35.3761),
    "JPA": (-7.1458, -34.9502),
    "THE": (-5.0598, -42.8235),
    "GRU": (-23.4356, -46.4731),
    "CGH": (-23.6261, -46.6566),
    "GIG": (-22.8099, -43.2505),
    "CNF": (-19.6244, -43.9718),
    "VIX": (-20.2581, -40.2861),
    "BSB": (-15.8711, -47.9186),
    "GYN": (-16.6320, -49.2205),
    "CWB": (-25.5285, -49.1758),
    "FLN": (-27.6706, -48.5525),
    "POA": (-29.9944, -51.1713),
    "MAO": (-3.0386, -60.0497),
    "BEL": (-1.3792, -48.4761),
    "PVH": (-8.7093, -63.9024),
    "RBR": (-9.8697, -67.8981),
}

# Aeroportos com grau >= HUB_THRESHOLD são marcados como hubs nacionais
HUB_THRESHOLD = 5


@functools.lru_cache(maxsize=1)
def _load_ego_density() -> dict[str, float]:
    result: dict[str, float] = {}
    try:
        with open(settings.ego_csv, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                result[row["aeroporto"]] = float(row["densidade_ego"])
    except FileNotFoundError:
        pass
    return result


@functools.lru_cache(maxsize=1)
def _load_graph():
    from Backend.src.graphs.io import carregar_grafo
    airports_path = settings.data_dir / settings.airports_csv
    return carregar_grafo(str(airports_path))


def get_graph():
    return _load_graph()


def get_graph_schema() -> GraphSchema:
    graph = get_graph()
    ego = _load_ego_density()

    nodes = []
    for iata in graph.iter_nodes():
        nd = graph.get_node(iata)
        degree = graph.degree(iata)
        lat, lon = IATA_COORDS.get(iata, (None, None))
        nodes.append(NodeSchema(
            iata=iata,
            city=nd.cidade,
            region=nd.regiao,
            degree=degree,
            lat=lat,
            lon=lon,
            is_hub=degree >= HUB_THRESHOLD,
            ego_density=ego.get(iata),
        ))

    edges = []
    for origem, edge in graph.iter_edges():
        edges.append(EdgeSchema(
            source=origem,
            target=edge.destino,
            weight=edge.peso,
            connection_type=edge.tipo_conexao,
            justification=edge.justificativa,
        ))

    return GraphSchema(
        nodes=sorted(nodes, key=lambda n: n.iata),
        edges=edges,
        order=graph.order(),
        size=graph.size(),
    )


def get_airports_list() -> list[NodeSchema]:
    graph = get_graph()
    ego = _load_ego_density()
    airports = []
    for iata in graph.iter_nodes():
        nd = graph.get_node(iata)
        degree = graph.degree(iata)
        lat, lon = IATA_COORDS.get(iata, (None, None))
        airports.append(NodeSchema(
            iata=iata,
            city=nd.cidade,
            region=nd.regiao,
            degree=degree,
            lat=lat,
            lon=lon,
            is_hub=degree >= HUB_THRESHOLD,
            ego_density=ego.get(iata),
        ))
    return sorted(airports, key=lambda a: a.iata)
