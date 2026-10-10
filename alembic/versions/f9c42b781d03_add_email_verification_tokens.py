"""add email verification token storage

Revision ID: f9c42b781d03
Revises: e2a10c6b4d91
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "f9c42b781d03"
down_revision: Union[str, Sequence[str], None] = "e2a10c6b4d91"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verification_token_hash", sa.String(64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_email_verification_token_hash",
        "users",
        ["email_verification_token_hash"],
    )
    op.add_column(
        "users",
        sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

def downgrade() -> None:
    op.drop_column("users", "email_verification_expires_at")
    op.drop_constraint(
        "uq_users_email_verification_token_hash", "users", type_="unique"
    )
    op.drop_column("users", "email_verification_token_hash")
