"""Add persisted forensic analyses.

Revision ID: f6b7c8d9e0a1
Revises: e2b4c6d8f0a1
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6b7c8d9e0a1"
down_revision: Union[str, Sequence[str], None] = "e2b4c6d8f0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "forensic_analyses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("analyzed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("risk_score", sa.Float(), nullable=False),
        sa.Column("risk_level", sa.String(length=16), nullable=False),
        sa.Column("features", sa.JSON(), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("hash_matches", sa.Boolean(), nullable=True),
        sa.Column("signature_valid", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["analyzed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["document_id"], ["registered_documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_forensic_analyses_document_id", "forensic_analyses", ["document_id"])
    op.create_index("ix_forensic_analyses_organization_id", "forensic_analyses", ["organization_id"])
    op.create_index("ix_forensic_analyses_created_at", "forensic_analyses", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    if not op.get_context().as_sql:
        analysis_count = bind.execute(sa.text("SELECT COUNT(*) FROM forensic_analyses")).scalar_one()
        if analysis_count:
            raise RuntimeError("Refusing to drop persisted forensic analyses during downgrade.")
    op.drop_index("ix_forensic_analyses_created_at", table_name="forensic_analyses")
    op.drop_index("ix_forensic_analyses_organization_id", table_name="forensic_analyses")
    op.drop_index("ix_forensic_analyses_document_id", table_name="forensic_analyses")
    op.drop_table("forensic_analyses")