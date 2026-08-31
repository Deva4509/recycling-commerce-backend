import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import database_is_ready
from app.api.v1 import api_router
from app.config import settings


logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    settings.validate_production_security()

    logger.info(
        "Starting %s in %s environment",
        settings.app_name,
        settings.app_env,
    )

    yield

    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    description=(
        "REST API for a circular-economy recycling commerce SaaS platform."
    ),
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Return basic API health."""
    return {"status": "ok"}


@app.get("/ready", tags=["Health"])
async def readiness_check() -> dict[str, str]:
    """Return API readiness status."""
    return {"status": "ready"}


@app.get("/", tags=["System"])
async def root() -> dict[str, str]:
    """Return basic API information."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
    }


app.include_router(api_router)
