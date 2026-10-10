"""update_organization_status_lifecycle

Revision ID: d91a27e43f5b
Revises: ca3258fd46dd
Create Date: 2026-10-09 12:25:00.000000

Migration Policy:
- Adds ACTIVE and REVOKED to PostgreSQL enum 'organizationstatus'.
- Adds 'status_reason' column to 'organizations' table for administrative audit notes.
- Migrates any legacy PENDING and APPROVED organizations to ACTIVE (direct onboarding model).
- Migrates any legacy REJECTED organizations to REVOKED.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd91a27e43f5b'
down_revision: Union[str, Sequence[str], None] = 'ca3258fd46dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # 1. In PostgreSQL, new enum values must be committed before they can be referenced in queries
    if dialect_name == "postgresql":
        op.execute("COMMIT")
        op.execute("ALTER TYPE organizationstatus ADD VALUE IF NOT EXISTS 'ACTIVE'")
        op.execute("ALTER TYPE organizationstatus ADD VALUE IF NOT EXISTS 'REVOKED'")
        op.execute("COMMIT")

    # 2. Add status_reason column
    op.add_column(
        'organizations',
        sa.Column('status_reason', sa.Text(), nullable=True),
    )

    # 3. Data migration: ensure existing records reflect ACTIVE direct-onboarding lifecycle
    op.execute("UPDATE organizations SET status = 'ACTIVE' WHERE status IN ('PENDING', 'APPROVED')")
    op.execute("UPDATE organizations SET status = 'REVOKED' WHERE status = 'REJECTED'")


def downgrade() -> None:
    # 1. Revert data mappings if needed
    op.execute("UPDATE organizations SET status = 'APPROVED' WHERE status = 'ACTIVE'")

    # 2. Drop status_reason column
    op.drop_column('organizations', 'status_reason')
