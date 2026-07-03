"""create query_logs table

Revision ID: 0001
Revises:
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "query_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("request_id", sa.String(36), nullable=False),
        sa.Column("session_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("carat", sa.Float(), nullable=False),
        sa.Column("cut", sa.String(20), nullable=False),
        sa.Column("color", sa.String(5), nullable=False),
        sa.Column("clarity", sa.String(10), nullable=False),
        sa.Column("shape", sa.String(20), nullable=True),
        sa.Column("fluorescence", sa.String(20), nullable=True),
        sa.Column("is_batch", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("batch_size", sa.Integer(), nullable=True),
        sa.Column("price_low", sa.Float(), nullable=False),
        sa.Column("price_mid", sa.Float(), nullable=False),
        sa.Column("price_high", sa.Float(), nullable=False),
        sa.Column("confidence_level", sa.String(10), nullable=False),
        sa.Column("low_confidence", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("latency_ms", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_query_logs_request_id", "query_logs", ["request_id"])
    op.create_index("ix_query_logs_created_at", "query_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_query_logs_created_at", table_name="query_logs")
    op.drop_index("ix_query_logs_request_id", table_name="query_logs")
    op.drop_table("query_logs")
