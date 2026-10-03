"""add payment provider event id

Revision ID: c86ae33091c6
Revises: 7b2f4c9d8e11
Create Date: 2026-10-02 10:53:22.818175

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = 'c86ae33091c6'
down_revision: Union[str, Sequence[str], None] = '7b2f4c9d8e11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column(
            "provider_event_id",
            sa.String(length=255),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_payments_provider_event_id",
        "payments",
        ["provider_event_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_payments_provider_event_id",
        table_name="payments",
    )
    op.drop_column("payments", "provider_event_id")
