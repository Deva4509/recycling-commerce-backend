from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
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
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    try:
        order = service.create_order(
            user_id=current_user.id,
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
        service.session.commit()
        service.session.refresh(order)
        return order
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


def get_owned_order(
    order_id: UUID,
    current_user: User,
    service: OrderService,
):
    """Return an order only when it belongs to the authenticated user."""
    order = service.get_order(order_id)

    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order was not found.",
        )

    return order


@router.get(
    "/{order_id}",
    response_model=OrderRead,
)
def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    try:
        return get_owned_order(order_id, current_user, service)
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
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.list_user_orders(current_user.id)


@router.post(
    "/{order_id}/cancel",
    response_model=OrderRead,
)
def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    try:
        get_owned_order(order_id, current_user, service)
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
