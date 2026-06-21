import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.invoice import Invoice
    from app.models.lead import Lead
    from app.models.referral import Referral
    from app.models.user import User


class Customer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "customers"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL")
    )
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    gst_number: Mapped[Optional[str]] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(Text)
    total_revenue: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    company: Mapped["Company"] = relationship("Company", back_populates="customers")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="customers")
    lead: Mapped[Optional["Lead"]] = relationship("Lead", back_populates="customer")
    creator: Mapped[Optional["User"]] = relationship(
        "User", back_populates="created_customers", foreign_keys=[created_by]
    )
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="customer")
    referrals: Mapped[List["Referral"]] = relationship("Referral", back_populates="customer")
