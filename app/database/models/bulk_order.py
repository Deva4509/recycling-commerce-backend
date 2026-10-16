from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.models.base import Base, UUIDTimestampMixin


class BulkOrderStatus(StrEnum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    QUOTE_SENT = "QUOTE_SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"


class BulkOrderRequest(UUIDTimestampMixin, Base):
    __tablename__ = "bulk_order_requests"
    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_bulk_request_quantity_positive",
        ),
        CheckConstraint(
            "minimum_quantity_snapshot > 0",
            name="ck_bulk_request_minimum_positive",
        ),
        CheckConstraint(
            "quoted_unit_price IS NULL OR quoted_unit_price >= 0",
            name="ck_bulk_request_quote_price_nonnegative",
        ),
        CheckConstraint(
            "quoted_total IS NULL OR quoted_total >= 0",
            name="ck_bulk_request_quote_total_nonnegative",
        ),
        CheckConstraint(
            "(quoted_unit_price IS NULL AND quoted_total IS NULL) OR "
            "(quoted_unit_price IS NOT NULL AND quoted_total IS NOT NULL)",
            name="ck_bulk_request_quote_values_paired",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'UNDER_REVIEW', 'QUOTE_SENT', "
            "'ACCEPTED', 'REJECTED', 'FULFILLED')",
            name="ck_bulk_request_status",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    organization_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    contact_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    contact_email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
    )
    contact_phone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    delivery_address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    delivery_pin_code: Mapped[str] = mapped_column(
        String(12),
        nullable=False,
    )
    expected_delivery_date: Mapped[Date | None] = mapped_column(
        Date,
        nullable=True,
    )
    intended_use: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=BulkOrderStatus.PENDING.value,
        server_default=BulkOrderStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    minimum_quantity_snapshot: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    quoted_unit_price: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    quoted_total: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    quote_valid_until: Mapped[Date | None] = mapped_column(
        Date,
        nullable=True,
    )
    quote_terms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    converted_order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=True,
        unique=True,
    )


class BulkOrderProductConfig(UUIDTimestampMixin, Base):
    __tablename__ = "bulk_order_product_configs"
    __table_args__ = (
        CheckConstraint(
            "minimum_quantity > 0",
            name="ck_bulk_config_minimum_positive",
        ),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    minimum_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
        server_default="10",
    )
    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )


class BulkOrderPricingTier(UUIDTimestampMixin, Base):
    __tablename__ = "bulk_order_pricing_tiers"
    __table_args__ = (
        CheckConstraint(
            "minimum_quantity > 0",
            name="ck_bulk_tier_minimum_positive",
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="ck_bulk_tier_price_nonnegative",
        ),
        UniqueConstraint(
            "product_id",
            "minimum_quantity",
            name="uq_bulk_tier_product_minimum",
        ),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    minimum_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
