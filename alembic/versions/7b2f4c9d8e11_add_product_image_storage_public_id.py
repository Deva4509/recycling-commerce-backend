"""add storage public id to product images

Revision ID: 7b2f4c9d8e11
Revises: f9c4d283d0fe
Create Date: 2026-09-10
"""

from alembic import op
import sqlalchemy as sa


revision = "7b2f4c9d8e11"
down_revision = "379c6bc4442f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "product_images",
        sa.Column(
            "storage_public_id",
            sa.String(length=500),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("product_images", "storage_public_id")
