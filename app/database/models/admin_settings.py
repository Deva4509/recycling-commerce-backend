from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.models.base import Base, UUIDTimestampMixin


class AdminSettings(UUIDTimestampMixin, Base):
    __tablename__ = "admin_settings"

    __table_args__ = (Index("ix_admin_settings_user_id", "user_id", unique=False),)

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    order_alerts: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    payment_alerts: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    low_stock_alerts: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
    default_currency: Mapped[str] = mapped_column(String(3), default="INR", server_default="INR", nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), default="Asia/Kolkata", server_default="Asia/Kolkata", nullable=False)
    order_processing_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)
