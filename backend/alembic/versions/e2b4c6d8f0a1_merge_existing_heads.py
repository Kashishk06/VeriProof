"""Merge the existing registry and organization lifecycle migration heads.

Revision ID: e2b4c6d8f0a1
Revises: cc341afe9c2a, d91a27e43f5b
"""

from typing import Sequence, Union


revision: str = "e2b4c6d8f0a1"
down_revision: Union[str, Sequence[str], None] = ("cc341afe9c2a", "d91a27e43f5b")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass