from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from Backend.api.routers import algorithms as alg_router
from Backend.api.routers import graph as graph_router
from Backend.api.routers import marvel as marvel_router
from Backend.api.routers import metrics as metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pré-carrega e cacheia os grafos na inicialização do servidor
    from Backend.api.services.graph_service import get_graph as get_airports_graph
    from Backend.api.services.marvel_service import get_graph as get_marvel_graph
    get_airports_graph()
    get_marvel_graph()
    yield


app = FastAPI(
    title="Grafos API — Rede de Aeroportos",
    version="1.0.0",
    description=(
        "API REST para o Projeto Final de Teoria dos Grafos. "
        "Parte 1: Rede Interativa de Aeroportos do Brasil — "
        "BFS, DFS, Dijkstra e Bellman-Ford."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router.router, prefix="/api")
app.include_router(alg_router.router, prefix="/api")
app.include_router(marvel_router.router, prefix="/api")
app.include_router(metrics_router.router, prefix="/api")

# Serve analytics charts
out_dir = Path(__file__).parent.parent.parent / "out"
if out_dir.exists():
    app.mount("/charts", StaticFiles(directory=str(out_dir)), name="charts")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
