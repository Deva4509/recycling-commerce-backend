from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.database.models import Category, Product, Review, Role, RoleName, User
from app.database.models.base import Base
from app.dependencies.auth import get_current_user
from app.main import app


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)

    session = Session()

    role = Role(
        id=uuid4(),
        name=RoleName.CUSTOMER.value,
    )
    session.add(role)

    user = User(
        id=uuid4(),
        email="reviewer@example.com",
        password_hash="test",
        first_name="Review",
        last_name="User",
        role_id=role.id,
        status="ACTIVE",
        email_verified=True,
    )

    category = Category(
        id=uuid4(),
        name="Test Category",
        slug=f"test-category-{uuid4()}",
        description="Test category",
        sort_order=0,
        is_active=True,
    )

    product = Product(
        id=uuid4(),
        name="Test Product",
        slug=f"test-product-{uuid4()}",
        sku=f"TEST-{uuid4()}",
        short_description="Test product",
        description="Test product description",
        base_price=100,
        currency="INR",
        category_id=category.id,
        is_active=True,
    )

    session.add_all([user, category, product])
    session.commit()

    try:
        yield session, user, product
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db):
    session, user, _ = db

    def override_db():
        yield session

    def override_user():
        return user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_create_review(client, db):
    _, _, product = db

    response = client.post(
        f"/api/v1/products/{product.id}/reviews",
        json={
            "rating": 5,
            "title": "Excellent",
            "comment": "  Great recycled product!  ",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["product_id"] == str(product.id)
    assert data["rating"] == 5
    assert data["title"] == "Excellent"
    assert data["comment"] == "Great recycled product!"
    assert "email" not in data
    assert "password_hash" not in data


@pytest.mark.parametrize("rating", [0, -1, 6, 10, 1.5, "5", None])
def test_invalid_rating_rejected(client, db, rating):
    _, _, product = db

    response = client.post(
        f"/api/v1/products/{product.id}/reviews",
        json={
            "rating": rating,
            "comment": "Invalid rating test",
        },
    )

    assert response.status_code == 422


def test_comment_is_required_and_trimmed(client, db):
    _, _, product = db

    response = client.post(
        f"/api/v1/products/{product.id}/reviews",
        json={
            "rating": 4,
            "comment": "     ",
        },
    )

    assert response.status_code == 422


def test_duplicate_review_rejected(client, db):
    session, user, product = db

    existing = Review(
        id=uuid4(),
        product_id=product.id,
        user_id=user.id,
        rating=5,
        comment="Already reviewed",
    )
    session.add(existing)
    session.commit()

    response = client.post(
        f"/api/v1/products/{product.id}/reviews",
        json={
            "rating": 4,
            "comment": "Second review",
        },
    )

    assert response.status_code == 409


def test_rating_summary(client, db):
    session, user, product = db

    second_user = User(
        id=uuid4(),
        email="second@example.com",
        password_hash="test",
        first_name="Second",
        last_name="User",
        role_id=user.role_id,
        status="ACTIVE",
        email_verified=True,
    )

    session.add(second_user)

    session.add_all(
        [
            Review(
                id=uuid4(),
                product_id=product.id,
                user_id=user.id,
                rating=5,
                comment="Excellent",
            ),
            Review(
                id=uuid4(),
                product_id=product.id,
                user_id=second_user.id,
                rating=3,
                comment="Good",
            ),
        ]
    )

    session.commit()

    response = client.get(
        f"/api/v1/products/{product.id}/rating",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["average"] == 4.0
    assert data["total"] == 2
    assert data["distribution"]["five"] == 1
    assert data["distribution"]["three"] == 1
    assert data["distribution"]["one"] == 0


def test_list_reviews_with_pagination(client, db):
    session, user, product = db

    second_user = User(
        id=uuid4(),
        email="pagination@example.com",
        password_hash="test",
        first_name="Pagination",
        last_name="User",
        role_id=user.role_id,
        status="ACTIVE",
        email_verified=True,
    )

    session.add(second_user)

    session.add_all(
        [
            Review(
                id=uuid4(),
                product_id=product.id,
                user_id=user.id,
                rating=5,
                comment="First",
            ),
            Review(
                id=uuid4(),
                product_id=product.id,
                user_id=second_user.id,
                rating=4,
                comment="Second",
            ),
        ]
    )

    session.commit()

    response = client.get(
        f"/api/v1/products/{product.id}/reviews?page=1&page_size=1",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert data["pages"] == 2
    assert len(data["items"]) == 1


def test_update_own_review(client, db):
    session, user, product = db

    review = Review(
        id=uuid4(),
        product_id=product.id,
        user_id=user.id,
        rating=3,
        comment="Original",
    )

    session.add(review)
    session.commit()

    response = client.patch(
        f"/api/v1/reviews/{review.id}",
        json={
            "rating": 5,
            "title": "Updated",
            "comment": "Updated review",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["rating"] == 5
    assert data["title"] == "Updated"
    assert data["comment"] == "Updated review"


def test_cannot_update_another_users_review(client, db):
    session, user, product = db

    other_user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash="test",
        first_name="Owner",
        last_name="User",
        role_id=user.role_id,
        status="ACTIVE",
        email_verified=True,
    )

    session.add(other_user)

    review = Review(
        id=uuid4(),
        product_id=product.id,
        user_id=other_user.id,
        rating=5,
        comment="Owner review",
    )

    session.add(review)
    session.commit()

    response = client.patch(
        f"/api/v1/reviews/{review.id}",
        json={
            "rating": 1,
            "comment": "Unauthorized update",
        },
    )

    assert response.status_code == 403


def test_delete_own_review(client, db):
    session, user, product = db

    review = Review(
        id=uuid4(),
        product_id=product.id,
        user_id=user.id,
        rating=5,
        comment="Delete me",
    )

    session.add(review)
    session.commit()

    response = client.delete(
        f"/api/v1/reviews/{review.id}",
    )

    assert response.status_code == 204
    assert session.get(Review, review.id) is None


def test_cannot_delete_another_users_review(client, db):
    session, user, product = db

    other_user = User(
        id=uuid4(),
        email="delete-owner@example.com",
        password_hash="test",
        first_name="Delete",
        last_name="Owner",
        role_id=user.role_id,
        status="ACTIVE",
        email_verified=True,
    )

    session.add(other_user)

    review = Review(
        id=uuid4(),
        product_id=product.id,
        user_id=other_user.id,
        rating=5,
        comment="Protected review",
    )

    session.add(review)
    session.commit()

    response = client.delete(
        f"/api/v1/reviews/{review.id}",
    )

    assert response.status_code == 403
