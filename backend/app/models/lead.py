import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func, UniqueConstraint
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import LeadSource, LeadStage
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.customer import Customer
    from app.models.deal import Deal
    from app.models.referral import Referral
    from app.models.user import User
    from app.models.pipeline_stage import PipelineStage


class Lead(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("company_id", "email", name="uq_leads_company_email"),
        UniqueConstraint("company_id", "phone", name="uq_leads_company_phone"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    source: Mapped[LeadSource] = mapped_column(
        SAEnum(LeadSource, name="lead_source", native_enum=True),
        default=LeadSource.ORGANIC,
        nullable=False,
    )
    stage: Mapped[LeadStage] = mapped_column(
        SAEnum(LeadStage, name="lead_stage", native_enum=True),
        default=LeadStage.NEW,
        nullable=False,
        index=True,
    )
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    custom_stage_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), index=True
    )
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL")
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL")
    )
    lead_company: Mapped[Optional[str]] = mapped_column(String(255))
    ai_score: Mapped[Optional[int]] = mapped_column(Integer)
    ai_next_action: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    referral_code: Mapped[Optional[str]] = mapped_column(String(50))

    workspace: Mapped["Company"] = relationship("Company", back_populates="leads")
    owner: Mapped[Optional["User"]] = relationship(
        "User", back_populates="owned_leads", foreign_keys=[owner_id]
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User", back_populates="created_leads", foreign_keys=[created_by]
    )
    account: Mapped[Optional["Account"]] = relationship("Account", back_populates="leads")
    contact: Mapped[Optional["Contact"]] = relationship("Contact", back_populates="leads")
    activities: Mapped[List["Activity"]] = relationship(
        "Activity", back_populates="lead", cascade="all, delete-orphan"
    )
    deals: Mapped[List["Deal"]] = relationship("Deal", back_populates="lead")
    history: Mapped[List["LeadHistory"]] = relationship(
        "LeadHistory", back_populates="lead", cascade="all, delete-orphan"
    )
    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer", back_populates="lead", uselist=False
    )
    referrals: Mapped[List["Referral"]] = relationship("Referral", back_populates="lead")
    custom_stage: Mapped[Optional["PipelineStage"]] = relationship("PipelineStage", back_populates="leads")


class LeadHistory(Base, UUIDMixin):
    __tablename__ = "lead_history"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    field_changed: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text)
    new_value: Mapped[Optional[str]] = mapped_column(Text)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    lead: Mapped["Lead"] = relationship("Lead", back_populates="history")
    workspace: Mapped["Company"] = relationship("Company", back_populates="lead_history")
    changed_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="lead_history_entries"
    )
