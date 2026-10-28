from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.order_item import OrderItem
    from app.database.models.shipment import Shipment
    from app.database.models.payment import Payment
    from app.database.models.user import User


class OrderStatus(StrEnum):
    """Supported order lifecycle states."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentStatus(StrEnum):
    """Supported payment states."""

    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Order(UUIDTimestampMixin, Base):
    """Customer order containing one or more products."""

    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    idempotency_key: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default=OrderStatus.PENDING.value,
        server_default=OrderStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    payment_status: Mapped[str] = mapped_column(
        String(30),
        default=PaymentStatus.PENDING.value,
        server_default=PaymentStatus.PENDING.value,
        nullable=False,
        index=True,
    )

    subtotal: Mapped[Numeric] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    shipping_amount: Mapped[Numeric] = mapped_column(
        Numeric(12, 2),
        default=0,
        server_default="0",
        nullable=False,
    )

    tax_amount: Mapped[Numeric] = mapped_column(
        Numeric(12, 2),
        default=0,
        server_default="0",
        nullable=False,
    )

    discount_amount: Mapped[Numeric] = mapped_column(
        Numeric(12, 2),
        default=0,
        server_default="0",
        nullable=False,
    )

    total_amount: Mapped[Numeric] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        server_default="INR",
        nullable=False,
    )

    shipping_address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    billing_address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="orders",
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="order",
        cascade="all, delete-orphan",
    )


    shipments: Mapped[list["Shipment"]] = relationship(
        "Shipment",
        back_populates="order",
        cascade="all, delete-orphan",
    )
