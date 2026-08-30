from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import (
    OrderCreate,
    OrderRead,
    OrderSummaryRead,
)
from app.services.inventory import (
    InsufficientStockError,
    InventoryNotFoundError,
)
from app.services.order import (
    OrderNotFoundError,
    OrderService,
    OrderValidationError,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_order_service(
    db: Session = Depends(get_db),
) -> OrderService:
    return OrderService(db)


@router.post(
    "",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    payload: OrderCreate,
    service: OrderService = Depends(get_order_service),
):
    try:
        return service.create_order(
            user_id=payload.user_id,
            shipping_address=payload.shipping_address,
            billing_address=payload.billing_address,
            notes=payload.notes,
            shipping_amount=payload.shipping_amount,
            tax_amount=payload.tax_amount,
            discount_amount=payload.discount_amount,
            items=[
                item.model_dump()
                for item in payload.items
            ],
        )
    except (
        OrderValidationError,
        InventoryNotFoundError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except InsufficientStockError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/{order_id}",
    response_model=OrderRead,
)
def get_order(
    order_id: UUID,
    service: OrderService = Depends(get_order_service),
):
    try:
        return service.get_order(order_id)
    except OrderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/user/{user_id}",
    response_model=list[OrderSummaryRead],
)
def list_user_orders(
    user_id: UUID,
    service: OrderService = Depends(get_order_service),
):
    return service.list_user_orders(user_id)


@router.post(
    "/{order_id}/cancel",
    response_model=OrderRead,
)
def cancel_order(
    order_id: UUID,
    service: OrderService = Depends(get_order_service),
):
    try:
        return service.cancel_order(order_id)
    except OrderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except OrderValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
