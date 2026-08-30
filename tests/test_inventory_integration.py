from decimal import Decimal
from uuid import uuid4

import pytest

from app.database.models import Category, Product
from app.database.session import SessionLocal
from app.services.inventory import (
    InsufficientStockError,
    InventoryService,
    InventoryValidationError,
)


def create_product(session, category):
    product = Product(
        id=uuid4(),
        name="Recycled Test Product",
        slug=f"recycled-test-{uuid4()}",
        sku=f"TEST-{uuid4()}",
        base_price=Decimal("199.00"),
        currency="INR",
        category_id=category.id,
    )
    session.add(product)
    session.flush()
    return product


def create_category(session):
    category = Category(
        id=uuid4(),
        name=f"Test Category {uuid4()}",
        slug=f"test-category-{uuid4()}",
    )
    session.add(category)
    session.flush()
    return category


def test_inventory_full_stock_workflow():
    session = SessionLocal()

    try:
        service = InventoryService(session)

        category = create_category(session)
        product = create_product(session, category)

        location = service.create_location(
            name="Integration Warehouse",
            code=f"INT-{uuid4().hex[:8]}",
        )

        item = service.create_item(
            product_id=product.id,
            location_id=location.id,
            quantity=100,
            low_stock_threshold=10,
        )

        assert item.quantity == 100
        assert item.reserved_quantity == 0

        service.receive_stock(
            inventory_item_id=item.id,
            quantity=50,
            reason="Integration test receiving",
        )

        assert item.quantity == 150

        service.reserve_stock(
            inventory_item_id=item.id,
            quantity=30,
        )

        assert item.reserved_quantity == 30

        service.release_reservation(
            inventory_item_id=item.id,
            quantity=10,
        )

        assert item.reserved_quantity == 20

        service.sell_stock(
            inventory_item_id=item.id,
            quantity=50,
        )

        assert item.quantity == 100

        service.return_stock(
            inventory_item_id=item.id,
            quantity=10,
        )

        assert item.quantity == 110

        service.damage_stock(
            inventory_item_id=item.id,
            quantity=5,
        )

        assert item.quantity == 105

        service.adjust_stock(
            inventory_item_id=item.id,
            quantity_change=15,
            reason="Integration adjustment",
        )

        assert item.quantity == 120

        movements = service.list_movements(item.id)

        assert len(movements) == 5
        assert [movement.quantity_change for movement in movements] == [
            50,
            -50,
            10,
            -5,
            15,
        ]

        session.commit()

    finally:
        session.rollback()
        session.close()


def test_inventory_prevents_overselling():
    session = SessionLocal()

    try:
        service = InventoryService(session)

        category = create_category(session)
        product = create_product(session, category)

        location = service.create_location(
            name="Stock Test Warehouse",
            code=f"STK-{uuid4().hex[:8]}",
        )

        item = service.create_item(
            product_id=product.id,
            location_id=location.id,
            quantity=10,
        )

        with pytest.raises(InsufficientStockError):
            service.sell_stock(
                inventory_item_id=item.id,
                quantity=11,
            )

        assert item.quantity == 10

        session.rollback()

    finally:
        session.close()


def test_inventory_prevents_reserving_more_than_available():
    session = SessionLocal()

    try:
        service = InventoryService(session)

        category = create_category(session)
        product = create_product(session, category)

        location = service.create_location(
            name="Reservation Test Warehouse",
            code=f"RES-{uuid4().hex[:8]}",
        )

        item = service.create_item(
            product_id=product.id,
            location_id=location.id,
            quantity=10,
        )

        service.reserve_stock(
            inventory_item_id=item.id,
            quantity=6,
        )

        with pytest.raises(InsufficientStockError):
            service.reserve_stock(
                inventory_item_id=item.id,
                quantity=5,
            )

        assert item.reserved_quantity == 6

        session.rollback()

    finally:
        session.close()


def test_inventory_prevents_invalid_reservation_release():
    session = SessionLocal()

    try:
        service = InventoryService(session)

        category = create_category(session)
        product = create_product(session, category)

        location = service.create_location(
            name="Release Test Warehouse",
            code=f"REL-{uuid4().hex[:8]}",
        )

        item = service.create_item(
            product_id=product.id,
            location_id=location.id,
            quantity=20,
        )

        service.reserve_stock(
            inventory_item_id=item.id,
            quantity=5,
        )

        with pytest.raises(InventoryValidationError):
            service.release_reservation(
                inventory_item_id=item.id,
                quantity=6,
            )

        assert item.reserved_quantity == 5

        session.rollback()

    finally:
        session.close()
