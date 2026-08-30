from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    """Checkout item."""

    product_id: UUID
    location_id: UUID
    variant_id: UUID | None = None
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    """Create an order during checkout."""

    user_id: UUID
    shipping_address: str = Field(min_length=1)
    billing_address: str | None = None
    notes: str | None = None

    shipping_amount: Decimal = Field(default=Decimal("0"), ge=0)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=0)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)

    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemRead(BaseModel):
    """Order item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    variant_id: UUID | None
    product_name: str
    sku: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime


class OrderRead(BaseModel):
    """Order response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_number: str
    user_id: UUID
    status: str
    payment_status: str
    subtotal: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    shipping_address: str
    billing_address: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]


class OrderSummaryRead(BaseModel):
    """Compact order response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_number: str
    status: str
    payment_status: str
    total_amount: Decimal
    currency: str
    created_at: datetime
