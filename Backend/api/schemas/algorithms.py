from pydantic import BaseModel


class AlgorithmRequest(BaseModel):
    source: str
    target: str | None = None


class BfsResult(BaseModel):
    algorithm: str = "BFS"
    source: str
    execution_time_ms: float
    visited_order: list[str]
    layers: dict[str, list[str]]


class DfsResult(BaseModel):
    algorithm: str = "DFS"
    source: str
    execution_time_ms: float
    visited_order: list[str]
    has_cycle: bool
    edge_types: dict[str, str]


class PathResult(BaseModel):
    algorithm: str
    source: str
    target: str
    cost: float | None = None
    path: list[str]
    has_negative_cycle: bool = False
    execution_time_ms: float
    reachable: bool
