from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    app_name: str = "Recycle Commerce API"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/recycling_commerce"
    )

    auth_secret: str = "development-only-change-me"
    access_token_expire_minutes: int = 30

    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    storage_bucket: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""
    storage_endpoint: str = ""

    payment_provider: str = "mock"
    payment_key: str = ""
    payment_secret: str = ""

    email_provider: str = "console"
    email_api_key: str = ""

    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins as a list."""
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def is_production(self) -> bool:
        """Return whether the application is running in production."""
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""
    return Settings()


settings = get_settings()
