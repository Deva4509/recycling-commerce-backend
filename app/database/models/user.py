from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.database.models.address import Address
    from app.database.models.cart import Cart
    from app.database.models.order import Order
    from app.database.models.review import Review
    from app.database.models.role import Role


class AccountStatus(StrEnum):
    """Supported user account states."""

    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    UNVERIFIED = "UNVERIFIED"


class User(UUIDTimestampMixin, Base):
    """Application user account."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default=AccountStatus.UNVERIFIED.value,
        server_default=AccountStatus.UNVERIFIED.value,
        nullable=False,
    )

    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    google_subject: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
    )

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
    )

    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan",
    )


    addresses: Mapped[list["Address"]] = relationship(
        "Address",
        back_populates="user",
        cascade="all, delete-orphan",
    )


    cart: Mapped["Cart | None"] = relationship(
        "Cart",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    reviews: Mapped[list["Review"]] = relationship(
        "Review",
        back_populates="user",
    )
