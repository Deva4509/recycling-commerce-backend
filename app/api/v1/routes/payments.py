from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.payment import (
    PaymentCreate,
    PaymentFailedRequest,
    PaymentPaidRequest,
    PaymentRead,
)
from app.services.payment import (
    PaymentNotFoundError,
    PaymentService,
    PaymentValidationError,
)

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
    service: PaymentService = Depends(get_payment_service),
):
    try:
        return service.create_payment(
            order_id=payload.order_id,
            method=payload.method,
            provider=payload.provider,
        )
    except PaymentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{payment_id}",
    response_model=PaymentRead,
)
def get_payment(
    payment_id: UUID,
    service: PaymentService = Depends(get_payment_service),
):
    try:
        return service.get_payment(payment_id)
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
    service: PaymentService = Depends(get_payment_service),
):
    try:
        return service.list_order_payments(order_id)
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
