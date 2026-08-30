from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1 import api_router

app = FastAPI(
    title=settings.app_name,
    description=(
        "REST API for a circular-economy recycling commerce SaaS platform."
    ),
    version="0.1.0",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Return the API health status."""
    return {"status": "ok"}


@app.get("/", tags=["System"])
async def root() -> dict[str, str]:
    """Return basic API information."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
    }


app.include_router(api_router)
