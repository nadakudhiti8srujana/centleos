"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-06-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Run database/schema.sql for fresh installs, or use autogenerate.
    # This revision is a placeholder for existing Phase 1 deployments.
    pass


def downgrade() -> None:
    pass
