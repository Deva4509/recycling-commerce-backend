"""Create transactional order outbox and admin notifications."""
from alembic import op
import sqlalchemy as sa

revision = "e71b4c9a2d10"
down_revision = 'b4c7d1e8a269'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "order_event_outbox",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("event_key", sa.String(150), nullable=False, unique=True),
        sa.Column("order_id", sa.Uuid(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_order_event_outbox_order_id", "order_event_outbox", ["order_id"])
    op.create_table(
        "admin_order_notifications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("event_key", sa.String(150), nullable=False),
        sa.Column("order_id", sa.Uuid(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_number", sa.String(50), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="INR", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("event_key", name="uq_admin_order_notification_event_key"),
    )
    op.create_index("ix_admin_order_notifications_order_id", "admin_order_notifications", ["order_id"])

def downgrade():
    op.drop_index("ix_admin_order_notifications_order_id", table_name="admin_order_notifications")
    op.drop_table("admin_order_notifications")
    op.drop_index("ix_order_event_outbox_order_id", table_name="order_event_outbox")
    op.drop_table("order_event_outbox")
