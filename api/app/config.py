from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/diamondpriceiq"
    model_dir: str = str(Path(__file__).parent.parent.parent / "model" / "artifacts")
    allowed_origins: str = "http://localhost:3000"
    rate_limit_per_minute: int = 30
    rate_limit_burst: int = 10
    model_version: str = "0.1.0"
    log_level: str = "INFO"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
