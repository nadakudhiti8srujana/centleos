from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.enums import DealStatus
from app.schemas.common import BaseSchema
from app.schemas.crm.lead import OwnerSummary


class DealBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    deal_value: Decimal = Field(default=Decimal("0"), ge=0)
    probability: int = Field(default=0, ge=0, le=100)
    expected_close_date: Optional[date] = None
    status: DealStatus = DealStatus.OPEN
    lead_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    deal_value: Optional[Decimal] = Field(None, ge=0)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    status: Optional[DealStatus] = None
    lead_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    notes: Optional[str] = None


class DealResponse(BaseSchema):
    id: UUID
    company_id: UUID
    name: str
    deal_value: Decimal
    probability: int
    expected_close_date: Optional[date] = None
    status: DealStatus
    lead_id: Optional[UUID] = None
    contact_id: Optional[UUID] = None
    account_id: Optional[UUID] = None
    owner_id: Optional[UUID] = None
    notes: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    owner: Optional[OwnerSummary] = None
