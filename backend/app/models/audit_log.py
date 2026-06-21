from datetime import datetime, timezone
import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String

from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action = Column(String(100), nullable=False)      # e.g., 'login', 'logout', 'create', 'update', 'delete', 'convert'
    entity_type = Column(String(100), nullable=False) # e.g., 'Lead', 'Deal', 'Invoice', 'User', 'Auth'
    entity_id = Column(String(36), nullable=True)     # UUID of the target entity
    
    details = Column(JSON, default=dict)              # the JSON payload, changes, or context
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
