from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.database.models.order import Order, PaymentStatus as OrderPaymentStatus
from app.database.models.payment import Payment, PaymentMethod, PaymentStatus
from app.repositories.payment import PaymentRepository
from app.repositories.order import OrderRepository


class PaymentServiceError(Exception):
    """Base exception for payment business-rule failures."""


class PaymentNotFoundError(PaymentServiceError):
    """Raised when a payment does not exist."""


class PaymentValidationError(PaymentServiceError):
    """Raised when a payment operation is invalid."""


class PaymentService:
    """Business logic for payment lifecycle management."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = PaymentRepository(session)
        self.order_repository = OrderRepository(session)

    def create_payment(
        self,
        *,
        order_id: UUID,
        method: PaymentMethod,
        provider: str | None = None,
    ) -> Payment:
        """Create a pending payment for an order."""
        order = self.order_repository.get_order(order_id)

        if order is None:
            raise PaymentValidationError(
                f"Order '{order_id}' was not found."
            )

        if order.status == "CANCELLED":
            raise PaymentValidationError(
                "Cannot create a payment for a cancelled order."
            )

        if order.payment_status == "PAID":
            raise PaymentValidationError(
                "Order has already been paid."
            )

        if order.total_amount <= 0:
            raise PaymentValidationError(
                "Order total must be greater than zero."
            )

        payment = Payment(
            id=uuid4(),
            order_id=order.id,
            amount=Decimal(order.total_amount),
            currency=order.currency,
            method=method.value,
            status=PaymentStatus.PENDING.value,
            provider=provider,
        )

        self.repository.add_payment(payment)

        order.payment_status = OrderPaymentStatus.PENDING.value

        self.session.flush()

        return payment

    def get_payment(self, payment_id: UUID) -> Payment:
        """Return a payment by ID."""
        payment = self.repository.get_payment(payment_id)

        if payment is None:
            raise PaymentNotFoundError(
                f"Payment '{payment_id}' was not found."
            )

        return payment

    def list_order_payments(self, order_id: UUID) -> list[Payment]:
        """Return all payments for an order."""
        order = self.order_repository.get_order(order_id)

        if order is None:
            raise PaymentValidationError(
                f"Order '{order_id}' was not found."
            )

        return self.repository.list_payments_by_order(order_id)

    def mark_processing(self, payment_id: UUID) -> Payment:
        """Move a pending payment into processing."""
        payment = self._get_locked_payment(payment_id)

        self._require_status(
            payment,
            {PaymentStatus.PENDING},
        )

        payment.status = PaymentStatus.PROCESSING.value
        self.session.flush()

        return payment

    def mark_paid(
        self,
        payment_id: UUID,
        *,
        provider_payment_id: str | None = None,
        provider_order_id: str | None = None,
    ) -> Payment:
        """Mark a payment as successfully paid."""
        payment = self._get_locked_payment(payment_id)

        self._require_status(
            payment,
            {PaymentStatus.PENDING, PaymentStatus.PROCESSING},
        )

        payment.status = PaymentStatus.PAID.value

        if provider_payment_id is not None:
            payment.provider_payment_id = provider_payment_id

        if provider_order_id is not None:
            payment.provider_order_id = provider_order_id

        order = self.order_repository.get_order(payment.order_id)

        if order is None:
            raise PaymentValidationError(
                f"Order '{payment.order_id}' was not found."
            )

        order.payment_status = OrderPaymentStatus.PAID.value

        self.session.flush()

        return payment

    def mark_failed(
        self,
        payment_id: UUID,
        *,
        failure_reason: str | None = None,
    ) -> Payment:
        """Mark a pending or processing payment as failed."""
        payment = self._get_locked_payment(payment_id)

        self._require_status(
            payment,
            {PaymentStatus.PENDING, PaymentStatus.PROCESSING},
        )

        payment.status = PaymentStatus.FAILED.value
        payment.failure_reason = failure_reason

        order = self.order_repository.get_order(payment.order_id)

        if order is not None:
            order.payment_status = OrderPaymentStatus.FAILED.value

        self.session.flush()

        return payment

    def refund_payment(
        self,
        payment_id: UUID,
    ) -> Payment:
        """Refund a successfully paid payment."""
        payment = self._get_locked_payment(payment_id)

        self._require_status(
            payment,
            {PaymentStatus.PAID},
        )

        payment.status = PaymentStatus.REFUNDED.value

        order = self.order_repository.get_order(payment.order_id)

        if order is not None:
            order.payment_status = OrderPaymentStatus.REFUNDED.value

        self.session.flush()

        return payment

    def _get_locked_payment(self, payment_id: UUID) -> Payment:
        """Return a payment while locking its database row."""
        payment = self.repository.get_payment_for_update(payment_id)

        if payment is None:
            raise PaymentNotFoundError(
                f"Payment '{payment_id}' was not found."
            )

        return payment

    @staticmethod
    def _require_status(
        payment: Payment,
        allowed: set[PaymentStatus],
    ) -> None:
        """Ensure the payment is in an allowed state."""
        current = PaymentStatus(payment.status)

        if current not in allowed:
            allowed_values = ", ".join(
                status.value for status in allowed
            )
            raise PaymentValidationError(
                f"Payment is '{current.value}' and cannot perform "
                f"this operation. Allowed states: {allowed_values}."
            )
