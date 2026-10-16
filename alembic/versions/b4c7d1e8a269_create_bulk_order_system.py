"""Create bulk ordering tables.

Revision ID: b4c7d1e8a269
Revises: a71d3e9c5b20
"""

from alembic import op
import sqlalchemy as sa


revision = "b4c7d1e8a269"
down_revision = "a71d3e9c5b20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bulk_order_product_configs",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("minimum_quantity", sa.Integer(), server_default="10", nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default="true", nullable=False),
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
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id"),
        sa.CheckConstraint(
            "minimum_quantity > 0",
            name="ck_bulk_config_minimum_positive",
        ),
    )

    op.create_table(
        "bulk_order_pricing_tiers",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("minimum_quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
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
            ["product_id"],
            ["products.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "product_id",
            "minimum_quantity",
            name="uq_bulk_tier_product_minimum",
        ),
        sa.CheckConstraint(
            "minimum_quantity > 0",
            name="ck_bulk_tier_minimum_positive",
        ),
        sa.CheckConstraint(
            "unit_price >= 0",
            name="ck_bulk_tier_price_nonnegative",
        ),
    )
    op.create_index(
        "ix_bulk_order_pricing_tiers_product_id",
        "bulk_order_pricing_tiers",
        ["product_id"],
    )

    op.create_table(
        "bulk_order_requests",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("organization_name", sa.String(length=200), nullable=False),
        sa.Column("contact_name", sa.String(length=200), nullable=False),
        sa.Column("contact_email", sa.String(length=320), nullable=False),
        sa.Column("contact_phone", sa.String(length=30), nullable=False),
        sa.Column("delivery_address", sa.Text(), nullable=False),
        sa.Column("delivery_pin_code", sa.String(length=12), nullable=False),
        sa.Column("expected_delivery_date", sa.Date(), nullable=True),
        sa.Column("intended_use", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=30),
            server_default="PENDING",
            nullable=False,
        ),
        sa.Column("minimum_quantity_snapshot", sa.Integer(), nullable=False),
        sa.Column("quoted_unit_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("quoted_total", sa.Numeric(12, 2), nullable=True),
        sa.Column("quote_valid_until", sa.Date(), nullable=True),
        sa.Column("quote_terms", sa.Text(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("converted_order_id", sa.Uuid(), nullable=True),
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
            ["user_id"],
            ["users.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["converted_order_id"],
            ["orders.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("converted_order_id"),
        sa.CheckConstraint(
            "quantity > 0",
            name="ck_bulk_request_quantity_positive",
        ),
        sa.CheckConstraint(
            "minimum_quantity_snapshot > 0",
            name="ck_bulk_request_minimum_positive",
        ),
        sa.CheckConstraint(
            "quoted_unit_price IS NULL OR quoted_unit_price >= 0",
            name="ck_bulk_request_quote_price_nonnegative",
        ),
        sa.CheckConstraint(
            "quoted_total IS NULL OR quoted_total >= 0",
            name="ck_bulk_request_quote_total_nonnegative",
        ),
        sa.CheckConstraint(
            "(quoted_unit_price IS NULL AND quoted_total IS NULL) OR "
            "(quoted_unit_price IS NOT NULL AND quoted_total IS NOT NULL)",
            name="ck_bulk_request_quote_values_paired",
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'UNDER_REVIEW', 'QUOTE_SENT', "
            "'ACCEPTED', 'REJECTED', 'FULFILLED')",
            name="ck_bulk_request_status",
        ),
    )
    op.create_index(
        "ix_bulk_order_requests_user_id",
        "bulk_order_requests",
        ["user_id"],
    )
    op.create_index(
        "ix_bulk_order_requests_product_id",
        "bulk_order_requests",
        ["product_id"],
    )
    op.create_index(
        "ix_bulk_order_requests_status",
        "bulk_order_requests",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_bulk_order_requests_status",
        table_name="bulk_order_requests",
    )
    op.drop_index(
        "ix_bulk_order_requests_product_id",
        table_name="bulk_order_requests",
    )
    op.drop_index(
        "ix_bulk_order_requests_user_id",
        table_name="bulk_order_requests",
    )
    op.drop_table("bulk_order_requests")
    op.drop_index(
        "ix_bulk_order_pricing_tiers_product_id",
        table_name="bulk_order_pricing_tiers",
    )
    op.drop_table("bulk_order_pricing_tiers")
    op.drop_table("bulk_order_product_configs")
