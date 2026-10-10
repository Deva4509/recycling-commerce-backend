"""Remove email verification token storage.

Revision ID: a71d3e9c5b20
Revises: f9c42b781d03
"""
from alembic import op

revision = "a71d3e9c5b20"
down_revision = "f9c42b781d03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_users_email_verification_token_hash",
        "users",
        type_="unique",
    )
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_token_hash")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column(
        "users",
        sa.Column("email_verification_token_hash", sa.String(length=64), nullable=True),
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
