from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models.cart import Cart
from app.database.models.cart_item import CartItem
from app.database.models.product import Product
from app.repositories.cart import CartRepository


class CartServiceError(Exception):
    """Base exception for cart business-rule failures."""


class CartNotFoundError(CartServiceError):
    """Raised when a cart does not exist."""


class CartItemNotFoundError(CartServiceError):
    """Raised when a cart item does not exist."""


class CartValidationError(CartServiceError):
    """Raised when a cart operation is invalid."""


class CartService:
    """Business logic for shopping carts."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repository = CartRepository(session)

    def get_or_create_cart(self, user_id: UUID) -> Cart:
        """Return the user's active cart, creating it when necessary."""
        cart = self.repository.get_cart_by_user(user_id)

        if cart is not None:
            if not cart.is_active:
                cart.is_active = True
                cart.status = "ACTIVE"
                self.session.flush()

            return cart

        cart = Cart(
            id=uuid4(),
            user_id=user_id,
            status="ACTIVE",
            is_active=True,
        )

        try:
            self.repository.add_cart(cart)
            self.session.flush()
        except IntegrityError as exc:
            self.session.rollback()
            existing = self.repository.get_cart_by_user(user_id)

            if existing is not None:
                return existing

            raise CartValidationError(
                "Unable to create cart."
            ) from exc

        return cart

    def get_cart(self, cart_id: UUID) -> Cart:
        """Return a cart by ID."""
        cart = self.repository.get_cart(cart_id)

        if cart is None:
            raise CartNotFoundError(
                f"Cart '{cart_id}' was not found."
            )

        return cart

    def get_user_cart(self, user_id: UUID) -> Cart:
        """Return the user's cart."""
        cart = self.repository.get_cart_by_user(user_id)

        if cart is None:
            raise CartNotFoundError(
                f"No cart was found for user '{user_id}'."
            )

        return cart

    def list_items(self, cart_id: UUID) -> list[CartItem]:
        """Return all items in a cart."""
        self.get_cart(cart_id)
        return self.repository.list_items(cart_id)

    def add_item(
        self,
        *,
        user_id: UUID,
        product_id: UUID,
        quantity: int = 1,
        variant_id: UUID | None = None,
    ) -> CartItem:
        """Add a product to the user's cart."""
        self._validate_positive_quantity(quantity)

        cart = self.get_or_create_cart(user_id)

        if not cart.is_active:
            raise CartValidationError("Cart is inactive.")

        product = self.session.get(Product, product_id)

        if product is None:
            raise CartValidationError(
                f"Product '{product_id}' was not found."
            )

        if not product.is_active:
            raise CartValidationError(
                f"Product '{product_id}' is inactive."
            )

        unit_price = Decimal(str(product.base_price))

        if variant_id is not None:
            variant = next(
                (
                    variant
                    for variant in product.variants
                    if variant.id == variant_id
                ),
                None,
            )

            if variant is None:
                raise CartValidationError(
                    f"Variant '{variant_id}' was not found for product "
                    f"'{product_id}'."
                )

            if not variant.is_active:
                raise CartValidationError(
                    f"Variant '{variant_id}' is inactive."
                )

            if variant.price is not None:
                unit_price = Decimal(str(variant.price))

        existing = self.repository.get_item_by_product(
            cart.id,
            product_id,
            variant_id,
        )

        if existing is not None:
            existing.quantity += quantity
            existing.unit_price = unit_price
            self.session.flush()
            return existing

        item = CartItem(
            id=uuid4(),
            cart_id=cart.id,
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity,
            unit_price=unit_price,
        )

        try:
            self.repository.add_item(item)
            self.session.flush()
        except IntegrityError as exc:
            self.session.rollback()
            raise CartValidationError(
                "Unable to add item to cart."
            ) from exc

        return item

    def update_item(
        self,
        *,
        cart_id: UUID,
        item_id: UUID,
        quantity: int,
    ) -> CartItem:
        """Update the quantity of a cart item."""
        self._validate_positive_quantity(quantity)

        self.get_cart(cart_id)

        item = self.repository.get_item_for_update(item_id)

        if item is None or item.cart_id != cart_id:
            raise CartItemNotFoundError(
                f"Cart item '{item_id}' was not found."
            )

        item.quantity = quantity
        self.session.flush()

        return item

    def remove_item(
        self,
        *,
        cart_id: UUID,
        item_id: UUID,
    ) -> None:
        """Remove an item from a cart."""
        self.get_cart(cart_id)

        item = self.repository.get_item_for_update(item_id)

        if item is None or item.cart_id != cart_id:
            raise CartItemNotFoundError(
                f"Cart item '{item_id}' was not found."
            )

        self.repository.delete_item(item)
        self.session.flush()

    def clear_cart(self, cart_id: UUID) -> None:
        """Remove every item from a cart."""
        self.get_cart(cart_id)

        items = self.repository.list_items(cart_id)

        for item in items:
            self.repository.delete_item(item)

        self.session.flush()

    def deactivate_cart(self, cart_id: UUID) -> Cart:
        """Deactivate a cart."""
        cart = self.repository.get_cart_for_update(cart_id)

        if cart is None:
            raise CartNotFoundError(
                f"Cart '{cart_id}' was not found."
            )

        cart.is_active = False
        cart.status = "INACTIVE"

        self.session.flush()

        return cart

    @staticmethod
    def _validate_positive_quantity(quantity: int) -> None:
        """Validate a positive cart quantity."""
        if quantity <= 0:
            raise CartValidationError(
                "Quantity must be greater than zero."
            )
