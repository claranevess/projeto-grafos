from pydantic import BaseModel


class MarvelMovieSchema(BaseModel):
    movie_id: int
    title: str
    year: int
    category: str
    budget_million: float
    worldwide_gross_million: float
    roi_percent: float
    degree: int
    is_hub: bool = False


class MarvelEdgeSchema(BaseModel):
    source: int
    target: int
    connection_type: str
    weight: float


class MarvelGraphSchema(BaseModel):
    movies: list[MarvelMovieSchema]
    edges: list[MarvelEdgeSchema]
    order: int
    size: int


class MarvelAlgorithmRequest(BaseModel):
    source: int
    target: int | None = None


class MarvelBfsResult(BaseModel):
    algorithm: str = "BFS"
    source: int
    execution_time_ms: float
    visited_order: list[int]
    layers: dict[str, list[int]]


class MarvelDfsResult(BaseModel):
    algorithm: str = "DFS"
    source: int
    execution_time_ms: float
    visited_order: list[int]
    has_cycle: bool
    edge_types: dict[str, str]


class MarvelPathResult(BaseModel):
    algorithm: str
    source: int
    target: int | None = None
    cost: float | None = None
    path: list[int]
    has_negative_cycle: bool = False
    execution_time_ms: float
    reachable: bool