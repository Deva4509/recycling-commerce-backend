from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.order import Order, OrderStatus, PaymentStatus
from app.database.models.order_item import OrderItem
from app.database.models.product import Product
from app.repositories.inventory import InventoryRepository
from app.repositories.order import OrderRepository
from app.services.inventory import (
    InsufficientStockError,
    InventoryNotFoundError,
    InventoryService,
)


class OrderServiceError(Exception):
    """Base exception for order-service failures."""


class OrderNotFoundError(OrderServiceError):
    """Raised when an order does not exist."""


class OrderValidationError(OrderServiceError):
    """Raised when order data is invalid."""


class OrderService:
    """Business logic for checkout and order management."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = OrderRepository(session)
        self.inventory = InventoryService(session)
        self.inventory_repository = InventoryRepository(session)

    def create_order(
        self,
        *,
        user_id: UUID,
        shipping_address: str,
        items: list[dict],
        billing_address: str | None = None,
        notes: str | None = None,
        shipping_amount: Decimal = Decimal("0"),
        tax_amount: Decimal = Decimal("0"),
        discount_amount: Decimal = Decimal("0"),
        item_unit_price_overrides: dict[UUID, Decimal] | None = None,
    ) -> Order:
        """Create an order and reserve inventory."""

        if not items:
            raise OrderValidationError(
                "An order must contain at least one item."
            )

        if not shipping_address.strip():
            raise OrderValidationError(
                "Shipping address is required."
            )

        if shipping_amount < 0:
            raise OrderValidationError(
                "Shipping amount cannot be negative."
            )

        if tax_amount < 0:
            raise OrderValidationError(
                "Tax amount cannot be negative."
            )

        if discount_amount < 0:
            raise OrderValidationError(
                "Discount amount cannot be negative."
            )

        prepared_items: list[dict] = []
        subtotal = Decimal("0")
        overrides = item_unit_price_overrides or {}
        item_product_ids = {payload["product_id"] for payload in items}
        if not set(overrides).issubset(item_product_ids):
            raise OrderValidationError(
                "Price overrides must correspond to an order item."
            )

        for payload in items:
            product_id = payload["product_id"]
            location_id = payload["location_id"]
            quantity = int(payload["quantity"])
            variant_id = payload.get("variant_id")

            if quantity <= 0:
                raise OrderValidationError(
                    "Order item quantity must be greater than zero."
                )

            product = self.session.get(Product, product_id)

            if product is None:
                raise OrderValidationError(
                    f"Product '{product_id}' was not found."
                )

            if not product.is_active:
                raise OrderValidationError(
                    f"Product '{product_id}' is inactive."
                )

            inventory_item = (
                self.inventory_repository.get_item_by_product_location(
                    product_id,
                    location_id,
                    for_update=True,
                )
            )

            if inventory_item is None:
                raise InventoryNotFoundError(
                    f"No inventory exists for product '{product_id}' "
                    f"at location '{location_id}'."
                )

            available = (
                inventory_item.quantity
                - inventory_item.reserved_quantity
            )

            if quantity > available:
                raise InsufficientStockError(
                    f"Insufficient stock for '{product.name}'. "
                    f"Requested {quantity}, available {available}."
                )

            unit_price = overrides.get(
                product_id,
                Decimal(str(product.base_price)),
            )
            if not unit_price.is_finite() or unit_price < 0:
                raise OrderValidationError(
                    "Order item unit price must be a finite, nonnegative amount."
                )

            line_subtotal = unit_price * quantity
            subtotal += line_subtotal

            prepared_items.append(
                {
                    "product_id": product_id,
                    "variant_id": variant_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "subtotal": line_subtotal,
                    "sku": product.sku,
                    "product_name": product.name,
                    "location_id": location_id,
                }
            )

        total_amount = (
            subtotal
            + shipping_amount
            + tax_amount
            - discount_amount
        )

        if total_amount < 0:
            raise OrderValidationError(
                "Order total cannot be negative."
            )

        order = Order(
            id=uuid4(),
            order_number=self._generate_order_number(),
            user_id=user_id,
            status=OrderStatus.PENDING.value,
            payment_status=PaymentStatus.PENDING.value,
            subtotal=subtotal,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            currency="INR",
            shipping_address=shipping_address.strip(),
            billing_address=(
                billing_address.strip()
                if billing_address
                else None
            ),
            notes=notes,
            is_active=True,
        )

        try:
            self.repository.add_order(order)

            for payload in prepared_items:
                inventory_item = (
                    self.inventory_repository.get_item_by_product_location(
                        payload["product_id"],
                        payload["location_id"],
                        for_update=True,
                    )
                )

                if inventory_item is None:
                    raise InventoryNotFoundError(
                        "Inventory disappeared during checkout."
                    )

                self.inventory.reserve_stock(
                    inventory_item_id=inventory_item.id,
                    quantity=payload["quantity"],
                )

                order_item = OrderItem(
                    id=uuid4(),
                    order_id=order.id,
                    location_id=payload["location_id"],
                    product_id=payload["product_id"],
                    variant_id=payload["variant_id"],
                    product_name=payload["product_name"],
                    sku=payload["sku"],
                    quantity=payload["quantity"],
                    unit_price=payload["unit_price"],
                    subtotal=payload["subtotal"],
                )

                self.repository.add_order_item(order_item)

        except (
            InventoryNotFoundError,
            InsufficientStockError,
        ):
            self.session.rollback()
            raise
        except IntegrityError as exc:
            self.session.rollback()
            raise OrderValidationError(
                "Unable to create order."
            ) from exc

        return order

    def get_order(self, order_id: UUID) -> Order:
        """Return an order by ID."""
        order = self.repository.get_order(order_id)

        if order is None:
            raise OrderNotFoundError(
                f"Order '{order_id}' was not found."
            )

        return order

    def list_user_orders(
        self,
        user_id: UUID,
    ) -> list[Order]:
        """Return all orders belonging to a user."""
        return self.repository.list_orders_by_user(user_id)

    def cancel_order(
        self,
        order_id: UUID,
    ) -> Order:
        """Cancel an order."""

        order = self.get_order(order_id)

        if order.status in {
            OrderStatus.SHIPPED.value,
            OrderStatus.DELIVERED.value,
            OrderStatus.CANCELLED.value,
        }:
            raise OrderValidationError(
                f"Order cannot be cancelled from status "
                f"'{order.status}'."
            )

        inventory = InventoryService(self.session)

        for item in order.items:
            inventory_item = (
                inventory.repository.get_item_by_product_location(
                    item.product_id,
                    item.location_id,
                    for_update=True,
                )
            )

            if inventory_item is None:
                continue

            if order.payment_status == PaymentStatus.PAID.value:
                inventory.return_stock(
                    inventory_item_id=inventory_item.id,
                    quantity=item.quantity,
                    reference_id=order.id,
                    reason=f"Cancelled order {order.order_number}",
                )
            else:
                reserved = min(
                    item.quantity,
                    inventory_item.reserved_quantity,
                )

                if reserved > 0:
                    inventory.release_reservation(
                        inventory_item_id=inventory_item.id,
                        quantity=reserved,
                    )

        order.status = OrderStatus.CANCELLED.value
        self.session.flush()

        return order

    @staticmethod
    def _generate_order_number() -> str:
        """Generate a public order number."""
        return f"RP-{uuid4().hex[:12].upper()}"
