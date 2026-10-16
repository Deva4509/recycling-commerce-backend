from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.admin import router as admin_router
from fastapi import APIRouter

from app.api.v1.routes.inventory import router as inventory_router
from app.api.v1.routes.cart import router as cart_router
from app.api.v1.routes.catalog import router as catalog_router
from app.api.v1.routes.orders import router as orders_router
from app.api.v1.routes.payments import router as payments_router
from app.api.v1.routes.shipments import router as shipments_router
from app.api.v1.routes.reviews import router as reviews_router
from app.api.v1.routes.contact import router as contact_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(admin_router)

api_router.include_router(inventory_router)
api_router.include_router(cart_router)
api_router.include_router(catalog_router)
api_router.include_router(orders_router)
api_router.include_router(payments_router)
api_router.include_router(shipments_router)

__all__ = ["api_router"]

api_router.include_router(reviews_router)

api_router.include_router(contact_router)
