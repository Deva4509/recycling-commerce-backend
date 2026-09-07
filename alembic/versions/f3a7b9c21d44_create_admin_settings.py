"""create admin settings

Revision ID: f3a7b9c21d44
Revises: ce4377c5fc33
"""

from alembic import op
import sqlalchemy as sa


revision = "f3a7b9c21d44"
down_revision = "ce4377c5fc33"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "admin_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("order_alerts", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("payment_alerts", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("low_stock_alerts", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("default_currency", sa.String(length=3), server_default="INR", nullable=False),
        sa.Column("timezone", sa.String(length=100), server_default="Asia/Kolkata", nullable=False),
        sa.Column("order_processing_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_admin_settings_user_id", "admin_settings", ["user_id"], unique=False)


def downgrade():
    op.drop_index("ix_admin_settings_user_id", table_name="admin_settings")
    op.drop_table("admin_settings")
