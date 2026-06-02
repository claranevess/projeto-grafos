from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import algorithms as alg_router
from api.routers import graph as graph_router
from api.routers import metrics as metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pré-carrega e cacheia o grafo na inicialização do servidor
    from api.services.graph_service import get_graph
    get_graph()
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

app.include_router(graph_router.router,   prefix="/api")
app.include_router(alg_router.router,     prefix="/api")
app.include_router(metrics_router.router, prefix="/api")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
