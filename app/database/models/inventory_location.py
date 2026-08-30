from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.inventory import InventoryItem
    from app.database.models.inventory_movement import InventoryMovement


class InventoryLocation(UUIDTimestampMixin, Base):
    """Physical or logical location where inventory is stored."""

    __tablename__ = "inventory_locations"

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    inventory_items: Mapped[list["InventoryItem"]] = relationship(
        "InventoryItem",
        back_populates="location",
        cascade="all, delete-orphan",
    )

    movements: Mapped[list["InventoryMovement"]] = relationship(
        "InventoryMovement",
        back_populates="location",
    )
