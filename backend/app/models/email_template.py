from datetime import datetime, timezone
import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text

from app.models.base import Base


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    trigger_event = Column(String(100), nullable=False)  # e.g., 'lead_assigned', 'deal_won', 'invoice_generated', 'referral_converted'
    
    subject = Column(String(255), nullable=False)
    body_html = Column(Text, nullable=False)
    body_text = Column(Text, nullable=True)
    
    variables = Column(JSON, default=list)  # e.g., ["lead_name", "deal_value", "link"]
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
