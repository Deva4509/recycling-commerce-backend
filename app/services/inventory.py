from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.inventory import InventoryItem
from app.database.models.inventory_location import InventoryLocation
from app.database.models.inventory_movement import (
    InventoryMovement,
    InventoryMovementType,
)
from app.repositories.inventory import InventoryRepository


class InventoryServiceError(Exception):
    """Base exception for inventory business-rule failures."""


class InventoryNotFoundError(InventoryServiceError):
    """Raised when an inventory resource does not exist."""


class InsufficientStockError(InventoryServiceError):
    """Raised when available stock is insufficient."""


class InventoryValidationError(InventoryServiceError):
    """Raised when an inventory operation is invalid."""


class InventoryService:
    """Business logic for inventory management."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = InventoryRepository(session)

    def create_location(
        self,
        *,
        name: str,
        code: str,
        description: str | None = None,
    ) -> InventoryLocation:
        """Create a new inventory location."""
        normalized_code = code.strip().upper()

        if not normalized_code:
            raise InventoryValidationError(
                "Inventory location code cannot be empty."
            )

        existing = self.repository.get_location_by_code(normalized_code)

        if existing is not None:
            raise InventoryValidationError(
                f"Inventory location '{normalized_code}' already exists."
            )

        location = InventoryLocation(
            name=name.strip(),
            code=normalized_code,
            description=description,
        )

        self.session.add(location)
        self.session.flush()

        return location

    def create_inventory_item(
        self,
        *,
        product_id: UUID,
        location_id: UUID,
        quantity: int = 0,
        low_stock_threshold: int = 10,
    ) -> InventoryItem:
        """Create inventory for a product at a location."""
        if quantity < 0:
            raise InventoryValidationError(
                "Initial inventory quantity cannot be negative."
            )

        if low_stock_threshold < 0:
            raise InventoryValidationError(
                "Low-stock threshold cannot be negative."
            )

        location = self.repository.get_location(location_id)

        if location is None:
            raise InventoryNotFoundError(
                f"Inventory location '{location_id}' was not found."
            )

        existing = self.repository.get_item_by_product_location(
            product_id,
            location_id,
        )

        if existing is not None:
            raise InventoryValidationError(
                "Inventory already exists for this product and location."
            )

        item = InventoryItem(
            product_id=product_id,
            location_id=location_id,
            quantity=quantity,
            reserved_quantity=0,
            low_stock_threshold=low_stock_threshold,
        )

        try:
            self.repository.add_item(item)
        except IntegrityError as exc:
            self.session.rollback()
            raise InventoryValidationError(
                "Unable to create inventory item."
            ) from exc

        return item

    def receive_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
        reason: str | None = None,
        reference_id: UUID | None = None,
    ) -> InventoryItem:
        """Receive stock into an inventory item."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        item.quantity += quantity

        self._record_movement(
            item=item,
            movement_type=InventoryMovementType.RECEIVE,
            quantity_change=quantity,
            reason=reason,
            reference_id=reference_id,
        )

        self.session.flush()

        return item

    def reserve_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
    ) -> InventoryItem:
        """Reserve available stock for an order."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        available = item.quantity - item.reserved_quantity

        if quantity > available:
            raise InsufficientStockError(
                f"Insufficient available stock. "
                f"Requested {quantity}, available {available}."
            )

        item.reserved_quantity += quantity

        self.session.flush()

        return item

    def release_reservation(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
    ) -> InventoryItem:
        """Release previously reserved stock."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        if quantity > item.reserved_quantity:
            raise InventoryValidationError(
                "Cannot release more stock than currently reserved."
            )

        item.reserved_quantity -= quantity

        self.session.flush()

        return item

    def sell_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
        reference_id: UUID | None = None,
        reason: str | None = None,
    ) -> InventoryItem:
        """Consume stock for a completed sale."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        available = item.quantity - item.reserved_quantity

        if quantity > available:
            raise InsufficientStockError(
                f"Insufficient available stock. "
                f"Requested {quantity}, available {available}."
            )

        item.quantity -= quantity

        self._record_movement(
            item=item,
            movement_type=InventoryMovementType.SALE,
            quantity_change=-quantity,
            reason=reason,
            reference_id=reference_id,
        )

        self.session.flush()

        return item

    def return_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
        reference_id: UUID | None = None,
        reason: str | None = None,
    ) -> InventoryItem:
        """Add returned stock back into inventory."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        item.quantity += quantity

        self._record_movement(
            item=item,
            movement_type=InventoryMovementType.RETURN,
            quantity_change=quantity,
            reason=reason,
            reference_id=reference_id,
        )

        self.session.flush()

        return item

    def damage_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity: int,
        reason: str | None = None,
        reference_id: UUID | None = None,
    ) -> InventoryItem:
        """Remove damaged stock from inventory."""
        self._validate_positive_quantity(quantity)

        item = self._get_locked_item(inventory_item_id)

        available = item.quantity - item.reserved_quantity

        if quantity > available:
            raise InsufficientStockError(
                f"Insufficient available stock. "
                f"Requested {quantity}, available {available}."
            )

        item.quantity -= quantity

        self._record_movement(
            item=item,
            movement_type=InventoryMovementType.DAMAGE,
            quantity_change=-quantity,
            reason=reason,
            reference_id=reference_id,
        )

        self.session.flush()

        return item

    def adjust_stock(
        self,
        *,
        inventory_item_id: UUID,
        quantity_change: int,
        reason: str,
        reference_id: UUID | None = None,
    ) -> InventoryItem:
        """Apply a manual inventory adjustment."""
        if quantity_change == 0:
            raise InventoryValidationError(
                "Inventory adjustment cannot be zero."
            )

        item = self._get_locked_item(inventory_item_id)

        new_quantity = item.quantity + quantity_change

        if new_quantity < 0:
            raise InventoryValidationError(
                "Inventory adjustment cannot make quantity negative."
            )

        available_after = new_quantity - item.reserved_quantity

        if available_after < 0:
            raise InventoryValidationError(
                "Inventory adjustment cannot reduce stock below "
                "the currently reserved quantity."
            )

        item.quantity = new_quantity

        self._record_movement(
            item=item,
            movement_type=InventoryMovementType.ADJUSTMENT,
            quantity_change=quantity_change,
            reason=reason,
            reference_id=reference_id,
        )

        self.session.flush()

        return item

    def _get_locked_item(
        self,
        inventory_item_id: UUID,
    ) -> InventoryItem:
        """Get an inventory item while locking its database row."""
        item = self.repository.get_item_for_update(inventory_item_id)

        if item is None:
            raise InventoryNotFoundError(
                f"Inventory item '{inventory_item_id}' was not found."
            )

        if not item.is_active:
            raise InventoryValidationError(
                "Inventory item is inactive."
            )

        return item

    def _record_movement(
        self,
        *,
        item: InventoryItem,
        movement_type: InventoryMovementType,
        quantity_change: int,
        reason: str | None,
        reference_id: UUID | None,
    ) -> InventoryMovement:
        """Create an inventory audit record."""
        movement = InventoryMovement(
            id=uuid4(),
            inventory_item_id=item.id,
            location_id=item.location_id,
            movement_type=movement_type.value,
            quantity_change=quantity_change,
            reason=reason,
            reference_id=reference_id,
        )

        return self.repository.add_movement(movement)

    @staticmethod
    def _validate_positive_quantity(quantity: int) -> None:
        """Validate a quantity that must be greater than zero."""
        if quantity <= 0:
            raise InventoryValidationError(
                "Quantity must be greater than zero."
            )


    def list_locations(self) -> list[InventoryLocation]:
        """Return all inventory locations."""
        return self.repository.list_locations()


    def create_item(
        self,
        product_id: UUID,
        location_id: UUID,
        quantity: int = 0,
        reserved_quantity: int = 0,
        low_stock_threshold: int = 10,
        is_active: bool = True,
    ) -> InventoryItem:
        """Create inventory for a product at a location."""
        if quantity < 0:
            raise InventoryValidationError("Quantity cannot be negative.")

        if reserved_quantity < 0:
            raise InventoryValidationError(
                "Reserved quantity cannot be negative."
            )

        if reserved_quantity > quantity:
            raise InventoryValidationError(
                "Reserved quantity cannot exceed quantity."
            )

        if low_stock_threshold < 0:
            raise InventoryValidationError(
                "Low-stock threshold cannot be negative."
            )

        try:
            return self.repository.create_item(
                product_id=product_id,
                location_id=location_id,
                quantity=quantity,
                reserved_quantity=reserved_quantity,
                low_stock_threshold=low_stock_threshold,
                is_active=is_active,
            )
        except IntegrityError as exc:
            self.session.rollback()
            raise InventoryValidationError(
                "Inventory item could not be created."
            ) from exc


    def get_item(self, inventory_item_id: UUID) -> InventoryItem:
        """Return an inventory item by ID."""
        item = self.repository.get_item(inventory_item_id)

        if item is None:
            raise InventoryNotFoundError(
                f"Inventory item {inventory_item_id} was not found."
            )

        return item


    def list_movements(
        self,
        inventory_item_id: UUID,
    ) -> list[InventoryMovement]:
        """Return movements for an inventory item."""
        self.get_item(inventory_item_id)
        return self.repository.list_movements(inventory_item_id)
