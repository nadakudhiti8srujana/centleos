from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.enums import ActivityType
from app.schemas.common import BaseSchema


class ActivityBase(BaseModel):
    activity_type: ActivityType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    activity_type: Optional[ActivityType] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ActivityCreatorSummary(BaseSchema):
    id: UUID
    full_name: str
    email: str


class ActivityResponse(BaseSchema):
    id: UUID
    company_id: UUID
    lead_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[ActivityCreatorSummary] = None


class ActivityTimelineResponse(BaseModel):
    lead_id: UUID
    total: int
    activities: list[ActivityResponse]
