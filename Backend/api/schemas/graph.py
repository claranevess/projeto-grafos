from pydantic import BaseModel


class NodeSchema(BaseModel):
    iata: str
    city: str
    region: str
    degree: int
    lat: float | None = None
    lon: float | None = None
    is_hub: bool = False
    ego_density: float | None = None


class EdgeSchema(BaseModel):
    source: str
    target: str
    weight: float
    connection_type: str
    justification: str


class GraphSchema(BaseModel):
    nodes: list[NodeSchema]
    edges: list[EdgeSchema]
    order: int
    size: int
