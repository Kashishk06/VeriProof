"""Persist registered ML inference signals with forensic analyses.

Revision ID: b7c8d9e0a1f2
Revises: f6b7c8d9e0a1
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0a1f2"
down_revision: Union[str, Sequence[str], None] = "f6b7c8d9e0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "forensic_analyses",
        sa.Column("ml_signals", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
    )
    op.alter_column("forensic_analyses", "ml_signals", server_default=None)


def downgrade() -> None:
    op.drop_column("forensic_analyses", "ml_signals")