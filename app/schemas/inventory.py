from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.inventory_movement import InventoryMovementType


class InventoryLocationCreate(BaseModel):
    """Create an inventory location."""

    name: str = Field(min_length=1, max_length=150)
    code: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class InventoryLocationRead(BaseModel):
    """Inventory location response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    code: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class InventoryItemCreate(BaseModel):
    """Create inventory for a product at a location."""

    product_id: UUID
    location_id: UUID
    quantity: int = Field(default=0, ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    is_active: bool = True


class InventoryItemRead(BaseModel):
    """Inventory item response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    location_id: UUID
    quantity: int
    reserved_quantity: int
    low_stock_threshold: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class InventoryMovementCreate(BaseModel):
    """Create an inventory movement."""

    inventory_item_id: UUID
    location_id: UUID
    movement_type: InventoryMovementType
    quantity_change: int
    reference_id: UUID | None = None
    reason: str | None = None


class InventoryMovementRead(BaseModel):
    """Inventory movement response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inventory_item_id: UUID
    location_id: UUID
    movement_type: str
    quantity_change: int
    reference_id: UUID | None
    reason: str | None
    created_at: datetime
    updated_at: datetime
