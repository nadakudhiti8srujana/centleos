import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DealStatus
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.lead import Lead
    from app.models.referral import Referral
    from app.models.user import User


class Deal(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "deals"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL")
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL")
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    deal_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    probability: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[DealStatus] = mapped_column(default=DealStatus.OPEN, nullable=False)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    workspace: Mapped["Company"] = relationship("Company", back_populates="deals")
    lead: Mapped[Optional["Lead"]] = relationship("Lead", back_populates="deals")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="deals")
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="deals")
    owner: Mapped[Optional["User"]] = relationship(
        "User", back_populates="owned_deals", foreign_keys=[owner_id]
    )
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="deal")
    referrals: Mapped[List["Referral"]] = relationship("Referral", back_populates="deal")
