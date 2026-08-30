from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.payment import PaymentMethod


class PaymentCreate(BaseModel):
    """Create a payment for an order."""

    order_id: UUID
    method: PaymentMethod
    provider: str | None = Field(default=None, max_length=50)


class PaymentRead(BaseModel):
    """Payment response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    amount: Decimal
    currency: str
    method: str
    status: str
    provider: str | None
    provider_payment_id: str | None
    provider_order_id: str | None
    failure_reason: str | None
    created_at: datetime
    updated_at: datetime


class PaymentPaidRequest(BaseModel):
    """Provider confirmation for a successful payment."""

    provider_payment_id: str | None = Field(
        default=None,
        max_length=255,
    )
    provider_order_id: str | None = Field(
        default=None,
        max_length=255,
    )


class PaymentFailedRequest(BaseModel):
    """Payment failure information."""

    failure_reason: str | None = None
