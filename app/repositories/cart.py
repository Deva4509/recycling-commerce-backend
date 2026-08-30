from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.cart import Cart
from app.database.models.cart_item import CartItem


class CartRepository:
    """Data-access operations for shopping carts."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_cart(self, cart_id: UUID) -> Cart | None:
        """Return a cart by ID."""
        statement = select(Cart).where(Cart.id == cart_id)
        return self.session.execute(statement).scalar_one_or_none()

    def get_cart_by_user(self, user_id: UUID) -> Cart | None:
        """Return the cart belonging to a user."""
        statement = select(Cart).where(Cart.user_id == user_id)
        return self.session.execute(statement).scalar_one_or_none()

    def get_cart_for_update(self, cart_id: UUID) -> Cart | None:
        """Return a cart by ID while locking its database row."""
        statement = (
            select(Cart)
            .where(Cart.id == cart_id)
            .with_for_update()
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_cart_by_user_for_update(
        self,
        user_id: UUID,
    ) -> Cart | None:
        """Return a user's cart while locking its database row."""
        statement = (
            select(Cart)
            .where(Cart.user_id == user_id)
            .with_for_update()
        )
        return self.session.execute(statement).scalar_one_or_none()

    def add_cart(self, cart: Cart) -> Cart:
        """Add a cart to the session."""
        self.session.add(cart)
        return cart

    def get_item(self, item_id: UUID) -> CartItem | None:
        """Return a cart item by ID."""
        statement = select(CartItem).where(CartItem.id == item_id)
        return self.session.execute(statement).scalar_one_or_none()

    def get_item_for_update(self, item_id: UUID) -> CartItem | None:
        """Return a cart item while locking its database row."""
        statement = (
            select(CartItem)
            .where(CartItem.id == item_id)
            .with_for_update()
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_item_by_product(
        self,
        cart_id: UUID,
        product_id: UUID,
        variant_id: UUID | None = None,
    ) -> CartItem | None:
        """Return an existing cart item for a product/variant."""
        statement = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id,
            CartItem.variant_id == variant_id,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def get_item_by_product_for_update(
        self,
        cart_id: UUID,
        product_id: UUID,
        variant_id: UUID | None = None,
    ) -> CartItem | None:
        """Return a cart item while locking its database row."""
        statement = (
            select(CartItem)
            .where(
                CartItem.cart_id == cart_id,
                CartItem.product_id == product_id,
                CartItem.variant_id == variant_id,
            )
            .with_for_update()
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_items(self, cart_id: UUID) -> list[CartItem]:
        """Return all items in a cart."""
        statement = (
            select(CartItem)
            .where(CartItem.cart_id == cart_id)
            .order_by(CartItem.created_at.asc())
        )
        return list(self.session.execute(statement).scalars().all())

    def add_item(self, item: CartItem) -> CartItem:
        """Add a cart item to the session."""
        self.session.add(item)
        return item

    def delete_item(self, item: CartItem) -> None:
        """Delete a cart item from the session."""
        self.session.delete(item)
