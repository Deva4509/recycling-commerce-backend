from uuid import uuid4

from sqlalchemy import select

from app.database.models import (
    Order,
    OrderStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
    Role,
    RoleName,
    User,
)
from app.database.session import SessionLocal
from app.services.payment import (
    PaymentService,
    PaymentValidationError,
)


def create_user(session):
    role = session.scalar(
        select(Role).where(Role.name == RoleName.CUSTOMER.value)
    )

    if role is None:
        role = Role(
            name=RoleName.CUSTOMER.value,
            description="Customer role",
        )
        session.add(role)
        session.flush()

    user = User(
        email=f"payment-{uuid4().hex[:8]}@example.com",
        first_name="Payment",
        last_name="Test",
        role_id=role.id,
    )

    session.add(user)
    session.flush()

    return user


def create_order(session, user):
    order = Order(
        order_number=f"RP-{uuid4().hex[:12].upper()}",
        user_id=user.id,
        status=OrderStatus.PENDING.value,
        payment_status="PENDING",
        subtotal=100,
        shipping_amount=0,
        tax_amount=0,
        discount_amount=0,
        total_amount=100,
        currency="INR",
        shipping_address="Test Address",
    )

    session.add(order)
    session.flush()

    return order


def test_payment_lifecycle():
    session = SessionLocal()

    try:
        user = create_user(session)
        order = create_order(session, user)

        service = PaymentService(session)

        payment = service.create_payment(
            order_id=order.id,
            method=PaymentMethod.UPI,
        )

        assert payment.status == PaymentStatus.PENDING.value

        payment = service.mark_processing(payment.id)

        assert payment.status == PaymentStatus.PROCESSING.value

        payment = service.mark_paid(payment.id)

        assert payment.status == PaymentStatus.PAID.value

        session.commit()

    finally:
        session.close()


def test_payment_failure():
    session = SessionLocal()

    try:
        user = create_user(session)
        order = create_order(session, user)

        service = PaymentService(session)

        payment = service.create_payment(
            order_id=order.id,
            method=PaymentMethod.CARD,
        )

        payment = service.mark_failed(
            payment.id,
            failure_reason="Test payment failure",
        )

        assert payment.status == PaymentStatus.FAILED.value
        assert payment.failure_reason == "Test payment failure"

        session.commit()

    finally:
        session.close()


def test_paid_payment_cannot_be_paid_again():
    session = SessionLocal()

    try:
        user = create_user(session)
        order = create_order(session, user)

        service = PaymentService(session)

        payment = service.create_payment(
            order_id=order.id,
            method=PaymentMethod.UPI,
        )

        service.mark_paid(payment.id)

        try:
            service.mark_paid(payment.id)
            assert False, "Expected PaymentValidationError"
        except PaymentValidationError:
            pass

        session.rollback()

    finally:
        session.close()


def test_refund_requires_paid_payment():
    session = SessionLocal()

    try:
        user = create_user(session)
        order = create_order(session, user)

        service = PaymentService(session)

        payment = service.create_payment(
            order_id=order.id,
            method=PaymentMethod.CARD,
        )

        try:
            service.refund_payment(payment.id)
            assert False, "Expected PaymentValidationError"
        except PaymentValidationError:
            pass

        session.rollback()

    finally:
        session.close()
