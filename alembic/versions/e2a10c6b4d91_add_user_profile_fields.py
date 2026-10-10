"""add user profile fields

Revision ID: e2a10c6b4d91
Revises: c86ae33091c6
Create Date: 2026-10-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e2a10c6b4d91"
down_revision: Union[str, Sequence[str], None] = "c86ae33091c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone_country_code", sa.String(8), nullable=True))
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("profile_photo_url", sa.String(1000), nullable=True))
    op.add_column("users", sa.Column("profile_photo_public_id", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_photo_public_id")
    op.drop_column("users", "profile_photo_url")
    op.drop_column("users", "date_of_birth")
    op.drop_column("users", "phone_country_code")
