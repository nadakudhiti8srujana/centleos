import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.user import User


class Contact(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "contacts"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), index=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    job_title: Mapped[Optional[str]] = mapped_column(String(100))
    contact_company: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    workspace: Mapped["Company"] = relationship("Company", back_populates="contacts")
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="contacts")
    creator: Mapped[Optional["User"]] = relationship(
        "User", back_populates="created_contacts", foreign_keys=[created_by]
    )
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="contact")
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="contact")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="contact")
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="contact")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
