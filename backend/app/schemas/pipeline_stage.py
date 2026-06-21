import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PipelineStageBase(BaseModel):
    name: str
    color: Optional[str] = "#94a3b8"
    order: Optional[int] = 0

class PipelineStageCreate(PipelineStageBase):
    pass

class PipelineStageUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None

class PipelineStageOut(PipelineStageBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
