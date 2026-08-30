from decimal import Decimal
from uuid import uuid4

from app.database.models import Category, Product, Role, RoleName, User
from app.database.session import SessionLocal
from app.services.cart import (
    CartItemNotFoundError,
    CartService,
    CartValidationError,
)


def create_user(session):
    """Create a test customer."""
    role = (
        session.query(Role)
        .filter(Role.name == RoleName.CUSTOMER.value)
        .first()
    )

    if role is None:
        role = Role(
            id=uuid4(),
            name=RoleName.CUSTOMER.value,
        )
        session.add(role)
        session.flush()

    user = User(
        id=uuid4(),
        email=f"cart-{uuid4().hex[:10]}@example.com",
        password_hash="test-password-hash",
        first_name="Cart",
        last_name="Test",
        role_id=role.id,
    )

    session.add(user)
    session.flush()

    return user


def create_product(session):
    """Create a test product."""
    category = Category(
        id=uuid4(),
        name=f"Cart Category {uuid4().hex[:8]}",
        slug=f"cart-category-{uuid4().hex[:12]}",
    )

    session.add(category)
    session.flush()

    product = Product(
        id=uuid4(),
        category_id=category.id,
        name="Cart Test Product",
        slug=f"cart-product-{uuid4().hex[:12]}",
        sku=f"CART-{uuid4().hex[:8].upper()}",
        description="Cart integration test product",
        base_price=Decimal("199.00"),
        currency="INR",
        is_active=True,
    )

    session.add(product)
    session.flush()

    return product


def test_cart_full_lifecycle():
    """Test create, add, update, remove and clear cart flow."""
    session = SessionLocal()

    try:
        user = create_user(session)
        product = create_product(session)

        service = CartService(session)

        cart = service.get_or_create_cart(user.id)

        assert cart.user_id == user.id
        assert cart.status == "ACTIVE"
        assert cart.is_active is True

        same_cart = service.get_or_create_cart(user.id)

        assert same_cart.id == cart.id

        item = service.add_item(
            user_id=user.id,
            product_id=product.id,
            quantity=2,
        )

        assert item.cart_id == cart.id
        assert item.product_id == product.id
        assert item.quantity == 2
        assert item.unit_price == Decimal("199.00")

        item = service.add_item(
            user_id=user.id,
            product_id=product.id,
            quantity=3,
        )

        assert item.id is not None
        assert item.quantity == 5

        item = service.update_item(
            cart_id=cart.id,
            item_id=item.id,
            quantity=4,
        )

        assert item.quantity == 4

        items = service.list_items(cart.id)

        assert len(items) == 1
        assert items[0].quantity == 4

        service.remove_item(
            cart_id=cart.id,
            item_id=item.id,
        )

        assert service.list_items(cart.id) == []

        item = service.add_item(
            user_id=user.id,
            product_id=product.id,
            quantity=1,
        )

        assert item.quantity == 1

        service.clear_cart(cart.id)

        assert service.list_items(cart.id) == []

        session.commit()

    finally:
        session.rollback()
        session.close()


def test_cart_rejects_invalid_quantity():
    """Cart quantities must be positive."""
    session = SessionLocal()

    try:
        user = create_user(session)
        product = create_product(session)

        service = CartService(session)

        try:
            service.add_item(
                user_id=user.id,
                product_id=product.id,
                quantity=0,
            )
            assert False, "Expected CartValidationError"
        except CartValidationError:
            pass

        session.rollback()

    finally:
        session.close()


def test_cart_rejects_missing_product():
    """Cart cannot contain an unknown product."""
    session = SessionLocal()

    try:
        user = create_user(session)
        service = CartService(session)

        try:
            service.add_item(
                user_id=user.id,
                product_id=uuid4(),
                quantity=1,
            )
            assert False, "Expected CartValidationError"
        except CartValidationError:
            pass

        session.rollback()

    finally:
        session.close()


def test_cart_rejects_missing_item():
    """Updating or removing an unknown item must fail."""
    session = SessionLocal()

    try:
        user = create_user(session)
        service = CartService(session)

        cart = service.get_or_create_cart(user.id)

        try:
            service.update_item(
                cart_id=cart.id,
                item_id=uuid4(),
                quantity=2,
            )
            assert False, "Expected CartItemNotFoundError"
        except CartItemNotFoundError:
            pass

        session.rollback()

    finally:
        session.close()
