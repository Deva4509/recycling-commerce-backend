from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.database.models.order import Order, PaymentStatus as OrderPaymentStatus
from app.database.models.payment import Payment, PaymentMethod, PaymentStatus
from app.repositories.payment import PaymentRepository
from app.repositories.order import OrderRepository
from app.services.inventory import InventoryService, InventoryNotFoundError
from app.services.razorpay import (
    RazorpayConfigurationError,
    get_razorpay_service,
)


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
        user_id: UUID | None = None,
    ) -> Payment:
        """Create a pending payment for an order."""
        order = self.order_repository.get_order(order_id)

        if order is None:
            raise PaymentValidationError(
                f"Order '{order_id}' was not found."
            )

        if user_id is not None and order.user_id != user_id:
            raise PaymentValidationError(
                "Order was not found."
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

        # COD does not require an online payment before the order
        # can be confirmed. The payment record remains PENDING because
        # the customer pays when the order is delivered.
        if method == PaymentMethod.COD:
            order.status = "CONFIRMED"

        self.session.flush()

        return payment

    def attach_razorpay_order(
        self,
        payment_id: UUID,
        *,
        provider_order_id: str,
    ) -> Payment:
        """Attach a Razorpay order to a pending payment."""
        payment = self._get_locked_payment(payment_id)

        self._require_status(
            payment,
            {PaymentStatus.PENDING, PaymentStatus.PROCESSING},
        )

        if payment.provider not in {"razorpay", "Razorpay"}:
            payment.provider = "razorpay"

        if (
            payment.provider_order_id
            and payment.provider_order_id != provider_order_id
        ):
            raise PaymentValidationError(
                "Payment already has a different provider order."
            )

        payment.provider_order_id = provider_order_id
        self.session.flush()

        return payment

    def get_payment_for_webhook(
        self,
        *,
        provider_order_id: str | None = None,
        provider_payment_id: str | None = None,
    ) -> Payment | None:
        """Find a payment using Razorpay identifiers."""
        if provider_payment_id:
            payment = self.repository.get_by_provider_id(
                provider_payment_id,
            )
            if payment is not None:
                return payment

        if provider_order_id:
            return self.repository.get_by_provider_order_id(
                provider_order_id,
            )

        return None

    def mark_webhook_event_processed(
        self,
        payment_id: UUID,
        *,
        event_id: str,
    ) -> Payment:
        """Record a webhook event after validating payment ownership."""
        payment = self._get_locked_payment(payment_id)

        if payment.provider_event_id:
            if payment.provider_event_id == event_id:
                return payment

            raise PaymentValidationError(
                "A different webhook event is already recorded for this payment."
            )

        payment.provider_event_id = event_id
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

        inventory = InventoryService(self.session)

        try:
            for item in order.items:
                inventory_item = (
                    inventory.repository.get_item_by_product_location(
                        item.product_id,
                        item.location_id,
                        for_update=True,
                    )
                )

                if inventory_item is None:
                    raise InventoryNotFoundError(
                        f"Inventory for product '{item.product_id}' was not found."
                    )

                inventory.sell_stock(
                    inventory_item_id=inventory_item.id,
                    quantity=item.quantity,
                    reference_id=order.id,
                    reason=f"Order {order.order_number} paid",
                )

                if inventory_item.reserved_quantity >= item.quantity:
                    inventory.release_reservation(
                        inventory_item_id=inventory_item.id,
                        quantity=item.quantity,
                    )
        except Exception:
            self.session.rollback()
            raise

        order.payment_status = OrderPaymentStatus.PAID.value
        order.status = "CONFIRMED"

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
            inventory = InventoryService(self.session)

            for item in order.items:
                inventory_item = (
                    inventory.repository.get_item_by_product_location(
                        item.product_id,
                        item.location_id,
                        for_update=True,
                    )
                )

                if inventory_item is not None:
                    reserved = min(
                        item.quantity,
                        inventory_item.reserved_quantity,
                    )

                    if reserved > 0:
                        inventory.release_reservation(
                            inventory_item_id=inventory_item.id,
                            quantity=reserved,
                        )

            order.payment_status = OrderPaymentStatus.FAILED.value

            # An online payment failure must never leave the order
            # available for fulfilment. Inventory reservations are
            # released above before cancelling the order.
            if payment.method != PaymentMethod.COD.value:
                order.status = "CANCELLED"

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

        # Online Razorpay payments must be refunded through Razorpay
        # before the internal payment is marked refunded.
        if (
            payment.provider
            and payment.provider.lower() == "razorpay"
            and payment.provider_payment_id
        ):
            try:
                razorpay_service = get_razorpay_service()
                razorpay_service.refund_payment(
                    payment.provider_payment_id,
                    amount=payment.amount,
                )
            except RazorpayConfigurationError as exc:
                raise PaymentValidationError(str(exc)) from exc
            except Exception as exc:
                raise PaymentValidationError(
                    "Razorpay refund could not be created. "
                    "The payment was not marked as refunded."
                ) from exc

        payment.status = PaymentStatus.REFUNDED.value

        order = self.order_repository.get_order(payment.order_id)

        if order is not None:
            # A paid order has already consumed physical stock.
            # Refund returns that sold quantity to inventory unless
            # the order was already cancelled and returned.
            if order.status != "CANCELLED":
                inventory = InventoryService(self.session)

                for item in order.items:
                    inventory_item = (
                        inventory.repository.get_item_by_product_location(
                            item.product_id,
                            item.location_id,
                            for_update=True,
                        )
                    )

                    if inventory_item is not None:
                        inventory.return_stock(
                            inventory_item_id=inventory_item.id,
                            quantity=item.quantity,
                            reference_id=order.id,
                            reason=f"Refund for order {order.order_number}",
                        )

                order.status = "CANCELLED"

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
