from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User


class Attachment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attachments"

    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True) # "lead", "deal", "invoice"
    entity_id: Mapped[UUID] = mapped_column(index=True)
    
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int] = mapped_column(Integer) # in bytes

    uploaded_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company")
    uploader: Mapped["User"] = relationship("User")
