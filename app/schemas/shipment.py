from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.shipment import ShipmentStatus


class ShipmentCreate(BaseModel):
    """Create a shipment for an order."""

    order_id: UUID
    shipping_address: str | None = Field(default=None, min_length=1)
    carrier: str | None = Field(default=None, max_length=100)
    tracking_number: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class ShipmentUpdate(BaseModel):
    """Optional shipment tracking information."""

    carrier: str | None = Field(default=None, max_length=100)
    tracking_number: str | None = Field(default=None, max_length=150)


class ShipmentRead(BaseModel):
    """Shipment response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    status: ShipmentStatus
    carrier: str | None
    tracking_number: str | None
    shipping_address: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
