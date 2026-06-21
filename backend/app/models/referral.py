import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ReferralPayoutStatus
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.user import User


class ReferralLink(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "referral_links"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ambassador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    click_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lead_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conversion_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=10.00, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="referral_links")
    ambassador: Mapped["User"] = relationship("User", back_populates="referral_links")
    clicks: Mapped[List["ReferralClick"]] = relationship(
        "ReferralClick", back_populates="referral_link", cascade="all, delete-orphan"
    )
    referrals: Mapped[List["Referral"]] = relationship("Referral", back_populates="referral_link")


class ReferralClick(Base, UUIDMixin):
    __tablename__ = "referral_clicks"

    referral_link_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    referrer_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    referral_link: Mapped["ReferralLink"] = relationship("ReferralLink", back_populates="clicks")
    company: Mapped["Company"] = relationship("Company", back_populates="referral_clicks")


class Referral(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "referrals"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    referral_link_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("referral_links.id", ondelete="CASCADE"), nullable=False
    )
    ambassador_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL")
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL")
    )
    deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id", ondelete="SET NULL")
    )
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    payout_status: Mapped[ReferralPayoutStatus] = mapped_column(
        default=ReferralPayoutStatus.PENDING, nullable=False, index=True
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    company: Mapped["Company"] = relationship("Company", back_populates="referrals")
    referral_link: Mapped["ReferralLink"] = relationship("ReferralLink", back_populates="referrals")
    ambassador: Mapped["User"] = relationship(
        "User", back_populates="referrals", foreign_keys=[ambassador_id]
    )
    lead: Mapped[Optional["Lead"]] = relationship("Lead", back_populates="referrals")
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="referrals")
    deal: Mapped[Optional["Deal"]] = relationship("Deal", back_populates="referrals")
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])
