from decimal import Decimal
from uuid import uuid4

import pytest

from app.database.models import (
    Category,
    InventoryMovement,
    Product,
)
from app.database.session import SessionLocal
from app.services.inventory import (
    InsufficientStockError,
    InventoryNotFoundError,
    InventoryService,
    InventoryValidationError,
)


def create_product(session) -> Product:
    """Create a minimal valid product for inventory tests."""
    category = Category(
        name=f"Test Category {uuid4().hex[:8]}",
        slug=f"test-category-{uuid4().hex[:8]}",
    )
    session.add(category)
    session.flush()

    product = Product(
        name=f"Test Product {uuid4().hex[:8]}",
        slug=f"test-product-{uuid4().hex[:8]}",
        sku=f"TEST-{uuid4().hex[:8].upper()}",
        base_price=Decimal("100.00"),
        category_id=category.id,
    )
    session.add(product)
    session.flush()

    return product


@pytest.fixture
def session():
    """Provide a database session rolled back after each test."""
    db = SessionLocal()

    try:
        yield db
        db.rollback()
    finally:
        db.close()


def test_create_location_and_inventory(session):
    """Create a location and inventory item."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Main Warehouse",
        code=f"WH-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=20,
        low_stock_threshold=5,
    )

    assert location.id is not None
    assert item.id is not None
    assert item.product_id == product.id
    assert item.location_id == location.id
    assert item.quantity == 20
    assert item.reserved_quantity == 0


def test_receive_stock_creates_movement(session):
    """Receiving stock increases quantity and creates an audit record."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Receiving Warehouse",
        code=f"RCV-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=10,
    )

    service.receive_stock(
        inventory_item_id=item.id,
        quantity=15,
        reason="Supplier delivery",
    )

    session.flush()

    refreshed = service.repository.get_item(item.id)

    assert refreshed is not None
    assert refreshed.quantity == 25

    movement = session.query(InventoryMovement).filter_by(
        inventory_item_id=item.id
    ).one()

    assert movement.movement_type == "RECEIVE"
    assert movement.quantity_change == 15
    assert movement.reason == "Supplier delivery"


def test_reserve_and_release_stock(session):
    """Reserve and release available stock."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Reserve Warehouse",
        code=f"RES-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=20,
    )

    service.reserve_stock(
        inventory_item_id=item.id,
        quantity=8,
    )

    assert item.reserved_quantity == 8

    service.release_reservation(
        inventory_item_id=item.id,
        quantity=3,
    )

    assert item.reserved_quantity == 5


def test_reserve_more_than_available_fails(session):
    """Cannot reserve more stock than is available."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Limited Warehouse",
        code=f"LIM-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=10,
    )

    with pytest.raises(InsufficientStockError):
        service.reserve_stock(
            inventory_item_id=item.id,
            quantity=11,
        )


def test_sell_stock_reduces_quantity(session):
    """Selling stock decreases available quantity."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Sales Warehouse",
        code=f"SALE-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=20,
    )

    service.sell_stock(
        inventory_item_id=item.id,
        quantity=7,
        reason="Customer order",
    )

    assert item.quantity == 13

    movement = session.query(InventoryMovement).filter_by(
        inventory_item_id=item.id
    ).one()

    assert movement.movement_type == "SALE"
    assert movement.quantity_change == -7


def test_return_and_damage_stock(session):
    """Returns increase stock while damage decreases stock."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Returns Warehouse",
        code=f"RET-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=20,
    )

    service.return_stock(
        inventory_item_id=item.id,
        quantity=5,
    )

    assert item.quantity == 25

    service.damage_stock(
        inventory_item_id=item.id,
        quantity=4,
        reason="Damaged packaging",
    )

    assert item.quantity == 21

    movements = (
        session.query(InventoryMovement)
        .filter_by(inventory_item_id=item.id)
        .order_by(InventoryMovement.created_at)
        .all()
    )

    assert len(movements) == 2
    assert movements[0].movement_type == "RETURN"
    assert movements[0].quantity_change == 5
    assert movements[1].movement_type == "DAMAGE"
    assert movements[1].quantity_change == -4


def test_adjust_stock(session):
    """Manual adjustment changes quantity and records an audit event."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Adjustment Warehouse",
        code=f"ADJ-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=10,
    )

    service.adjust_stock(
        inventory_item_id=item.id,
        quantity_change=5,
        reason="Physical stock count",
    )

    assert item.quantity == 15

    movement = session.query(InventoryMovement).filter_by(
        inventory_item_id=item.id
    ).one()

    assert movement.movement_type == "ADJUSTMENT"
    assert movement.quantity_change == 5


def test_invalid_quantity_fails(session):
    """Zero or negative quantities are rejected."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Validation Warehouse",
        code=f"VAL-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=10,
    )

    with pytest.raises(InventoryValidationError):
        service.receive_stock(
            inventory_item_id=item.id,
            quantity=0,
        )

    with pytest.raises(InventoryValidationError):
        service.receive_stock(
            inventory_item_id=item.id,
            quantity=-1,
        )


def test_duplicate_product_location_fails(session):
    """Only one inventory item is allowed per product/location."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Unique Warehouse",
        code=f"UNQ-{uuid4().hex[:8].upper()}",
    )

    service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
    )

    with pytest.raises(InventoryValidationError):
        service.create_inventory_item(
            product_id=product.id,
            location_id=location.id,
        )


def test_missing_inventory_item_fails(session):
    """Operations on nonexistent inventory fail cleanly."""
    service = InventoryService(session)

    with pytest.raises(InventoryNotFoundError):
        service.receive_stock(
            inventory_item_id=uuid4(),
            quantity=5,
        )


def test_reservation_cannot_exceed_quantity(session):
    """Reserved stock cannot exceed total quantity."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Reservation Warehouse",
        code=f"RSL-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=10,
    )

    service.reserve_stock(
        inventory_item_id=item.id,
        quantity=10,
    )

    assert item.reserved_quantity == 10

    with pytest.raises(InsufficientStockError):
        service.reserve_stock(
            inventory_item_id=item.id,
            quantity=1,
        )


def test_low_stock_threshold_is_preserved(session):
    """Low-stock configuration is stored correctly."""
    product = create_product(session)
    service = InventoryService(session)

    location = service.create_location(
        name="Threshold Warehouse",
        code=f"THR-{uuid4().hex[:8].upper()}",
    )

    item = service.create_inventory_item(
        product_id=product.id,
        location_id=location.id,
        quantity=50,
        low_stock_threshold=12,
    )

    assert item.low_stock_threshold == 12
