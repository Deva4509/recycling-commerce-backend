"""initialize database migration

Revision ID: 3adb2280102c
Revises: 
Create Date: 2026-08-30 09:28:37.409051

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = '3adb2280102c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
