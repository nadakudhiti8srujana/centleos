import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.lead import Lead


class PipelineStage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "pipeline_stages"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(50), default="#94a3b8")
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    workspace: Mapped["Company"] = relationship("Company", back_populates="pipeline_stages")
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="custom_stage")
