from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import RoleName, User
from app.dependencies.auth import get_current_user, require_roles
from app.schemas.payment import (
    RazorpayCreateOrderRequest,
    RazorpayCreateOrderResponse,
    RazorpayVerifyRequest,
    RazorpayWebhookResponse,
    PaymentCreate,
    PaymentFailedRequest,
    PaymentPaidRequest,
    PaymentRead,
)
from app.services.razorpay import (
    RazorpayConfigurationError,
    RazorpayVerificationError,
    get_razorpay_service,
)
from app.services.payment import (
    PaymentNotFoundError,
    PaymentService,
    PaymentValidationError,
)

admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)


router = APIRouter(prefix="/payments", tags=["Payments"])


def get_payment_service(
    db: Session = Depends(get_db),
) -> PaymentService:
    return PaymentService(db)


@router.post(
    "",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payload: PaymentCreate,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    try:
        payment = service.create_payment(
            order_id=payload.order_id,
            method=payload.method,
            provider=payload.provider,
        )
        service.session.commit()
        return payment
    except PaymentValidationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception:
        service.session.rollback()
        raise
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_owned_payment(
    payment_id: UUID,
    current_user: User,
    service: PaymentService,
):
    """Return a payment only when its order belongs to the user."""
    payment = service.get_payment(payment_id)

    if payment.order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment was not found.",
        )

    return payment


def get_owned_order_payments(
    order_id: UUID,
    current_user: User,
    service: PaymentService,
):
    """Return payments only when the order belongs to the user."""
    payments = service.list_order_payments(order_id)

    if not payments:
        return payments

    if payments[0].order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order payments were not found.",
        )

    return payments


@router.post(
    "/create-order",
    response_model=RazorpayCreateOrderResponse,
)
def create_razorpay_order(
    payload: RazorpayCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    try:
        payment = get_owned_payment(
            payload.payment_id,
            current_user,
            service,
        )

        if payment.status not in {"PENDING", "PROCESSING"}:
            raise PaymentValidationError(
                "Only pending or processing payments can create a Razorpay order."
            )

        razorpay_service = get_razorpay_service()

        provider_order = razorpay_service.create_order(
            amount=payment.amount,
            currency=payment.currency,
            receipt=str(payment.id),
            notes={
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
            },
        )

        service.attach_razorpay_order(
            payment.id,
            provider_order_id=provider_order["id"],
        )

        service.session.commit()

        return RazorpayCreateOrderResponse(
            payment_id=payment.id,
            razorpay_order_id=provider_order["id"],
            amount=int(provider_order["amount"]),
            currency=provider_order["currency"],
            key_id=razorpay_service.key_id,
        )

    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except RazorpayConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post(
    "/verify",
    response_model=PaymentRead,
)
def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    try:
        payment = get_owned_payment(
            payload.payment_id,
            current_user,
            service,
        )

        if payment.status == "PAID":
            if payment.provider_payment_id == payload.razorpay_payment_id:
                return payment
            raise PaymentValidationError(
                "Payment has already been completed."
            )

        if payment.provider_order_id != payload.razorpay_order_id:
            raise PaymentValidationError(
                "Razorpay order does not match this payment."
            )

        razorpay_service = get_razorpay_service()

        razorpay_service.verify_payment_signature(
            razorpay_order_id=payload.razorpay_order_id,
            razorpay_payment_id=payload.razorpay_payment_id,
            razorpay_signature=payload.razorpay_signature,
        )

        provider_payment = razorpay_service.fetch_payment(
            payload.razorpay_payment_id,
        )

        expected_amount = razorpay_service.amount_to_paise(payment.amount)

        if int(provider_payment["amount"]) != expected_amount:
            raise PaymentValidationError(
                "Razorpay payment amount does not match the order amount."
            )

        if provider_payment["currency"] != payment.currency:
            raise PaymentValidationError(
                "Razorpay payment currency does not match the order currency."
            )

        if provider_payment.get("order_id") != payment.provider_order_id:
            raise PaymentValidationError(
                "Razorpay payment is linked to a different order."
            )

        result = service.mark_paid(
            payment.id,
            provider_payment_id=payload.razorpay_payment_id,
            provider_order_id=payload.razorpay_order_id,
        )

        service.session.commit()
        return result

    except RazorpayVerificationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RazorpayConfigurationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except PaymentNotFoundError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/webhook",
    response_model=RazorpayWebhookResponse,
)
async def razorpay_webhook(
    request: Request,
    service: PaymentService = Depends(get_payment_service),
):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    event_id = request.headers.get("X-Razorpay-Event-Id", "")

    if not signature or not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Razorpay webhook headers.",
        )

    try:
        razorpay_service = get_razorpay_service()
        razorpay_service.verify_webhook_signature(
            payload=body,
            signature=signature,
        )

        import json

        payload = json.loads(body.decode("utf-8"))
        event = payload.get("event", "")
        entity = (
            payload.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        provider_payment_id = entity.get("id")
        provider_order_id = entity.get("order_id")

        payment = service.get_payment_for_webhook(
            provider_order_id=provider_order_id,
            provider_payment_id=provider_payment_id,
        )

        if payment is None:
            return RazorpayWebhookResponse(status="ignored")

        if payment.provider_event_id == event_id:
            return RazorpayWebhookResponse(status="already_processed")

        service.mark_webhook_event_processed(
            payment.id,
            event_id=event_id,
        )

        if event == "payment.captured":
            if payment.status != "PAID":
                razorpay_service_payment = razorpay_service.fetch_payment(
                    provider_payment_id,
                )

                expected_amount = razorpay_service.amount_to_paise(
                    payment.amount,
                )

                if int(razorpay_service_payment["amount"]) != expected_amount:
                    service.session.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook payment amount mismatch.",
                    )

                if razorpay_service_payment["currency"] != payment.currency:
                    service.session.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook payment currency mismatch.",
                    )

                service.mark_paid(
                    payment.id,
                    provider_payment_id=provider_payment_id,
                    provider_order_id=provider_order_id,
                )

        elif event == "payment.failed":
            if payment.status in {"PENDING", "PROCESSING"}:
                error = entity.get("error_description") or "Payment failed."
                service.mark_failed(
                    payment.id,
                    failure_reason=error,
                )

        service.session.commit()
        return RazorpayWebhookResponse(status="processed")

    except RazorpayVerificationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RazorpayConfigurationError as exc:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except HTTPException:
        service.session.rollback()
        raise
    except Exception:
        service.session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook.",
        )


@router.get(
    "/{payment_id}",
    response_model=PaymentRead,
)
def get_payment(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    try:
        return get_owned_payment(payment_id, current_user, service)
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/order/{order_id}",
    response_model=list[PaymentRead],
)
def list_order_payments(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    try:
        return get_owned_order_payments(order_id, current_user, service)
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/{payment_id}/processing",
    response_model=PaymentRead,
)
def mark_processing(
    payment_id: UUID,
    service: PaymentService = Depends(get_payment_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.mark_processing(payment_id)
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{payment_id}/paid",
    response_model=PaymentRead,
)
def mark_paid(
    payment_id: UUID,
    payload: PaymentPaidRequest,
    service: PaymentService = Depends(get_payment_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.mark_paid(
            payment_id,
            provider_payment_id=payload.provider_payment_id,
            provider_order_id=payload.provider_order_id,
        )
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{payment_id}/failed",
    response_model=PaymentRead,
)
def mark_failed(
    payment_id: UUID,
    payload: PaymentFailedRequest,
    service: PaymentService = Depends(get_payment_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.mark_failed(
            payment_id,
            failure_reason=payload.failure_reason,
        )
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentRead,
)
def refund_payment(
    payment_id: UUID,
    service: PaymentService = Depends(get_payment_service),
    _: object = Depends(admin_or_staff),
):
    try:
        return service.refund_payment(payment_id)
    except PaymentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
