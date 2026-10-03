from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
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
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    payment_provider: str = "mock"
    payment_key: str = ""
    payment_secret: str = ""

    email_provider: str = "console"
    email_api_key: str = ""
    email_from: str = "GreenCore <onboarding@resend.dev>"
    contact_email: str = "dy3819@vidyagyan.in"

    log_level: str = "INFO"

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_token_expiry(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be greater than zero.")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins as a list."""
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    def validate_production_security(self) -> None:
        """Validate settings that must be safe for production."""
        if not self.is_production:
            return

        if self.debug:
            raise ValueError("DEBUG must be false in production.")

        if len(self.auth_secret) < 32:
            raise ValueError(
                "AUTH_SECRET must contain at least 32 characters in production."
            )

        if self.auth_secret.startswith("REPLACE_WITH"):
            raise ValueError("AUTH_SECRET must be replaced in production.")

        if not self.database_url:
            raise ValueError("DATABASE_URL is required in production.")

        blocked_hosts = (
            "localhost",
            "127.0.0.1",
            "host.docker.internal",
        )

        if any(host in self.database_url.lower() for host in blocked_hosts):
            raise ValueError(
                "DATABASE_URL must point to the production PostgreSQL database."
            )

        if "*" in self.cors_origins:
            raise ValueError("Wildcard CORS origins are not allowed in production.")

    @property
    def is_production(self) -> bool:
        """Return whether the application is running in production."""
        return self.app_env.lower() == "production"

    def validate_production(self) -> None:
        """Reject unsafe development configuration in production."""
        if not self.is_production:
            return

        if self.debug:
            raise ValueError("DEBUG must be false in production.")

        if self.auth_secret == "development-only-change-me":
            raise ValueError("AUTH_SECRET must be changed in production.")

        if len(self.auth_secret) < 32:
            raise ValueError(
                "AUTH_SECRET must contain at least 32 characters in production."
            )

        if not self.cors_origin_list:
            raise ValueError("CORS_ORIGINS must contain at least one origin.")

        if "*" in self.cors_origin_list:
            raise ValueError("Wildcard CORS origin is not allowed in production.")


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings instance."""
    return Settings()


settings = get_settings()
settings.validate_production()
