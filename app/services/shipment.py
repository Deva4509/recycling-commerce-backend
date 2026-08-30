from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.order import Order, OrderStatus
from app.database.models.shipment import Shipment, ShipmentStatus
from app.repositories.order import OrderRepository
from app.repositories.shipment import ShipmentRepository


class ShipmentServiceError(Exception):
    """Base exception for shipment business-rule failures."""


class ShipmentNotFoundError(ShipmentServiceError):
    """Raised when a shipment does not exist."""


class ShipmentValidationError(ShipmentServiceError):
    """Raised when a shipment operation is invalid."""


class ShipmentService:
    """Business logic for order shipment fulfillment."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = ShipmentRepository(session)
        self.order_repository = OrderRepository(session)

    def create_shipment(
        self,
        *,
        order_id: UUID,
        shipping_address: str | None = None,
        carrier: str | None = None,
        tracking_number: str | None = None,
        notes: str | None = None,
    ) -> Shipment:
        """Create a shipment for an eligible order."""

        order = self.order_repository.get_order(order_id)

        if order is None:
            raise ShipmentValidationError(
                f"Order '{order_id}' was not found."
            )

        if order.status == OrderStatus.CANCELLED.value:
            raise ShipmentValidationError(
                "Cannot create a shipment for a cancelled order."
            )

        existing = self.repository.get_shipment_by_order(order_id)

        if existing is not None:
            raise ShipmentValidationError(
                "A shipment already exists for this order."
            )

        address = shipping_address or order.shipping_address

        if not address or not address.strip():
            raise ShipmentValidationError(
                "Shipping address is required."
            )

        shipment = Shipment(
            id=uuid4(),
            order_id=order_id,
            status=ShipmentStatus.PENDING.value,
            shipping_address=address.strip(),
            carrier=carrier.strip() if carrier else None,
            tracking_number=(
                tracking_number.strip()
                if tracking_number
                else None
            ),
            notes=notes.strip() if notes else None,
        )

        try:
            self.repository.add_shipment(shipment)
        except IntegrityError as exc:
            self.session.rollback()
            raise ShipmentValidationError(
                "Unable to create shipment."
            ) from exc

        return shipment

    def get_shipment(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Return a shipment by ID."""

        shipment = self.repository.get_shipment(shipment_id)

        if shipment is None:
            raise ShipmentNotFoundError(
                f"Shipment '{shipment_id}' was not found."
            )

        return shipment

    def get_shipment_by_order(
        self,
        order_id: UUID,
    ) -> Shipment:
        """Return the shipment associated with an order."""

        shipment = self.repository.get_shipment_by_order(order_id)

        if shipment is None:
            raise ShipmentNotFoundError(
                f"No shipment was found for order '{order_id}'."
            )

        return shipment

    def process_shipment(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Move a pending shipment into processing."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {ShipmentStatus.PENDING.value},
        )

        shipment.status = ShipmentStatus.PROCESSING.value
        self.session.flush()

        return shipment

    def ship(
        self,
        shipment_id: UUID,
        *,
        carrier: str | None = None,
        tracking_number: str | None = None,
    ) -> Shipment:
        """Mark a shipment as shipped."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {
                ShipmentStatus.PENDING.value,
                ShipmentStatus.PROCESSING.value,
            },
        )

        if carrier is not None:
            carrier = carrier.strip()
            if not carrier:
                raise ShipmentValidationError(
                    "Carrier cannot be empty."
                )
            shipment.carrier = carrier

        if tracking_number is not None:
            tracking_number = tracking_number.strip()
            if not tracking_number:
                raise ShipmentValidationError(
                    "Tracking number cannot be empty."
                )
            shipment.tracking_number = tracking_number

        shipment.status = ShipmentStatus.SHIPPED.value

        self.session.flush()

        return shipment

    def mark_in_transit(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Mark a shipment as in transit."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {ShipmentStatus.SHIPPED.value},
        )

        shipment.status = ShipmentStatus.IN_TRANSIT.value
        self.session.flush()

        return shipment

    def mark_out_for_delivery(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Mark a shipment as out for delivery."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {ShipmentStatus.IN_TRANSIT.value},
        )

        shipment.status = ShipmentStatus.OUT_FOR_DELIVERY.value
        self.session.flush()

        return shipment

    def mark_delivered(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Mark a shipment as delivered."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {ShipmentStatus.OUT_FOR_DELIVERY.value},
        )

        shipment.status = ShipmentStatus.DELIVERED.value

        order = self.order_repository.get_order(shipment.order_id)

        if order is not None and order.status != OrderStatus.CANCELLED.value:
            order.status = OrderStatus.DELIVERED.value

        self.session.flush()

        return shipment

    def cancel_shipment(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Cancel a shipment that has not been delivered."""

        shipment = self._get_locked_shipment(shipment_id)

        self._require_status(
            shipment,
            {
                ShipmentStatus.PENDING.value,
                ShipmentStatus.PROCESSING.value,
                ShipmentStatus.SHIPPED.value,
                ShipmentStatus.IN_TRANSIT.value,
                ShipmentStatus.OUT_FOR_DELIVERY.value,
            },
        )

        shipment.status = ShipmentStatus.CANCELLED.value
        self.session.flush()

        return shipment

    def _get_locked_shipment(
        self,
        shipment_id: UUID,
    ) -> Shipment:
        """Return a shipment while locking its database row."""

        shipment = self.repository.get_shipment_for_update(shipment_id)

        if shipment is None:
            raise ShipmentNotFoundError(
                f"Shipment '{shipment_id}' was not found."
            )

        return shipment

    @staticmethod
    def _require_status(
        shipment: Shipment,
        allowed_statuses: set[str],
    ) -> None:
        """Validate the shipment's current lifecycle state."""

        if shipment.status not in allowed_statuses:
            allowed = ", ".join(sorted(allowed_statuses))

            raise ShipmentValidationError(
                f"Shipment is currently '{shipment.status}' and cannot "
                f"perform this operation. Allowed states: {allowed}."
            )
