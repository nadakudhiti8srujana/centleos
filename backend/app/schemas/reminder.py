import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ReminderBase(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    title: str
    description: Optional[str] = None
    due_date: datetime

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class ReminderOut(ReminderBase):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
