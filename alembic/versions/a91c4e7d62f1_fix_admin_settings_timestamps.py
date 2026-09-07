"""fix admin settings timestamps

Revision ID: a91c4e7d62f1
Revises: f3a7b9c21d44
"""

from alembic import op
import sqlalchemy as sa

revision = "a91c4e7d62f1"
down_revision = "f3a7b9c21d44"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "admin_settings",
        "created_at",
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )
    op.alter_column(
        "admin_settings",
        "updated_at",
        server_default=sa.text("CURRENT_TIMESTAMP"),
    )


def downgrade():
    op.alter_column("admin_settings", "created_at", server_default=None)
    op.alter_column("admin_settings", "updated_at", server_default=None)
