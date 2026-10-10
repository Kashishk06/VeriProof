"""Add private organization document metadata and UTC timestamps.

Revision ID: a73d9f2c1e44
Revises: d91a27e43f5b
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a73d9f2c1e44"
down_revision: Union[str, Sequence[str], None] = "d91a27e43f5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TIMESTAMP_COLUMNS = (
    ("users", "created_at"),
    ("organizations", "reviewed_at"),
    ("organizations", "created_at"),
    ("organizations", "updated_at"),
    ("audit_events", "created_at"),
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        raise RuntimeError("This migration requires PostgreSQL, the configured production database dialect.")

    if not op.get_context().as_sql:
        duplicate_registration = bind.execute(
            sa.text(
                "SELECT 1 FROM organizations "
                "GROUP BY registration_number HAVING COUNT(*) > 1 LIMIT 1"
            )
        ).first()
        if duplicate_registration:
            raise RuntimeError(
                "Cannot add organization registration uniqueness while duplicate registration numbers exist. "
                "Resolve duplicates explicitly before retrying this migration."
            )

    op.create_table(
        "organization_documents",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("document_type", sa.String(length=16), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=36), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "document_type IN ('PRIMARY', 'SUPPORTING')",
            name="ck_organization_documents_type",
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("storage_key", name="uq_organization_documents_storage_key"),
    )
    op.create_index(
        op.f("ix_organization_documents_organization_id"),
        "organization_documents",
        ["organization_id"],
        unique=False,
    )
    op.create_unique_constraint(
        "uq_organizations_registration_number",
        "organizations",
        ["registration_number"],
    )

    for table_name, column_name in _TIMESTAMP_COLUMNS:
        op.alter_column(
            table_name,
            column_name,
            existing_type=sa.DateTime(),
            type_=sa.DateTime(timezone=True),
            postgresql_using=f"{column_name} AT TIME ZONE 'UTC'",
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        raise RuntimeError("This migration requires PostgreSQL, the configured production database dialect.")

    if not op.get_context().as_sql:
        document_count = bind.execute(sa.text("SELECT COUNT(*) FROM organization_documents")).scalar_one()
        if document_count:
            raise RuntimeError(
                "Refusing to remove stored organization document metadata during downgrade. "
                "Export or otherwise preserve those records before retrying."
            )

    op.drop_constraint("uq_organizations_registration_number", "organizations", type_="unique")
    op.drop_index(op.f("ix_organization_documents_organization_id"), table_name="organization_documents")
    op.drop_table("organization_documents")

    for table_name, column_name in reversed(_TIMESTAMP_COLUMNS):
        op.alter_column(
            table_name,
            column_name,
            existing_type=sa.DateTime(timezone=True),
            type_=sa.DateTime(),
            postgresql_using=f"{column_name} AT TIME ZONE 'UTC'",
        )