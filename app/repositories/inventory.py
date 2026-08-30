from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.inventory import InventoryItem
from app.database.models.inventory_location import InventoryLocation
from app.database.models.inventory_movement import InventoryMovement


class InventoryRepository:
    """Data-access operations for inventory records."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_location(
        self,
        location_id: UUID,
    ) -> InventoryLocation | None:
        """Return an inventory location by ID."""
        return self.session.get(InventoryLocation, location_id)

    def get_location_by_code(
        self,
        code: str,
    ) -> InventoryLocation | None:
        """Return an inventory location by its unique code."""
        statement = select(InventoryLocation).where(
            InventoryLocation.code == code
        )
        return self.session.scalar(statement)

    def get_item(
        self,
        inventory_item_id: UUID,
    ) -> InventoryItem | None:
        """Return an inventory item by ID."""
        return self.session.get(InventoryItem, inventory_item_id)

    def get_item_for_update(
        self,
        inventory_item_id: UUID,
    ) -> InventoryItem | None:
        """Return an inventory item with a row-level lock."""
        statement = (
            select(InventoryItem)
            .where(InventoryItem.id == inventory_item_id)
            .with_for_update()
        )
        return self.session.scalar(statement)

    def get_item_by_product_location(
        self,
        product_id: UUID,
        location_id: UUID,
        *,
        for_update: bool = False,
    ) -> InventoryItem | None:
        """Return inventory for a product at a specific location."""
        statement = select(InventoryItem).where(
            InventoryItem.product_id == product_id,
            InventoryItem.location_id == location_id,
        )

        if for_update:
            statement = statement.with_for_update()

        return self.session.scalar(statement)

    def list_items_by_product(
        self,
        product_id: UUID,
    ) -> list[InventoryItem]:
        """Return all inventory records for a product."""
        statement = (
            select(InventoryItem)
            .where(InventoryItem.product_id == product_id)
            .order_by(InventoryItem.created_at)
        )
        return list(self.session.scalars(statement).all())

    def list_items_by_location(
        self,
        location_id: UUID,
    ) -> list[InventoryItem]:
        """Return all inventory records at a location."""
        statement = (
            select(InventoryItem)
            .where(InventoryItem.location_id == location_id)
            .order_by(InventoryItem.created_at)
        )
        return list(self.session.scalars(statement).all())

    def add_item(
        self,
        item: InventoryItem,
    ) -> InventoryItem:
        """Add an inventory item to the current transaction."""
        self.session.add(item)
        self.session.flush()
        return item

    def add_movement(
        self,
        movement: InventoryMovement,
    ) -> InventoryMovement:
        """Add an inventory movement to the current transaction."""
        self.session.add(movement)
        self.session.flush()
        return movement

    def create_location(
        self,
        location: InventoryLocation,
    ) -> InventoryLocation:
        """Add an inventory location to the current transaction."""
        self.session.add(location)
        self.session.flush()
        return location

    def list_locations(self) -> list[InventoryLocation]:
        """Return all inventory locations."""
        statement = (
            select(InventoryLocation)
            .order_by(InventoryLocation.created_at)
        )
        return list(self.session.scalars(statement).all())

    def create_item(
        self,
        *,
        product_id: UUID,
        location_id: UUID,
        quantity: int,
        reserved_quantity: int,
        low_stock_threshold: int,
        is_active: bool,
    ) -> InventoryItem:
        """Create inventory for a product at a location."""
        item = InventoryItem(
            product_id=product_id,
            location_id=location_id,
            quantity=quantity,
            reserved_quantity=reserved_quantity,
            low_stock_threshold=low_stock_threshold,
            is_active=is_active,
        )

        self.session.add(item)
        self.session.flush()
        return item

    def list_movements(
        self,
        inventory_item_id: UUID,
    ) -> list[InventoryMovement]:
        """Return inventory movements for an item."""
        statement = (
            select(InventoryMovement)
            .where(
                InventoryMovement.inventory_item_id == inventory_item_id
            )
            .order_by(InventoryMovement.created_at)
        )
        return list(self.session.scalars(statement).all())
