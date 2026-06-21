from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AttachmentBase(BaseModel):
    entity_type: str
    entity_id: UUID
    file_name: str
    content_type: str
    file_size: int


class AttachmentOut(AttachmentBase):
    id: UUID
    company_id: UUID
    file_path: str
    uploaded_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
