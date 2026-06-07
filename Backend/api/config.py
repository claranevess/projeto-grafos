from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    data_dir: Path = Path("Backend/data")
    airports_csv: str = "aeroportos_data.csv"
    edges_csv: str = "adjacencias_aeroportos.csv"
    ego_csv: Path = Path("out/tabelas/ego_aeroportos.csv")

    model_config = {"env_prefix": "GRAFOS_"}


settings = Settings()
