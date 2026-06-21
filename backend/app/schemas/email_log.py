from datetime import datetime
from typing import Optional
from uuid import UUID

from app.models.email_log import EmailStatus
from app.schemas.common import BaseSchema


class EmailLogResponse(BaseSchema):
    id: UUID
    company_id: UUID
    recipient: str
    subject: str
    status: EmailStatus
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
