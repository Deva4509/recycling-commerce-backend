from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.catalog import Category
    from app.database.models.image import ProductImage
    from app.database.models.inventory import InventoryItem
    from app.database.models.specification import ProductSpecification
    from app.database.models.sustainability import SustainabilityProfile
    from app.database.models.variant import ProductVariant
    from app.database.models.review import Review


class Product(UUIDTimestampMixin, Base):
    """Recyclable or recycled product listed in the marketplace."""

    __tablename__ = "products"

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(220),
        unique=True,
        index=True,
        nullable=False,
    )

    sku: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    short_description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    base_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        server_default="INR",
        nullable=False,
    )

    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="products",
    )

    inventory_items: Mapped[list["InventoryItem"]] = relationship(
        "InventoryItem",
        back_populates="product",
    )

    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    specifications: Mapped[list["ProductSpecification"]] = relationship(
        "ProductSpecification",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    sustainability_profile: Mapped["SustainabilityProfile | None"] = relationship(
        "SustainabilityProfile",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="product",
    )
