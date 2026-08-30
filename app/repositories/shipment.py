from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.shipment import Shipment


class ShipmentRepository:
    """Data-access operations for shipments."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_shipment(
        self,
        shipment_id: UUID,
    ) -> Shipment | None:
        """Return a shipment by ID."""
        return self.session.get(Shipment, shipment_id)

    def get_shipment_for_update(
        self,
        shipment_id: UUID,
    ) -> Shipment | None:
        """Return a shipment while locking its database row."""
        statement = (
            select(Shipment)
            .where(Shipment.id == shipment_id)
            .with_for_update()
        )
        return self.session.scalar(statement)

    def get_shipment_by_order(
        self,
        order_id: UUID,
    ) -> Shipment | None:
        """Return the shipment associated with an order."""
        statement = select(Shipment).where(
            Shipment.order_id == order_id
        )
        return self.session.scalar(statement)

    def list_shipments_by_order(
        self,
        order_id: UUID,
    ) -> list[Shipment]:
        """Return all shipments for an order."""
        statement = (
            select(Shipment)
            .where(Shipment.order_id == order_id)
            .order_by(Shipment.created_at)
        )
        return list(self.session.scalars(statement).all())

    def add_shipment(
        self,
        shipment: Shipment,
    ) -> Shipment:
        """Add a shipment to the current transaction."""
        self.session.add(shipment)
        self.session.flush()
        return shipment
