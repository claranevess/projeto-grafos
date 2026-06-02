from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    data_dir: Path = Path("data")
    airports_csv: str = "aeroportos_data.csv"
    edges_csv: str = "adjacencias_aeroportos.csv"

    model_config = {"env_prefix": "GRAFOS_"}


settings = Settings()
