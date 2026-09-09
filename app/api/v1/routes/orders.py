from uuid import UUID

from app.database.models.order import OrderStatus

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import RoleName, User
from app.dependencies.auth import get_current_user, require_roles
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


admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)


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


@router.get(
    "/admin/all",
    response_model=list[OrderRead],
)
def list_all_orders(
    _: object = Depends(admin_or_staff),
    service: OrderService = Depends(get_order_service),
):
    """Return all orders for admin/staff management."""
    return service.repository.list_all_orders()


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



class AdminOrderStatusUpdate(__import__("pydantic").BaseModel):
    status: str


@router.patch(
    "/{order_id}/status",
    response_model=OrderRead,
)
def update_order_status(
    order_id: UUID,
    payload: AdminOrderStatusUpdate,
    _: object = Depends(admin_or_staff),
    service: OrderService = Depends(get_order_service),
):
    try:
        order = service.get_order(order_id)

        allowed_statuses = {
            item.value
            for item in OrderStatus
        }

        if payload.status.upper() not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid order status '{payload.status}'. "
                    f"Allowed statuses: {', '.join(sorted(allowed_statuses))}"
                ),
            )

        # Customer-cancelled orders are immutable. Admin/staff cannot
        # reopen or move a cancelled order to another status.
        if order.status == OrderStatus.CANCELLED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cancelled orders cannot be modified.",
            )

        order.status = payload.status.upper()
        service.session.commit()
        service.session.refresh(order)

        return order

    except OrderNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

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
        order = service.cancel_order(order_id)
        service.session.commit()
        service.session.refresh(order)
        return order
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
