from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.database.models import (
    BulkOrderProductConfig,
    BulkOrderRequest,
    BulkOrderStatus,
    Category,
    InventoryItem,
    InventoryLocation,
    Order,
    Product,
    Role,
    RoleName,
    User,
)
from app.database.models.base import Base
from app.dependencies.auth import get_current_user
from app.main import app


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()

    customer_role = Role(id=uuid4(), name=RoleName.CUSTOMER.value)
    staff_role = Role(id=uuid4(), name=RoleName.STAFF.value)
    category = Category(
        id=uuid4(),
        name="Bulk test category",
        slug=f"bulk-test-{uuid4()}",
        sort_order=0,
        is_active=True,
    )
    customer = User(
        id=uuid4(),
        email=f"bulk-{uuid4()}@example.com",
        password_hash="test",
        first_name="Bulk",
        last_name="Customer",
        role_id=customer_role.id,
        status="ACTIVE",
    )
    product = Product(
        id=uuid4(),
        name="Bulk test product",
        slug=f"bulk-product-{uuid4()}",
        sku=f"BULK-{uuid4()}",
        base_price=Decimal("50.00"),
        currency="INR",
        category_id=category.id,
        is_active=True,
    )
    session.add_all([customer_role, staff_role, category, customer, product])
    session.commit()

    try:
        yield session, customer, staff_role, product
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db):
    session, customer, _, _ = db
    identity = {"user": customer}

    def override_db():
        yield session

    def override_user():
        return identity["user"]

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    with TestClient(app) as test_client:
        yield test_client, identity
    app.dependency_overrides.clear()


def customer_payload(product_id, **overrides):
    return {
        "product_id": str(product_id),
        "quantity": 10,
        "organization_name": "Recycling Cooperative",
        "contact_name": "Alex Green",
        "contact_email": "alex@example.com",
        "contact_phone": "+919876543210",
        "delivery_address": "12 Circular Road, Bengaluru",
        "delivery_pin_code": "560001",
        **overrides,
    }


def enable_bulk_order(session, product_id, *, minimum=10, enabled=True):
    config = BulkOrderProductConfig(
        product_id=product_id,
        minimum_quantity=minimum,
        is_enabled=enabled,
    )
    session.add(config)
    session.commit()
    return config


def create_staff(session, role):
    user = User(
        id=uuid4(),
        email=f"staff-{uuid4()}@example.com",
        password_hash="test",
        first_name="Bulk",
        last_name="Staff",
        role_id=role.id,
        status="ACTIVE",
    )
    session.add(user)
    session.commit()
    return user


def create_request(session, user, product, **overrides):
    values = {
        "user_id": user.id,
        "product_id": product.id,
        "quantity": 10,
        "organization_name": "Cooperative",
        "contact_name": "Alex",
        "contact_email": "alex@example.com",
        "contact_phone": "+919876543210",
        "delivery_address": "12 Circular Road",
        "delivery_pin_code": "560001",
        "minimum_quantity_snapshot": 10,
        "status": BulkOrderStatus.PENDING.value,
        **overrides,
    }
    request = BulkOrderRequest(**values)
    session.add(request)
    session.commit()
    return request


def test_customer_cannot_access_admin_endpoints(client, db):
    test_client, _ = client
    response = test_client.get("/api/v1/bulk-orders/admin")
    assert response.status_code == 403


def test_bulk_request_requires_enabled_product_and_minimum_quantity(client, db):
    test_client, _ = client
    session, _, _, product = db
    enable_bulk_order(session, product.id, minimum=25, enabled=True)

    below_minimum = test_client.post(
        "/api/v1/bulk-orders",
        json=customer_payload(product.id, quantity=24),
    )
    assert below_minimum.status_code == 422

    session.query(BulkOrderProductConfig).filter_by(
        product_id=product.id
    ).update({"is_enabled": False})
    session.commit()
    disabled = test_client.post(
        "/api/v1/bulk-orders",
        json=customer_payload(product.id, quantity=25),
    )
    assert disabled.status_code == 409


def test_customer_ownership_is_enforced_and_admin_notes_are_private(client, db):
    test_client, identity = client
    session, customer, _, product = db
    request = create_request(
        session,
        customer,
        product,
        admin_notes="Internal procurement note",
    )

    own_response = test_client.get(f"/api/v1/bulk-orders/{request.id}")
    assert own_response.status_code == 200
    assert "admin_notes" not in own_response.json()

    other_customer = User(
        id=uuid4(),
        email=f"other-{uuid4()}@example.com",
        password_hash="test",
        first_name="Other",
        last_name="Customer",
        role_id=customer.role_id,
        status="ACTIVE",
    )
    session.add(other_customer)
    session.commit()
    identity["user"] = other_customer
    other_response = test_client.get(f"/api/v1/bulk-orders/{request.id}")
    assert other_response.status_code == 404


def test_quote_values_and_expiry_are_validated(client, db):
    test_client, identity = client
    session, customer, staff_role, product = db
    request = create_request(
        session,
        customer,
        product,
        status=BulkOrderStatus.UNDER_REVIEW.value,
    )
    identity["user"] = create_staff(session, staff_role)

    negative_price = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/quote",
        json={"unit_price": -1, "valid_until": str(date.today() + timedelta(days=2))},
    )
    assert negative_price.status_code == 422
    past_date = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/quote",
        json={"unit_price": "12.50", "valid_until": str(date.today() - timedelta(days=1))},
    )
    assert past_date.status_code == 422


def test_quote_transitions_and_expiry(client, db):
    test_client, identity = client
    session, customer, staff_role, product = db
    request = create_request(
        session,
        customer,
        product,
        status=BulkOrderStatus.UNDER_REVIEW.value,
    )
    identity["user"] = create_staff(session, staff_role)
    quote = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/quote",
        json={
            "unit_price": "12.50",
            "valid_until": str(date.today() + timedelta(days=2)),
            "terms": "Delivery arranged separately",
        },
    )
    assert quote.status_code == 200
    assert quote.json()["quoted_total"] == "125.00"

    invalid_transition = test_client.patch(
        f"/api/v1/bulk-orders/admin/{request.id}",
        json={"status": "FULFILLED"},
    )
    assert invalid_transition.status_code == 409

    identity["user"] = customer
    accepted = test_client.post(f"/api/v1/bulk-orders/{request.id}/accept")
    assert accepted.status_code == 200
    repeated_accept = test_client.post(f"/api/v1/bulk-orders/{request.id}/accept")
    assert repeated_accept.status_code == 409

    expired = create_request(
        session,
        customer,
        product,
        status=BulkOrderStatus.QUOTE_SENT.value,
        quoted_unit_price=Decimal("10.00"),
        quoted_total=Decimal("100.00"),
        quote_valid_until=date.today() - timedelta(days=1),
    )
    expired_response = test_client.post(
        f"/api/v1/bulk-orders/{expired.id}/accept"
    )
    assert expired_response.status_code == 409


def test_conversion_checks_inventory_uses_quote_price_and_prevents_duplicates(client, db):
    test_client, identity = client
    session, customer, staff_role, product = db
    request = create_request(
        session,
        customer,
        product,
        quantity=12,
        status=BulkOrderStatus.ACCEPTED.value,
        quoted_unit_price=Decimal("31.25"),
        quoted_total=Decimal("375.00"),
        quote_valid_until=date.today() + timedelta(days=2),
    )
    identity["user"] = create_staff(session, staff_role)

    shortage = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/convert-to-order"
    )
    assert shortage.status_code == 409
    assert session.scalar(select(func.count()).select_from(Order)) == 0

    location = InventoryLocation(
        id=uuid4(),
        name="Bulk Warehouse",
        code=f"BULK-{uuid4().hex[:8]}",
        is_active=True,
    )
    stock = InventoryItem(
        id=uuid4(),
        product_id=product.id,
        location_id=location.id,
        quantity=20,
        reserved_quantity=0,
        is_active=True,
    )
    session.add_all([location, stock])
    session.commit()

    converted = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/convert-to-order"
    )
    assert converted.status_code == 201
    order = session.get(Order, converted.json()["id"])
    assert order is not None
    assert order.payment_status == "PENDING"
    assert order.total_amount == Decimal("375.00")
    assert order.items[0].unit_price == Decimal("31.25")
    session.refresh(stock)
    assert stock.reserved_quantity == 12

    duplicate = test_client.post(
        f"/api/v1/bulk-orders/admin/{request.id}/convert-to-order"
    )
    assert duplicate.status_code == 409
    assert session.scalar(select(func.count()).select_from(Order)) == 1
