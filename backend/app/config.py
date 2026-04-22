from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(..., alias="DATABASE_URL")
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    frontend_origins: str | None = Field(default=None, alias="FRONTEND_ORIGINS")

    model_config = {"env_file": ".env", "populate_by_name": True}

    @property
    def cors_allow_origins(self) -> list[str]:
        if self.frontend_origins:
            origins = [origin.strip() for origin in self.frontend_origins.split(",")]
            return [origin for origin in origins if origin]

        return ["http://localhost:5173", "http://localhost:5174"]


settings = Settings()
