from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.order import Order
from app.database.models.order_item import OrderItem


class OrderRepository:
    """Data-access operations for orders and order items."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_order(self, order_id: UUID) -> Order | None:
        """Return an order by ID."""
        return self.session.get(Order, order_id)

    def get_order_by_number(self, order_number: str) -> Order | None:
        """Return an order by its public order number."""
        statement = select(Order).where(
            Order.order_number == order_number
        )
        return self.session.scalar(statement)

    def list_orders_by_user(self, user_id: UUID) -> list[Order]:
        """Return all orders belonging to a user."""
        statement = (
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        return list(self.session.scalars(statement).all())

    def add_order(self, order: Order) -> Order:
        """Add an order to the current transaction."""
        self.session.add(order)
        self.session.flush()
        return order

    def add_order_item(self, item: OrderItem) -> OrderItem:
        """Add an order item to the current transaction."""
        self.session.add(item)
        self.session.flush()
        return item

    def get_order_item(
        self,
        order_item_id: UUID,
    ) -> OrderItem | None:
        """Return an order item by ID."""
        return self.session.get(OrderItem, order_item_id)

    def list_order_items(self, order_id: UUID) -> list[OrderItem]:
        """Return all items belonging to an order."""
        statement = (
            select(OrderItem)
            .where(OrderItem.order_id == order_id)
            .order_by(OrderItem.created_at)
        )
        return list(self.session.scalars(statement).all())
