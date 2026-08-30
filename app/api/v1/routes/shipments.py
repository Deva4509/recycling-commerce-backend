from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentRead,
    ShipmentUpdate,
)
from app.services.shipment import (
    ShipmentNotFoundError,
    ShipmentService,
    ShipmentValidationError,
)


router = APIRouter(
    prefix="/shipments",
    tags=["Shipments"],
)


def get_shipment_service(
    db: Session = Depends(get_db),
) -> ShipmentService:
    return ShipmentService(db)


@router.post(
    "",
    response_model=ShipmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_shipment(
    payload: ShipmentCreate,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.create_shipment(
            order_id=payload.order_id,
            shipping_address=payload.shipping_address,
            carrier=payload.carrier,
            tracking_number=payload.tracking_number,
            notes=payload.notes,
        )
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{shipment_id}",
    response_model=ShipmentRead,
)
def get_shipment(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.get_shipment(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/order/{order_id}",
    response_model=ShipmentRead,
)
def get_shipment_by_order(
    order_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.get_shipment_by_order(order_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/processing",
    response_model=ShipmentRead,
)
def process_shipment(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.process_shipment(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/ship",
    response_model=ShipmentRead,
)
def ship_shipment(
    shipment_id: UUID,
    payload: ShipmentUpdate | None = None,
    service: ShipmentService = Depends(get_shipment_service),
):
    payload = payload or ShipmentUpdate()

    try:
        return service.ship(
            shipment_id,
            carrier=payload.carrier,
            tracking_number=payload.tracking_number,
        )
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/in-transit",
    response_model=ShipmentRead,
)
def mark_in_transit(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.mark_in_transit(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/out-for-delivery",
    response_model=ShipmentRead,
)
def mark_out_for_delivery(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.mark_out_for_delivery(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/delivered",
    response_model=ShipmentRead,
)
def mark_delivered(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.mark_delivered(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{shipment_id}/cancel",
    response_model=ShipmentRead,
)
def cancel_shipment(
    shipment_id: UUID,
    service: ShipmentService = Depends(get_shipment_service),
):
    try:
        return service.cancel_shipment(shipment_id)
    except ShipmentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ShipmentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
