import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.user import User


class Account(Base, UUIDMixin, TimestampMixin):
    """CRM company account (B2B organization within a workspace)."""

    __tablename__ = "accounts"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    website: Mapped[Optional[str]] = mapped_column(String(500))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    workspace: Mapped["Company"] = relationship("Company", back_populates="accounts")
    creator: Mapped[Optional["User"]] = relationship(
        "User", back_populates="created_accounts", foreign_keys=[created_by]
    )
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="account")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="account")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="account")
