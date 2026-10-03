from __future__ import annotations

import hashlib
import hmac
from decimal import Decimal
from typing import Any

import razorpay

from app.config.settings import settings


class RazorpayConfigurationError(RuntimeError):
    """Raised when Razorpay configuration is incomplete."""


class RazorpayVerificationError(RuntimeError):
    """Raised when Razorpay signature verification fails."""


class RazorpayService:
    """Small adapter around the Razorpay SDK.

    Secrets remain backend-only. Card details, CVV and UPI PIN are never
    accepted or stored by this service.
    """

    def __init__(
        self,
        *,
        key_id: str,
        key_secret: str,
        webhook_secret: str | None = None,
    ) -> None:
        if not key_id or not key_secret:
            raise RazorpayConfigurationError(
                "Razorpay credentials are not configured."
            )

        self.key_id = key_id
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret
        self.client = razorpay.Client(
            auth=(key_id, key_secret),
        )

    @staticmethod
    def amount_to_paise(amount: Decimal | int | float | str) -> int:
        """Convert an INR amount to paise without floating-point rounding."""
        value = Decimal(str(amount))
        if value <= 0:
            raise ValueError("Payment amount must be greater than zero.")
        return int(value * 100)

    def create_order(
        self,
        *,
        amount: Decimal | int | float | str,
        currency: str,
        receipt: str,
        notes: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Create a Razorpay order."""
        payload: dict[str, Any] = {
            "amount": self.amount_to_paise(amount),
            "currency": currency,
            "receipt": receipt,
        }

        if notes:
            payload["notes"] = notes

        return self.client.order.create(payload)

    def verify_payment_signature(
        self,
        *,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> None:
        """Verify a Razorpay checkout signature."""
        message = (
            f"{razorpay_order_id}|{razorpay_payment_id}"
        ).encode("utf-8")

        expected = hmac.new(
            self.key_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, razorpay_signature):
            raise RazorpayVerificationError(
                "Invalid Razorpay payment signature."
            )

    def verify_webhook_signature(
        self,
        *,
        payload: bytes,
        signature: str,
    ) -> None:
        """Verify a Razorpay webhook signature."""
        if not self.webhook_secret:
            raise RazorpayConfigurationError(
                "Razorpay webhook secret is not configured."
            )

        expected = hmac.new(
            self.webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            raise RazorpayVerificationError(
                "Invalid Razorpay webhook signature."
            )

    def fetch_payment(self, payment_id: str) -> dict[str, Any]:
        """Fetch payment information from Razorpay."""
        return self.client.payment.fetch(payment_id)

    def refund_payment(
        self,
        payment_id: str,
        *,
        amount: Decimal | int | float | str | None = None,
    ) -> dict[str, Any]:
        """Create a Razorpay refund."""
        if amount is None:
            return self.client.payment.refund(payment_id)

        return self.client.payment.refund(
            payment_id,
            {
                "amount": self.amount_to_paise(amount),
            },
        )


def get_razorpay_service() -> RazorpayService:
    """Return the configured Razorpay service."""
    return RazorpayService(
        key_id=settings.razorpay_key_id,
        key_secret=settings.razorpay_key_secret,
        webhook_secret=settings.razorpay_webhook_secret,
    )
