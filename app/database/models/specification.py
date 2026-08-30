from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.product import Product


class ProductSpecification(UUIDTimestampMixin, Base):
    """Flexible key-value specification for a product."""

    __tablename__ = "product_specifications"

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "name",
            name="uq_product_specifications_product_name",
        ),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="specifications",
    )
