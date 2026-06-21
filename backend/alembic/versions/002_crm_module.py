"""CRM module migration: accounts table, lead stage/owner_id, deal owner_id

Revision ID: 002_crm_module
Revises: 001_initial
Create Date: 2026-06-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_crm_module"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename enum type from Phase 1 if present (Skipped for SQLite)
    # op.execute("ALTER TYPE lead_status RENAME TO lead_stage")

    op.create_table(
        "accounts",
        sa.Column("id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_accounts_company_id", "accounts", ["company_id"])
    op.create_index("ix_accounts_name", "accounts", ["name"])

    # Leads: status -> stage, assigned_to -> owner_id
    op.alter_column("leads", "status", new_column_name="stage")
    op.alter_column("leads", "assigned_to", new_column_name="owner_id")
    op.create_index("ix_leads_stage", "leads", ["stage"], unique=False)
    op.create_index("ix_leads_owner_id", "leads", ["owner_id"], unique=False)

    op.add_column("leads", sa.Column("account_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_leads_account_id", "leads", "accounts", ["account_id"], ["id"], ondelete="SET NULL"
    )

    # Contacts: account_id
    op.add_column("contacts", sa.Column("account_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_contacts_account_id", "contacts", ["account_id"], unique=False)
    op.create_foreign_key(
        "fk_contacts_account_id", "contacts", "accounts", ["account_id"], ["id"], ondelete="SET NULL"
    )

    # Deals: assigned_to -> owner_id, account_id
    op.alter_column("deals", "assigned_to", new_column_name="owner_id")
    op.create_index("ix_deals_owner_id", "deals", ["owner_id"], unique=False)

    op.add_column("deals", sa.Column("account_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_deals_account_id", "deals", "accounts", ["account_id"], ["id"], ondelete="SET NULL"
    )


def downgrade() -> None:
    op.drop_constraint("fk_deals_account_id", "deals", type_="foreignkey")
    op.drop_column("deals", "account_id")
    op.alter_column("deals", "owner_id", new_column_name="assigned_to")

    op.drop_constraint("fk_contacts_account_id", "contacts", type_="foreignkey")
    op.drop_index("ix_contacts_account_id", table_name="contacts")
    op.drop_column("contacts", "account_id")

    op.drop_constraint("fk_leads_account_id", "leads", type_="foreignkey")
    op.drop_column("leads", "account_id")
    op.drop_index("ix_leads_owner_id", table_name="leads")
    op.drop_index("ix_leads_stage", table_name="leads")
    op.alter_column("leads", "owner_id", new_column_name="assigned_to")
    op.alter_column("leads", "stage", new_column_name="status")

    op.drop_index("ix_accounts_name", table_name="accounts")
    op.drop_index("ix_accounts_company_id", table_name="accounts")
    op.drop_table("accounts")

    op.execute("ALTER TYPE lead_stage RENAME TO lead_status")
