"""Create the signed document registry.

Revision ID: cc341afe9c2a
Revises: a73d9f2c1e44
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "cc341afe9c2a"
down_revision: Union[str, Sequence[str], None] = "a73d9f2c1e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "registered_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("public_verification_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("document_type", sa.String(length=100), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("issuer_user_id", sa.Integer(), nullable=False),
        sa.Column("recipient_name", sa.String(length=255), nullable=True),
        sa.Column("recipient_identifier", sa.String(length=255), nullable=True),
        sa.Column("recipient_email", sa.String(length=255), nullable=True),
        sa.Column("issuer_notes", sa.Text(), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=36), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256_hash", sa.String(length=64), nullable=False),
        sa.Column("signature_algorithm", sa.String(length=50), nullable=False),
        sa.Column("signature_value", sa.Text(), nullable=False),
        sa.Column("signing_key_id", sa.String(length=100), nullable=False),
        sa.Column("signing_public_key", sa.Text(), nullable=False),
        sa.Column("signed_manifest", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revocation_reason", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("previous_version_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('ACTIVE', 'REVOKED')", name="ck_registered_documents_status"),
        sa.CheckConstraint("version >= 1", name="ck_registered_documents_version"),
        sa.CheckConstraint("size_bytes > 0", name="ck_registered_documents_size"),
        sa.CheckConstraint("length(sha256_hash) = 64", name="ck_registered_documents_hash_length"),
        sa.CheckConstraint("expires_at IS NULL OR expires_at > issued_at", name="ck_registered_documents_expiry"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["issuer_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["previous_version_id"], ["registered_documents.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_verification_id", name="uq_registered_documents_public_id"),
        sa.UniqueConstraint("storage_key", name="uq_registered_documents_storage_key"),
    )
    op.create_index("ix_registered_documents_organization_id", "registered_documents", ["organization_id"])
    op.create_index("ix_registered_documents_issuer_user_id", "registered_documents", ["issuer_user_id"])
    op.create_index("ix_registered_documents_sha256_hash", "registered_documents", ["sha256_hash"])
    op.create_index("ix_registered_documents_status", "registered_documents", ["status"])


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        raise RuntimeError("This migration requires PostgreSQL, the configured production database dialect.")
    if not op.get_context().as_sql:
        document_count = bind.execute(sa.text("SELECT COUNT(*) FROM registered_documents")).scalar_one()
        if document_count:
            raise RuntimeError("Refusing to drop registered documents during downgrade; preserve registry records first.")
    op.drop_index("ix_registered_documents_status", table_name="registered_documents")
    op.drop_index("ix_registered_documents_sha256_hash", table_name="registered_documents")
    op.drop_index("ix_registered_documents_issuer_user_id", table_name="registered_documents")
    op.drop_index("ix_registered_documents_organization_id", table_name="registered_documents")
    op.drop_table("registered_documents")