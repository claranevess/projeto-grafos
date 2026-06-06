from Backend.api.schemas.metrics import GlobalMetrics, HubInfo, MetricsResponse, RegionMetrics
from Backend.src.solve import calcular_metricas


def get_metrics(graph) -> MetricsResponse:
    global_m, regional_m = calcular_metricas(graph)

    top_hubs = sorted(graph.all_degrees(), key=lambda x: x[1], reverse=True)[:5]
    hub_infos = [
        HubInfo(iata=iata, city=graph.get_node(iata).cidade, degree=degree)
        for iata, degree in top_hubs
    ]

    return MetricsResponse(
        global_metrics=GlobalMetrics(
            order=global_m["ordem"],
            size=global_m["tamanho"],
            density=round(global_m["densidade"], 6),
            top_hubs=hub_infos,
        ),
        regions=[
            RegionMetrics(
                region=r["regiao"],
                order=r["ordem"],
                size=r["tamanho"],
                density=round(r["densidade"], 6),
            )
            for r in regional_m
        ],
    )
