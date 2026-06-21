from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import LeadSource, LeadStage
from app.schemas.common import BaseSchema


class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    source: LeadSource = LeadSource.ORGANIC
    stage: LeadStage = LeadStage.NEW
    owner_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_company: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    referral_code: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    source: Optional[LeadSource] = None
    stage: Optional[LeadStage] = None
    owner_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_company: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class LeadStageUpdate(BaseModel):
    stage: Optional[LeadStage] = None
    custom_stage_id: Optional[UUID] = None


class OwnerSummary(BaseSchema):
    id: UUID
    full_name: str
    email: str


class LeadResponse(BaseSchema):
    id: UUID
    company_id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: LeadSource
    stage: LeadStage
    owner_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    lead_company: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[UUID] = None
    referral_code: Optional[str] = None

    class Config:
        from_attributes = True
    ai_score: Optional[int] = None
    ai_next_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner: Optional[OwnerSummary] = None


class LeadHistoryResponse(BaseSchema):
    id: UUID
    lead_id: UUID
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[UUID] = None
    created_at: datetime


class PipelineStageColumn(BaseModel):
    stage: str
    stage_id: Optional[UUID] = None
    color: Optional[str] = None
    count: int
    leads: List[LeadResponse]


class PipelineResponse(BaseModel):
    stages: List[PipelineStageColumn]
    total_leads: int


class LeadFilterParams(BaseModel):
    stage: Optional[LeadStage] = None
    source: Optional[LeadSource] = None
    owner_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
