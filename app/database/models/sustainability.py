from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.product import Product


class SustainabilityProfile(UUIDTimestampMixin, Base):
    """Environmental impact information associated with a product."""

    __tablename__ = "sustainability_profiles"

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            name="uq_sustainability_profiles_product",
        ),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recycled_content_percent: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    material_saved_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )

    co2_avoided_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )

    water_saved_liters: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    energy_saved_kwh: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 3),
        nullable=True,
    )

    recyclability_percent: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    certification: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    certification_details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    product: Mapped["Product"] = relationship(
        "Product",
        back_populates="sustainability_profile",
    )
