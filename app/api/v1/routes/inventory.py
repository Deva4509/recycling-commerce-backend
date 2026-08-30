from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import RoleName
from app.dependencies.auth import require_roles
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemRead,
    InventoryLocationCreate,
    InventoryLocationRead,
    InventoryMovementRead,
)
from app.services.inventory import (
    InsufficientStockError,
    InventoryNotFoundError,
    InventoryService,
    InventoryValidationError,
)

admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)


router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_inventory_service(
    db: Session = Depends(get_db),
) -> InventoryService:
    return InventoryService(db)


@router.post(
    "/locations",
    response_model=InventoryLocationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_location(
    payload: InventoryLocationCreate,
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.create_location(
            name=payload.name,
            code=payload.code,
            description=payload.description,
            is_active=payload.is_active,
        )
    except InventoryValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/locations",
    response_model=list[InventoryLocationRead],
)
def list_locations(
    service: InventoryService = Depends(get_inventory_service),
):
    return service.list_locations()


@router.post(
    "/items",
    response_model=InventoryItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_item(
    payload: InventoryItemCreate,
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.create_item(
            product_id=payload.product_id,
            location_id=payload.location_id,
            quantity=payload.quantity,
            reserved_quantity=payload.reserved_quantity,
            low_stock_threshold=payload.low_stock_threshold,
            is_active=payload.is_active,
        )
    except InventoryValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/items/{inventory_item_id}",
    response_model=InventoryItemRead,
)
def get_inventory_item(
    inventory_item_id: UUID,
    service: InventoryService = Depends(get_inventory_service),
):
    try:
        return service.get_item(inventory_item_id)
    except InventoryNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/items/{inventory_item_id}/receive",
    response_model=InventoryItemRead,
)
def receive_stock(
    inventory_item_id: UUID,
    quantity: int,
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.receive_stock(inventory_item_id, quantity)
    except InventoryNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InventoryValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/items/{inventory_item_id}/sell",
    response_model=InventoryItemRead,
)
def sell_stock(
    inventory_item_id: UUID,
    quantity: int,
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.sell_stock(inventory_item_id, quantity)
    except InventoryNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InsufficientStockError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except InventoryValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/items/{inventory_item_id}/movements",
    response_model=list[InventoryMovementRead],
)
def list_movements(
    inventory_item_id: UUID,
    service: InventoryService = Depends(get_inventory_service),
):
    try:
        return service.list_movements(inventory_item_id)
    except InventoryNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
