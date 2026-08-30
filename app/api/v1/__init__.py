from fastapi import APIRouter

from app.api.v1.routes.inventory import router as inventory_router
from app.api.v1.routes.cart import router as cart_router
from app.api.v1.routes.orders import router as orders_router
from app.api.v1.routes.payments import router as payments_router
from app.api.v1.routes.shipments import router as shipments_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(inventory_router)
api_router.include_router(cart_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)
api_router.include_router(shipments_router)

__all__ = ["api_router"]
