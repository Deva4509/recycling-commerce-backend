from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import (
    BulkOrderPricingTier,
    BulkOrderProductConfig,
    BulkOrderRequest,
    BulkOrderStatus,
    InventoryItem,
    InventoryLocation,
    Order,
    OrderStatus,
    Product,
    RoleName,
    User,
)
from app.dependencies.auth import get_current_user, require_roles
from app.schemas.bulk_order import (
    BulkOrderAdminRead,
    BulkOrderAdminUpdate,
    BulkOrderCreate,
    BulkOrderCustomerRead,
    BulkOrderPricingTierCreate,
    BulkOrderProductConfigRead,
    BulkOrderProductConfigUpdate,
    BulkOrderPricingTierRead,
    BulkOrderQuoteCreate,
)
from app.schemas.order import OrderRead
from app.services.inventory import InsufficientStockError, InventoryNotFoundError
from app.services.order import OrderService, OrderValidationError

router = APIRouter(prefix="/bulk-orders", tags=["Bulk Orders"])
customer_only = require_roles(RoleName.CUSTOMER)
admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)
MAX_MONEY = Decimal("9999999999.99")


def get_session(db: Session = Depends(get_db)) -> Session:
    return db


def get_request_or_404(session: Session, request_id: UUID) -> BulkOrderRequest:
    request = session.get(BulkOrderRequest, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk order request was not found.",
        )
    return request


@router.get(
    "/products/{product_id}/config",
    response_model=BulkOrderProductConfigRead,
)
def get_product_bulk_config(
    product_id: UUID,
    session: Session = Depends(get_session),
):
    product = session.get(Product, product_id)
    config = session.scalar(
        select(BulkOrderProductConfig).where(
            BulkOrderProductConfig.product_id == product_id
        )
    )
    if product is None or not product.is_active or config is None or not config.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk ordering is not available for this product.",
        )
    tiers = session.scalars(
        select(BulkOrderPricingTier)
        .where(BulkOrderPricingTier.product_id == product_id)
        .order_by(BulkOrderPricingTier.minimum_quantity)
    ).all()
    return BulkOrderProductConfigRead(
        product_id=product_id,
        minimum_quantity=config.minimum_quantity,
        is_enabled=config.is_enabled,
        pricing_tiers=list(tiers),
    )


@router.post(
    "",
    response_model=BulkOrderCustomerRead,
    status_code=status.HTTP_201_CREATED,
)
def create_bulk_order_request(
    payload: BulkOrderCreate,
    current_user: User = Depends(customer_only),
    session: Session = Depends(get_session),
):
    product = session.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active product was not found.",
        )

    config = session.scalar(
        select(BulkOrderProductConfig).where(
            BulkOrderProductConfig.product_id == payload.product_id
        )
    )
    if config is None or not config.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bulk ordering is not enabled for this product.",
        )
    if payload.quantity < config.minimum_quantity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Requested quantity is below the configured minimum of "
                f"{config.minimum_quantity}."
            ),
        )

    request = BulkOrderRequest(
        user_id=current_user.id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        organization_name=payload.organization_name,
        contact_name=payload.contact_name,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        delivery_address=payload.delivery_address,
        delivery_pin_code=payload.delivery_pin_code,
        expected_delivery_date=payload.expected_delivery_date,
        intended_use=payload.intended_use,
        minimum_quantity_snapshot=config.minimum_quantity,
        status=BulkOrderStatus.PENDING.value,
    )
    session.add(request)
    session.commit()
    session.refresh(request)
    return request


@router.get("/mine", response_model=list[BulkOrderCustomerRead])
def list_my_bulk_orders(
    current_user: User = Depends(customer_only),
    session: Session = Depends(get_session),
):
    return list(
        session.scalars(
            select(BulkOrderRequest)
            .where(BulkOrderRequest.user_id == current_user.id)
            .order_by(BulkOrderRequest.created_at.desc())
        ).all()
    )


@router.get("/admin", response_model=list[BulkOrderAdminRead])
def list_bulk_order_requests(
    status_filter: str | None = Query(default=None, alias="status"),
    product_id: UUID | None = None,
    search: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=100, ge=1, le=200),
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    statement = (
        select(BulkOrderRequest)
        .join(Product, Product.id == BulkOrderRequest.product_id)
        .order_by(BulkOrderRequest.created_at.desc())
        .limit(limit)
    )
    if status_filter:
        if status_filter not in {item.value for item in BulkOrderStatus}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid bulk request status.",
            )
        statement = statement.where(BulkOrderRequest.status == status_filter)
    if product_id is not None:
        statement = statement.where(BulkOrderRequest.product_id == product_id)
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                BulkOrderRequest.organization_name.ilike(pattern),
                BulkOrderRequest.contact_name.ilike(pattern),
                BulkOrderRequest.contact_email.ilike(pattern),
                Product.name.ilike(pattern),
            )
        )
    return list(session.scalars(statement).all())


@router.get(
    "/admin/products/{product_id}/config",
    response_model=BulkOrderProductConfigRead,
)
def get_admin_product_bulk_config(
    product_id: UUID,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    if session.get(Product, product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product was not found.",
        )
    config = session.scalar(
        select(BulkOrderProductConfig).where(
            BulkOrderProductConfig.product_id == product_id
        )
    )
    tiers = session.scalars(
        select(BulkOrderPricingTier)
        .where(BulkOrderPricingTier.product_id == product_id)
        .order_by(BulkOrderPricingTier.minimum_quantity)
    ).all()
    return BulkOrderProductConfigRead(
        product_id=product_id,
        minimum_quantity=config.minimum_quantity if config else 10,
        is_enabled=config.is_enabled if config else False,
        pricing_tiers=list(tiers),
    )


@router.put(
    "/admin/products/{product_id}/config",
    response_model=BulkOrderProductConfigRead,
)
def update_product_bulk_config(
    product_id: UUID,
    payload: BulkOrderProductConfigUpdate,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    if session.get(Product, product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product was not found.",
        )
    config = session.scalar(
        select(BulkOrderProductConfig)
        .where(BulkOrderProductConfig.product_id == product_id)
        .with_for_update()
    )
    if config is None:
        config = BulkOrderProductConfig(
            product_id=product_id,
            minimum_quantity=payload.minimum_quantity,
            is_enabled=payload.is_enabled,
        )
        session.add(config)
    else:
        config.minimum_quantity = payload.minimum_quantity
        config.is_enabled = payload.is_enabled
    session.commit()
    session.refresh(config)
    tiers = session.scalars(
        select(BulkOrderPricingTier)
        .where(BulkOrderPricingTier.product_id == product_id)
        .order_by(BulkOrderPricingTier.minimum_quantity)
    ).all()
    return BulkOrderProductConfigRead(
        product_id=product_id,
        minimum_quantity=config.minimum_quantity,
        is_enabled=config.is_enabled,
        pricing_tiers=list(tiers),
    )


@router.post(
    "/admin/products/{product_id}/pricing-tiers",
    response_model=BulkOrderPricingTierRead,
    status_code=status.HTTP_201_CREATED,
)
def create_pricing_tier(
    product_id: UUID,
    payload: BulkOrderPricingTierCreate,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    if session.get(Product, product_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product was not found.",
        )
    config = session.scalar(
        select(BulkOrderProductConfig).where(
            BulkOrderProductConfig.product_id == product_id
        )
    )
    if config is None or payload.minimum_quantity < config.minimum_quantity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pricing tier quantity must meet the configured minimum.",
        )
    tier = BulkOrderPricingTier(
        product_id=product_id,
        minimum_quantity=payload.minimum_quantity,
        unit_price=payload.unit_price,
    )
    session.add(tier)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pricing tier already exists for that quantity.",
        ) from exc
    session.refresh(tier)
    return tier


@router.delete(
    "/admin/products/{product_id}/pricing-tiers/{tier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_pricing_tier(
    product_id: UUID,
    tier_id: UUID,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    tier = session.scalar(
        select(BulkOrderPricingTier).where(
            BulkOrderPricingTier.id == tier_id,
            BulkOrderPricingTier.product_id == product_id,
        )
    )
    if tier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing tier was not found.",
        )
    session.delete(tier)
    session.commit()


@router.post(
    "/admin/{request_id}/quote",
    response_model=BulkOrderAdminRead,
)
def issue_bulk_order_quote(
    request_id: UUID,
    payload: BulkOrderQuoteCreate,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    request = get_request_or_404(session, request_id)
    if request.status != BulkOrderStatus.UNDER_REVIEW.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A quote can only be issued while a request is under review.",
        )
    total = payload.unit_price * request.quantity
    if total > MAX_MONEY:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Quoted total exceeds the supported currency amount.",
        )
    request.quoted_unit_price = payload.unit_price
    request.quoted_total = total
    request.quote_valid_until = payload.valid_until
    request.quote_terms = payload.terms
    request.status = BulkOrderStatus.QUOTE_SENT.value
    session.commit()
    session.refresh(request)
    return request


@router.patch(
    "/admin/{request_id}",
    response_model=BulkOrderAdminRead,
)
def update_bulk_order_request(
    request_id: UUID,
    payload: BulkOrderAdminUpdate,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    request = get_request_or_404(session, request_id)
    if "status" in payload.model_fields_set:
        allowed_transitions = {
            BulkOrderStatus.PENDING.value: {BulkOrderStatus.UNDER_REVIEW.value},
            BulkOrderStatus.UNDER_REVIEW.value: {BulkOrderStatus.PENDING.value},
            BulkOrderStatus.QUOTE_SENT.value: {BulkOrderStatus.UNDER_REVIEW.value},
            BulkOrderStatus.REJECTED.value: {BulkOrderStatus.UNDER_REVIEW.value},
            BulkOrderStatus.ACCEPTED.value: {BulkOrderStatus.FULFILLED.value},
        }
        next_status = payload.status
        if (
            next_status is None
            or next_status
            not in allowed_transitions.get(request.status, set())
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="That bulk request status transition is not permitted.",
            )
        if (
            request.status
            in {
                BulkOrderStatus.QUOTE_SENT.value,
                BulkOrderStatus.REJECTED.value,
            }
            and next_status == BulkOrderStatus.UNDER_REVIEW.value
        ):
            request.quoted_unit_price = None
            request.quoted_total = None
            request.quote_valid_until = None
            request.quote_terms = None
        if next_status == BulkOrderStatus.FULFILLED.value:
            order = (
                session.get(Order, request.converted_order_id)
                if request.converted_order_id is not None
                else None
            )
            if order is None or order.status != OrderStatus.DELIVERED.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "A bulk request can only be fulfilled after its "
                        "converted order has been delivered."
                    ),
                )
        request.status = next_status
    if "admin_notes" in payload.model_fields_set:
        request.admin_notes = payload.admin_notes
    session.commit()
    session.refresh(request)
    return request


@router.get("/admin/{request_id}", response_model=BulkOrderAdminRead)
def get_admin_bulk_order_request(
    request_id: UUID,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    return get_request_or_404(session, request_id)


@router.post(
    "/admin/{request_id}/convert-to-order",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
)
def convert_accepted_quote_to_order(
    request_id: UUID,
    _: User = Depends(admin_or_staff),
    session: Session = Depends(get_session),
):
    request = session.scalar(
        select(BulkOrderRequest)
        .where(BulkOrderRequest.id == request_id)
        .with_for_update()
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk order request was not found.",
        )
    if request.converted_order_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This bulk request has already been converted to an order.",
        )
    if (
        request.status != BulkOrderStatus.ACCEPTED.value
        or request.quoted_unit_price is None
        or request.quote_valid_until is None
        or request.quote_valid_until < date.today()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an accepted, unexpired quote can be converted.",
        )

    inventory_item = session.scalar(
        select(InventoryItem)
        .join(
            InventoryLocation,
            InventoryLocation.id == InventoryItem.location_id,
        )
        .where(
            InventoryItem.product_id == request.product_id,
            InventoryItem.is_active.is_(True),
            InventoryLocation.is_active.is_(True),
            InventoryItem.quantity - InventoryItem.reserved_quantity
            >= request.quantity,
        )
        .order_by(
            (InventoryItem.quantity - InventoryItem.reserved_quantity).desc()
        )
        .with_for_update()
    )
    if inventory_item is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No active inventory location has enough available stock "
                "to fulfill this bulk request."
            ),
        )

    service = OrderService(session)
    try:
        order = service.create_order(
            user_id=request.user_id,
            shipping_address=request.delivery_address,
            items=[
                {
                    "product_id": request.product_id,
                    "location_id": inventory_item.location_id,
                    "quantity": request.quantity,
                }
            ],
            notes=f"Bulk order request {request.id}",
            item_unit_price_overrides={
                request.product_id: request.quoted_unit_price
            },
        )
        session.flush()
        request.converted_order_id = order.id
        session.commit()
    except (InsufficientStockError, InventoryNotFoundError) as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except OrderValidationError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The bulk request was concurrently converted.",
        ) from exc
    session.refresh(order)
    return order


@router.post(
    "/{request_id}/accept",
    response_model=BulkOrderCustomerRead,
)
def accept_bulk_order_quote(
    request_id: UUID,
    current_user: User = Depends(customer_only),
    session: Session = Depends(get_session),
):
    request = session.scalar(
        select(BulkOrderRequest)
        .where(
            BulkOrderRequest.id == request_id,
            BulkOrderRequest.user_id == current_user.id,
        )
        .with_for_update()
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk order request was not found.",
        )
    if (
        request.status != BulkOrderStatus.QUOTE_SENT.value
        or request.quote_valid_until is None
        or request.quote_valid_until < date.today()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an unexpired quote awaiting a response can be accepted.",
        )
    request.status = BulkOrderStatus.ACCEPTED.value
    session.commit()
    session.refresh(request)
    return request


@router.post(
    "/{request_id}/reject",
    response_model=BulkOrderCustomerRead,
)
def reject_bulk_order_quote(
    request_id: UUID,
    current_user: User = Depends(customer_only),
    session: Session = Depends(get_session),
):
    request = session.scalar(
        select(BulkOrderRequest)
        .where(
            BulkOrderRequest.id == request_id,
            BulkOrderRequest.user_id == current_user.id,
        )
        .with_for_update()
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk order request was not found.",
        )
    if request.status != BulkOrderStatus.QUOTE_SENT.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a quote awaiting a response can be rejected.",
        )
    request.status = BulkOrderStatus.REJECTED.value
    session.commit()
    session.refresh(request)
    return request


@router.get("/{request_id}", response_model=BulkOrderCustomerRead)
def get_my_bulk_order_request(
    request_id: UUID,
    current_user: User = Depends(customer_only),
    session: Session = Depends(get_session),
):
    request = session.scalar(
        select(BulkOrderRequest).where(
            BulkOrderRequest.id == request_id,
            BulkOrderRequest.user_id == current_user.id,
        )
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk order request was not found.",
        )
    return request
