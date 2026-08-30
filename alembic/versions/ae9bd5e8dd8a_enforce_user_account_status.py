"""enforce user account status

Revision ID: ae9bd5e8dd8a
Revises: 0eccd8fc5a38
Create Date: 2026-08-30 09:40:00

"""

from typing import Sequence, Union

from alembic import op


revision: str = "ae9bd5e8dd8a"
down_revision: Union[str, Sequence[str], None] = "0eccd8fc5a38"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enforce supported user account statuses."""
    op.create_check_constraint(
        "ck_users_status",
        "users",
        "status IN ('ACTIVE', 'DISABLED', 'UNVERIFIED')",
    )


def downgrade() -> None:
    """Remove the account status constraint."""
    op.drop_constraint(
        "ck_users_status",
        "users",
        type_="check",
    )
