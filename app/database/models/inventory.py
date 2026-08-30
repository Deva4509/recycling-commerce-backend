from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.inventory_location import InventoryLocation
    from app.database.models.inventory_movement import InventoryMovement
    from app.database.models.product import Product


class InventoryItem(UUIDTimestampMixin, Base):
    """Inventory quantity for a product at a specific location."""

    __tablename__ = "inventory_items"

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    location_id: Mapped[UUID] = mapped_column(
        ForeignKey("inventory_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )

    low_stock_threshold: Mapped[int] = mapped_column(
        Integer,
        default=10,
        server_default="10",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="inventory_items",
    )

    location: Mapped["InventoryLocation"] = relationship(
        "InventoryLocation",
        back_populates="inventory_items",
    )

    movements: Mapped[list["InventoryMovement"]] = relationship(
        "InventoryMovement",
        back_populates="inventory_item",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "location_id",
            name="uq_inventory_items_product_location",
        ),
    )
