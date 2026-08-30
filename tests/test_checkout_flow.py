from decimal import Decimal
from uuid import uuid4

from app.database.models import (
    Category,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    Product,
    Role,
    RoleName,
    ShipmentStatus,
    User,
)
from app.database.session import SessionLocal
from app.services.inventory import InventoryService
from app.services.order import OrderService
from app.services.payment import PaymentService
from app.services.shipment import ShipmentService


def create_user(session):
    role = session.query(Role).filter(Role.name == RoleName.CUSTOMER.value).first()

    if role is None:
        role = Role(
            id=uuid4(),
            name=RoleName.CUSTOMER.value,
            description="Customer",
        )
        session.add(role)
        session.flush()

    user = User(
        id=uuid4(),
        email=f"checkout-{uuid4().hex[:8]}@example.com",
        password_hash="test",
        first_name="Checkout",
        last_name="Test",
        role_id=role.id,
    )
    session.add(user)
    session.flush()
    return user


def create_product(session):
    category = Category(
        id=uuid4(),
        name=f"Checkout Category {uuid4().hex[:8]}",
        slug=f"checkout-{uuid4().hex[:12]}",
    )
    session.add(category)
    session.flush()

    product = Product(
        id=uuid4(),
        category_id=category.id,
        name="Recycled Test Product",
        slug=f"recycled-product-{uuid4().hex[:12]}",
        sku=f"REC-{uuid4().hex[:8].upper()}",
        description="Checkout integration test product",
        base_price=Decimal("100.00"),
        is_active=True,
    )
    session.add(product)
    session.flush()
    return product


def test_complete_checkout_payment_shipping_flow():
    session = SessionLocal()

    try:
        user = create_user(session)
        product = create_product(session)

        inventory = InventoryService(session)

        location = inventory.create_location(
            name="Checkout Warehouse",
            code=f"CHK-{uuid4().hex[:8]}",
        )

        item = inventory.create_item(
            product_id=product.id,
            location_id=location.id,
            quantity=10,
        )

        order_service = OrderService(session)

        order = order_service.create_order(
            user_id=user.id,
            items=[
                {
                    "product_id": product.id,
                    "location_id": location.id,
                    "quantity": 2,
                }
            ],
            shipping_address="Test Shipping Address",
        )

        assert order.status == OrderStatus.PENDING.value
        assert order.total_amount == Decimal("200.00")

        inventory_item = inventory.get_item(item.id)
        assert inventory_item.reserved_quantity == 2

        payment_service = PaymentService(session)

        payment = payment_service.create_payment(
            order_id=order.id,
            method=PaymentMethod.UPI,
            provider="test",
        )

        assert payment.status == PaymentStatus.PENDING.value

        payment_service.mark_processing(payment.id)

        payment = payment_service.mark_paid(
            payment.id,
            provider_payment_id="test_payment_123",
        )

        assert payment.status == PaymentStatus.PAID.value

        session.refresh(order)
        assert order.payment_status == PaymentStatus.PAID.value

        shipment_service = ShipmentService(session)

        shipment = shipment_service.create_shipment(
            order_id=order.id,
            carrier="Test Carrier",
            tracking_number="TRACK123",
        )

        assert shipment.status == ShipmentStatus.PENDING.value

        shipment_service.process_shipment(shipment.id)
        shipment_service.ship(shipment.id)
        shipment_service.mark_in_transit(shipment.id)
        shipment_service.mark_out_for_delivery(shipment.id)

        shipment = shipment_service.mark_delivered(shipment.id)

        assert shipment.status == ShipmentStatus.DELIVERED.value

        session.refresh(order)
        assert order.status == OrderStatus.DELIVERED.value

        session.commit()

    finally:
        session.close()
