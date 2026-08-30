"""create inventory system

Revision ID: 3e2091dc1041
Revises: f9c4d283d0fe
Create Date: 2026-08-30 09:55:10

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3e2091dc1041"
down_revision: Union[str, Sequence[str], None] = "f9c4d283d0fe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the inventory system with database-level validation."""

    op.create_table(
        "inventory_locations",
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_inventory_locations_code",
        "inventory_locations",
        ["code"],
        unique=True,
    )

    op.create_table(
        "inventory_items",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("location_id", sa.Uuid(), nullable=False),
        sa.Column(
            "quantity",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "reserved_quantity",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "low_stock_threshold",
            sa.Integer(),
            server_default="10",
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["location_id"],
            ["inventory_locations.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "product_id",
            "location_id",
            name="uq_inventory_items_product_location",
        ),
        sa.CheckConstraint(
            "quantity >= 0",
            name="ck_inventory_items_quantity_non_negative",
        ),
        sa.CheckConstraint(
            "reserved_quantity >= 0",
            name="ck_inventory_items_reserved_non_negative",
        ),
        sa.CheckConstraint(
            "low_stock_threshold >= 0",
            name="ck_inventory_items_threshold_non_negative",
        ),
        sa.CheckConstraint(
            "reserved_quantity <= quantity",
            name="ck_inventory_items_reserved_lte_quantity",
        ),
    )

    op.create_index(
        "ix_inventory_items_location_id",
        "inventory_items",
        ["location_id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_items_product_id",
        "inventory_items",
        ["product_id"],
        unique=False,
    )

    op.create_table(
        "inventory_movements",
        sa.Column("inventory_item_id", sa.Uuid(), nullable=False),
        sa.Column("location_id", sa.Uuid(), nullable=False),
        sa.Column(
            "movement_type",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column("quantity_change", sa.Integer(), nullable=False),
        sa.Column("reference_id", sa.Uuid(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["inventory_item_id"],
            ["inventory_items.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["location_id"],
            ["inventory_locations.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "movement_type IN "
            "('RECEIVE', 'SALE', 'ADJUSTMENT', "
            "'RETURN', 'DAMAGE', 'TRANSFER')",
            name="ck_inventory_movements_type",
        ),
    )

    op.create_index(
        "ix_inventory_movements_inventory_item_id",
        "inventory_movements",
        ["inventory_item_id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_movements_location_id",
        "inventory_movements",
        ["location_id"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_movements_movement_type",
        "inventory_movements",
        ["movement_type"],
        unique=False,
    )

    op.create_index(
        "ix_inventory_movements_reference_id",
        "inventory_movements",
        ["reference_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove the inventory system."""

    op.drop_index(
        "ix_inventory_movements_reference_id",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_inventory_movements_movement_type",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_inventory_movements_location_id",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_inventory_movements_inventory_item_id",
        table_name="inventory_movements",
    )
    op.drop_table("inventory_movements")

    op.drop_index(
        "ix_inventory_items_product_id",
        table_name="inventory_items",
    )
    op.drop_index(
        "ix_inventory_items_location_id",
        table_name="inventory_items",
    )
    op.drop_table("inventory_items")

    op.drop_index(
        "ix_inventory_locations_code",
        table_name="inventory_locations",
    )
    op.drop_table("inventory_locations")
