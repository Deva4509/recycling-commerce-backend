from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CartCreate(BaseModel):
    """Create or retrieve a cart for a user."""

    user_id: UUID


class CartItemCreate(BaseModel):
    """Add a product to a cart."""

    product_id: UUID
    quantity: int = Field(default=1, ge=1)
    variant_id: UUID | None = None


class CartItemUpdate(BaseModel):
    """Update a cart item quantity."""

    quantity: int = Field(ge=1)


class CartItemRead(BaseModel):
    """Cart item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cart_id: UUID
    product_id: UUID
    variant_id: UUID | None
    quantity: int
    unit_price: Decimal
    created_at: datetime
    updated_at: datetime


class CartRead(BaseModel):
    """Cart response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CartDetailRead(CartRead):
    """Cart response including its items."""

    items: list[CartItemRead] = Field(default_factory=list)


class CartMessage(BaseModel):
    """Simple cart operation response."""

    message: str
