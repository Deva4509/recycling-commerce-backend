from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.inventory import InventoryItem
    from app.database.models.inventory_location import InventoryLocation


class InventoryMovementType(StrEnum):
    """Supported inventory movement types."""

    RECEIVE = "RECEIVE"
    SALE = "SALE"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"
    DAMAGE = "DAMAGE"
    TRANSFER = "TRANSFER"


class InventoryMovement(UUIDTimestampMixin, Base):
    """Audit record for a change in inventory quantity."""

    __tablename__ = "inventory_movements"

    inventory_item_id: Mapped[UUID] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    location_id: Mapped[UUID] = mapped_column(
        ForeignKey("inventory_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    movement_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    quantity_change: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reference_id: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    inventory_item: Mapped["InventoryItem"] = relationship(
        "InventoryItem",
        back_populates="movements",
    )

    location: Mapped["InventoryLocation"] = relationship(
        "InventoryLocation",
        back_populates="movements",
    )
