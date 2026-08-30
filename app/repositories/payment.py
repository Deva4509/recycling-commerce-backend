from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.payment import Payment


class PaymentRepository:
    """Data-access operations for payments."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_payment(self, payment_id: UUID) -> Payment | None:
        """Return a payment by ID."""
        return self.session.get(Payment, payment_id)

    def get_payment_for_update(self, payment_id: UUID) -> Payment | None:
        """Return a payment with a row-level lock."""
        statement = (
            select(Payment)
            .where(Payment.id == payment_id)
            .with_for_update()
        )
        return self.session.scalar(statement)

    def get_payment_by_provider_id(
        self,
        provider_payment_id: str,
    ) -> Payment | None:
        """Return a payment by its provider transaction ID."""
        statement = select(Payment).where(
            Payment.provider_payment_id == provider_payment_id
        )
        return self.session.scalar(statement)

    def list_payments_by_order(
        self,
        order_id: UUID,
    ) -> list[Payment]:
        """Return payments belonging to an order."""
        statement = (
            select(Payment)
            .where(Payment.order_id == order_id)
            .order_by(Payment.created_at)
        )
        return list(self.session.scalars(statement).all())

    def add_payment(self, payment: Payment) -> Payment:
        """Add a payment to the current transaction."""
        self.session.add(payment)
        self.session.flush()
        return payment
