from pydantic import BaseModel


class HubInfo(BaseModel):
    iata: str
    city: str
    degree: int


class GlobalMetrics(BaseModel):
    order: int
    size: int
    density: float
    top_hubs: list[HubInfo]


class RegionMetrics(BaseModel):
    region: str
    order: int
    size: int
    density: float


class MetricsResponse(BaseModel):
    global_metrics: GlobalMetrics
    regions: list[RegionMetrics]
