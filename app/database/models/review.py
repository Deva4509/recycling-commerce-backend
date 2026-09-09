from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.product import Product
    from app.database.models.user import User


class Review(UUIDTimestampMixin, Base):
    """Customer review and rating for a product."""

    __tablename__ = "reviews"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    title: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="reviews",
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="reviews",
    )

    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_reviews_rating_range",
        ),
        UniqueConstraint(
            "user_id",
            "product_id",
            name="uq_reviews_user_product",
        ),
        Index(
            "ix_reviews_product_id",
            "product_id",
        ),
        Index(
            "ix_reviews_user_id",
            "user_id",
        ),
    )
