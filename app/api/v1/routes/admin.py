from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password

from app.database import get_db
from app.database.models import (
    AdminSettings,
    Category,
    Order,
    OrderStatus,
    Product,
    ProductImage,
    RoleName,
)
from app.database.models.user import AccountStatus, User
from app.database.models.role import Role
from app.database.models.shipment import Shipment, ShipmentStatus
from app.database.models.payment import Payment, PaymentStatus
from app.dependencies.auth import require_roles
from app.schemas.catalog import ProductCreate, ProductRead
from app.schemas.order import OrderRead


router = APIRouter(prefix="/admin", tags=["Admin"])

admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)


class DashboardStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_products: int
    active_products: int
    inactive_products: int
    total_orders: int
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    total_revenue: float


class ProductImageCreate(BaseModel):
    image_url: str = Field(min_length=1, max_length=1000)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)
    is_primary: bool = False


class ProductImageRead(ProductImageCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID


class ProductImageUpdate(BaseModel):
    image_url: str | None = Field(default=None, min_length=1, max_length=1000)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int | None = Field(default=None, ge=0)
    is_primary: bool | None = None


@router.get(
    "/dashboard",
    response_model=DashboardStats,
)
def dashboard(
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    total_products = db.scalar(
        select(func.count(Product.id))
    ) or 0

    active_products = db.scalar(
        select(func.count(Product.id)).where(
            Product.is_active.is_(True)
        )
    ) or 0

    total_orders = db.scalar(
        select(func.count(Order.id))
    ) or 0

    pending_orders = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.PENDING.value
        )
    ) or 0

    processing_orders = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.PROCESSING.value
        )
    ) or 0

    shipped_orders = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.SHIPPED.value
        )
    ) or 0

    delivered_orders = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.DELIVERED.value
        )
    ) or 0

    cancelled_orders = db.scalar(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.CANCELLED.value
        )
    ) or 0

    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status != OrderStatus.CANCELLED.value
        )
    ) or 0

    return DashboardStats(
        total_products=total_products,
        active_products=active_products,
        inactive_products=total_products - active_products,
        total_orders=total_orders,
        pending_orders=pending_orders,
        processing_orders=processing_orders,
        shipped_orders=shipped_orders,
        delivered_orders=delivered_orders,
        cancelled_orders=cancelled_orders,
        total_revenue=float(revenue),
    )


@router.get(
    "/products",
    response_model=list[ProductRead],
)
def admin_products(
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(Product).order_by(Product.created_at.desc())
        ).all()
    )


@router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
)
def admin_create_product(
    payload: ProductCreate,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    category = db.get(Category, payload.category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found.",
        )

    product = Product(**payload.model_dump())
    db.add(product)

    try:
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug or SKU already exists.",
        ) from None

    return product


@router.patch(
    "/products/{product_id}",
    response_model=ProductRead,
)
def admin_update_product(
    product_id: UUID,
    payload: ProductCreate,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    category = db.get(Category, payload.category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found.",
        )

    for field, value in payload.model_dump().items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug or SKU already exists.",
        ) from None

    return product


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def admin_delete_product(
    product_id: UUID,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    product.is_active = False
    db.commit()


@router.get(
    "/products/{product_id}/images",
    response_model=list[ProductImageRead],
)
def list_product_images(
    product_id: UUID,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return list(
        db.scalars(
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .order_by(ProductImage.sort_order, ProductImage.created_at)
        ).all()
    )


@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageRead,
    status_code=status.HTTP_201_CREATED,
)
def add_product_image(
    product_id: UUID,
    payload: ProductImageCreate,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    if payload.is_primary:
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).update(
            {"is_primary": False},
            synchronize_session=False,
        )

    image = ProductImage(
        product_id=product_id,
        **payload.model_dump(),
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image


@router.patch(
    "/products/{product_id}/images/{image_id}",
    response_model=ProductImageRead,
)
def update_product_image(
    product_id: UUID,
    image_id: UUID,
    payload: ProductImageUpdate,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    image = db.get(ProductImage, image_id)

    if image is None or image.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product image not found.",
        )

    values = payload.model_dump(exclude_unset=True)

    if values.get("is_primary") is True:
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id,
            ProductImage.id != image_id,
        ).update(
            {"is_primary": False},
            synchronize_session=False,
        )

    for field, value in values.items():
        setattr(image, field, value)

    db.commit()
    db.refresh(image)

    return image


@router.delete(
    "/products/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product_image(
    product_id: UUID,
    image_id: UUID,
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    image = db.get(ProductImage, image_id)

    if image is None or image.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product image not found.",
        )

    db.delete(image)
    db.commit()


@router.get(
    "/orders",
    response_model=list[OrderRead],
)
def admin_orders(
    _: object = Depends(admin_or_staff),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(Order).order_by(Order.created_at.desc())
        ).all()
    )


@router.get("/customers")
def get_admin_customers(
    page: int = 1,
    page_size: int = 8,
    search: str | None = None,
    status: str | None = None,
    session: Session = Depends(get_db),
    _: User = Depends(admin_or_staff),
):
    """Return paginated customer accounts and customer metrics."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    customer_filter = User.role.has(Role.name == RoleName.CUSTOMER)

    base_query = select(User).where(customer_filter)

    if search:
        term = f"%{search.strip().lower()}%"
        base_query = base_query.where(
            func.lower(
                User.first_name + " " + User.last_name
            ).like(term)
            | func.lower(User.email).like(term)
            | func.lower(User.id.cast(String)).like(term)
        )

    if status and status.upper() in {
        AccountStatus.ACTIVE.value,
        AccountStatus.DISABLED.value,
        AccountStatus.UNVERIFIED.value,
    }:
        base_query = base_query.where(User.status == status.upper())

    total = session.scalar(
        select(func.count()).select_from(base_query.subquery())
    ) or 0

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    all_customer_filter = User.role.has(Role.name == RoleName.CUSTOMER)

    total_customers = session.scalar(
        select(func.count(User.id)).where(all_customer_filter)
    ) or 0

    active_customers = session.scalar(
        select(func.count(User.id)).where(
            all_customer_filter,
            User.status == AccountStatus.ACTIVE.value,
        )
    ) or 0

    new_this_month = session.scalar(
        select(func.count(User.id)).where(
            all_customer_filter,
            User.created_at >= month_start,
        )
    ) or 0

    total_spent = session.scalar(
        select(
            func.coalesce(
                func.sum(
                    Order.total_amount
                ),
                0,
            )
        )
        .select_from(Order)
        .join(User, Order.user_id == User.id)
        .where(
            all_customer_filter,
            Order.status != "CANCELLED",
        )
    ) or 0

    total_order_count = session.scalar(
        select(func.count(Order.id))
        .select_from(Order)
        .join(User, Order.user_id == User.id)
        .where(all_customer_filter)
    ) or 0

    avg_orders = (
        float(total_order_count) / float(total_customers)
        if total_customers
        else 0
    )

    rows = session.execute(
        base_query
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    customers = []

    for user in rows:
        order_count = session.scalar(
            select(func.count(Order.id)).where(Order.user_id == user.id)
        ) or 0

        spent = session.scalar(
            select(
                func.coalesce(
                    func.sum(Order.total_amount),
                    0,
                )
            ).where(
                Order.user_id == user.id,
                Order.status != "CANCELLED",
            )
        ) or 0

        customers.append(
            {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "status": user.status,
                "email_verified": user.email_verified,
                "orders": int(order_count),
                "total_spent": float(spent),
                "created_at": user.created_at,
            }
        )

    return {
        "customers": customers,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": int(total),
            "total_pages": max(
                1,
                (int(total) + page_size - 1) // page_size,
            ),
        },
        "stats": {
            "total_customers": int(total_customers),
            "active_customers": int(active_customers),
            "new_this_month": int(new_this_month),
            "total_spent": float(total_spent),
            "average_orders": round(avg_orders, 1),
        },
    }


@router.get("/payments")
def get_admin_payments(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    status_filter: str | None = None,
    session: Session = Depends(get_db),
    _: User = Depends(admin_or_staff),
):
    """Return paginated payment transactions and payment metrics."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = (
        select(Payment, Order, User)
        .join(Order, Payment.order_id == Order.id)
        .join(User, Order.user_id == User.id)
    )

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.where(
            func.lower(User.first_name).like(term)
            | func.lower(User.last_name).like(term)
            | func.lower(User.email).like(term)
            | func.lower(Payment.method).like(term)
            | func.lower(Payment.status).like(term)
            | func.lower(Payment.id.cast(String)).like(term)
            | func.lower(Order.id.cast(String)).like(term)
        )

    valid_statuses = {
        PaymentStatus.PENDING.value,
        PaymentStatus.PROCESSING.value,
        PaymentStatus.PAID.value,
        PaymentStatus.FAILED.value,
        PaymentStatus.REFUNDED.value,
        PaymentStatus.CANCELLED.value,
    }

    normalized_status = status_filter.upper() if status_filter else None

    if normalized_status in valid_statuses:
        query = query.where(Payment.status == normalized_status)

    count_query = query.with_only_columns(
        func.count(Payment.id),
        maintain_column_froms=True,
    )

    total = session.scalar(count_query) or 0

    total_payments = session.scalar(
        select(func.count(Payment.id))
    ) or 0

    paid_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PAID.value
        )
    ) or 0

    pending_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PENDING.value
        )
    ) or 0

    processing_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.PROCESSING.value
        )
    ) or 0

    failed_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.FAILED.value
        )
    ) or 0

    refunded_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.REFUNDED.value
        )
    ) or 0

    cancelled_payments = session.scalar(
        select(func.count(Payment.id)).where(
            Payment.status == PaymentStatus.CANCELLED.value
        )
    ) or 0

    total_received = session.scalar(
        select(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        ).where(
            Payment.status == PaymentStatus.PAID.value
        )
    ) or 0

    total_refunded = session.scalar(
        select(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        ).where(
            Payment.status == PaymentStatus.REFUNDED.value
        )
    ) or 0

    rows = session.execute(
        query
        .order_by(Payment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    payments = []

    for payment, order, user in rows:
        payments.append(
            {
                "id": str(payment.id),
                "order_id": str(payment.order_id),
                "customer_name": f"{user.first_name} {user.last_name}".strip(),
                "customer_email": user.email,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "method": payment.method,
                "status": payment.status,
                "provider": payment.provider,
                "provider_payment_id": payment.provider_payment_id,
                "failure_reason": payment.failure_reason,
                "created_at": payment.created_at,
            }
        )

    return {
        "payments": payments,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": int(total),
            "total_pages": max(
                1,
                (int(total) + page_size - 1) // page_size,
            ),
        },
        "stats": {
            "total_payments": int(total_payments),
            "paid_payments": int(paid_payments),
            "pending_payments": int(pending_payments),
            "processing_payments": int(processing_payments),
            "failed_payments": int(failed_payments),
            "refunded_payments": int(refunded_payments),
            "cancelled_payments": int(cancelled_payments),
            "total_received": float(total_received),
            "total_refunded": float(total_refunded),
        },
    }


@router.get("/shipments")
def get_admin_shipments(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    status_filter: str | None = None,
    session: Session = Depends(get_db),
    _: User = Depends(admin_or_staff),
):
    """Return paginated shipment records and shipment metrics."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = (
        select(Shipment, Order, User)
        .join(Order, Shipment.order_id == Order.id)
        .join(User, Order.user_id == User.id)
    )

    if search:
        term = f"%{search.strip().lower()}%"
        query = query.where(
            func.lower(User.first_name).like(term)
            | func.lower(User.last_name).like(term)
            | func.lower(User.email).like(term)
            | func.lower(Shipment.status).like(term)
            | func.lower(Shipment.carrier).like(term)
            | func.lower(Shipment.tracking_number).like(term)
            | func.lower(Shipment.id.cast(String)).like(term)
            | func.lower(Order.id.cast(String)).like(term)
        )

    valid_statuses = {
        ShipmentStatus.PENDING.value,
        ShipmentStatus.PROCESSING.value,
        ShipmentStatus.SHIPPED.value,
        ShipmentStatus.IN_TRANSIT.value,
        ShipmentStatus.OUT_FOR_DELIVERY.value,
        ShipmentStatus.DELIVERED.value,
        ShipmentStatus.CANCELLED.value,
    }

    normalized_status = status_filter.upper() if status_filter else None

    if normalized_status in valid_statuses:
        query = query.where(
            Shipment.status == normalized_status
        )

    count_query = query.with_only_columns(
        func.count(Shipment.id),
        maintain_column_froms=True,
    )

    total = session.scalar(count_query) or 0

    status_counts = {}

    for shipment_status in valid_statuses:
        status_counts[shipment_status.lower()] = int(
            session.scalar(
                select(func.count(Shipment.id)).where(
                    Shipment.status == shipment_status
                )
            )
            or 0
        )

    rows = session.execute(
        query
        .order_by(Shipment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    shipments = []

    for shipment, order, user in rows:
        shipments.append(
            {
                "id": str(shipment.id),
                "order_id": str(shipment.order_id),
                "customer_name": (
                    f"{user.first_name} {user.last_name}"
                ).strip(),
                "customer_email": user.email,
                "status": shipment.status,
                "carrier": shipment.carrier,
                "tracking_number": shipment.tracking_number,
                "shipping_address": shipment.shipping_address,
                "notes": shipment.notes,
                "created_at": shipment.created_at,
                "updated_at": shipment.updated_at,
            }
        )

    return {
        "shipments": shipments,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": int(total),
            "total_pages": max(
                1,
                (int(total) + page_size - 1) // page_size,
            ),
        },
        "stats": {
            "total_shipments": sum(status_counts.values()),
            **status_counts,
        },
    }


class AdminSettingsUpdate(BaseModel):
    order_alerts: bool | None = None
    payment_alerts: bool | None = None
    low_stock_alerts: bool | None = None
    default_currency: str | None = Field(default=None, min_length=3, max_length=3)
    timezone: str | None = Field(default=None, min_length=1, max_length=100)
    order_processing_enabled: bool | None = None


class AdminProfileUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)


class AdminPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


def _admin_settings(db: Session, user: User) -> AdminSettings:
    settings = db.scalar(
        select(AdminSettings).where(AdminSettings.user_id == user.id)
    )
    if settings is None:
        settings = AdminSettings(user_id=user.id)
        db.add(settings)
        db.flush()
    return settings


@router.get("/settings")
def get_admin_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN, RoleName.STAFF)),
):
    settings = _admin_settings(db, current_user)
    db.commit()
    db.refresh(settings)
    return {
        "profile": {
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "phone": current_user.phone,
        },
        "settings": {
            "order_alerts": settings.order_alerts,
            "payment_alerts": settings.payment_alerts,
            "low_stock_alerts": settings.low_stock_alerts,
            "default_currency": settings.default_currency,
            "timezone": settings.timezone,
            "order_processing_enabled": settings.order_processing_enabled,
        },
    }


@router.patch("/settings")
def update_admin_settings(
    payload: AdminSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN, RoleName.STAFF)),
):
    settings = _admin_settings(db, current_user)

    for field in (
        "order_alerts",
        "payment_alerts",
        "low_stock_alerts",
        "default_currency",
        "timezone",
        "order_processing_enabled",
    ):
        value = getattr(payload, field)
        if value is not None:
            setattr(settings, field, value.upper() if field == "default_currency" else value)

    db.commit()
    db.refresh(settings)
    return {"message": "Settings updated successfully"}


@router.patch("/profile")
def update_admin_profile(
    payload: AdminProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN, RoleName.STAFF)),
):
    current_user.first_name = payload.first_name
    current_user.last_name = payload.last_name
    current_user.phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully"}


@router.patch("/password")
def update_admin_password(
    payload: AdminPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(RoleName.ADMIN, RoleName.STAFF)
    ),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account does not have a password configured",
        )

    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"message": "Password changed successfully"}
