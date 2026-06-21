import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.invoice import Invoice
    from app.models.lead import Lead, LeadHistory
    from app.models.notification import Notification
    from app.models.referral import Referral, ReferralLink


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    role: Mapped[UserRole] = mapped_column(nullable=False, default=UserRole.SALES_REPRESENTATIVE)
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="users")

    @property
    def company_name(self) -> Optional[str]:
        return self.company.name if self.company else None

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    owned_leads: Mapped[List["Lead"]] = relationship(
        "Lead", back_populates="owner", foreign_keys="Lead.owner_id"
    )
    created_accounts: Mapped[List["Account"]] = relationship(
        "Account", back_populates="creator", foreign_keys="Account.created_by"
    )
    created_leads: Mapped[List["Lead"]] = relationship(
        "Lead", back_populates="creator", foreign_keys="Lead.created_by"
    )
    owned_deals: Mapped[List["Deal"]] = relationship(
        "Deal", back_populates="owner", foreign_keys="Deal.owner_id"
    )
    referral_links: Mapped[List["ReferralLink"]] = relationship(
        "ReferralLink", back_populates="ambassador"
    )
    referrals: Mapped[List["Referral"]] = relationship(
        "Referral", back_populates="ambassador", foreign_keys="Referral.ambassador_id"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    activities: Mapped[List["Activity"]] = relationship(
        "Activity", back_populates="creator", foreign_keys="Activity.created_by"
    )
    created_contacts: Mapped[List["Contact"]] = relationship(
        "Contact", back_populates="creator", foreign_keys="Contact.created_by"
    )
    created_customers: Mapped[List["Customer"]] = relationship(
        "Customer", back_populates="creator", foreign_keys="Customer.created_by"
    )
    created_invoices: Mapped[List["Invoice"]] = relationship(
        "Invoice", back_populates="creator", foreign_keys="Invoice.created_by"
    )
    lead_history_entries: Mapped[List["LeadHistory"]] = relationship(
        "LeadHistory", back_populates="changed_by_user"
    )


class RefreshToken(Base, UUIDMixin):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
