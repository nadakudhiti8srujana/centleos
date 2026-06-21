from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.activity import Activity
    from app.models.contact import Contact
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.invoice import Invoice
    from app.models.lead import Lead, LeadHistory
    from app.models.notification import Notification
    from app.models.pipeline_stage import PipelineStage
    from app.models.referral import Referral, ReferralClick, ReferralLink
    from app.models.reminder import Reminder
    from app.models.user import User
    from app.models.email_log import EmailLog


class Company(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    users: Mapped[List["User"]] = relationship("User", back_populates="company")
    accounts: Mapped[List["Account"]] = relationship("Account", back_populates="workspace")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="workspace")
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="workspace")
    activities: Mapped[List["Activity"]] = relationship("Activity", back_populates="workspace")
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="workspace")
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="company")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="company")
    referral_links: Mapped[List["ReferralLink"]] = relationship(
        "ReferralLink", back_populates="company"
    )
    referrals: Mapped[List["Referral"]] = relationship("Referral", back_populates="company")
    referral_clicks: Mapped[List["ReferralClick"]] = relationship(
        "ReferralClick", back_populates="company"
    )
    lead_history: Mapped[List["LeadHistory"]] = relationship(
        "LeadHistory", back_populates="workspace"
    )
    reminders: Mapped[List["Reminder"]] = relationship(
        "Reminder", back_populates="workspace", cascade="all, delete-orphan"
    )
    pipeline_stages: Mapped[List["PipelineStage"]] = relationship(
        "PipelineStage", back_populates="workspace", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="company"
    )
    email_logs: Mapped[List["EmailLog"]] = relationship(
        "EmailLog", back_populates="workspace", cascade="all, delete-orphan"
    )
