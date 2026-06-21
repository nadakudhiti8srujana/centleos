from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.core.enums import ReferralPayoutStatus
from app.schemas.common import BaseSchema
from app.schemas.user import UserResponse


class ReferralLinkCreate(BaseSchema):
    code: Optional[str] = Field(None, description="Custom referral code. Auto-generated if not provided.")
    commission_rate: Optional[Decimal] = Field(10.00, description="Commission percentage.")


class ReferralLinkResponse(BaseSchema):
    id: UUID
    company_id: UUID
    ambassador_id: UUID
    code: str
    url: str
    click_count: int
    lead_count: int
    conversion_count: int
    commission_rate: Decimal
    is_active: bool
    created_at: datetime


class ReferralClickResponse(BaseSchema):
    id: UUID
    referral_link_id: UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer_url: Optional[str] = None
    created_at: datetime


class ReferralResponse(BaseSchema):
    id: UUID
    company_id: UUID
    referral_link_id: UUID
    ambassador_id: UUID
    lead_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    commission_amount: Decimal
    payout_status: ReferralPayoutStatus
    converted_at: Optional[datetime] = None
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    
    ambassador: Optional[UserResponse] = None


class PayoutApproveRequest(BaseSchema):
    amount: Optional[Decimal] = Field(None, description="Optional override for the commission amount before approval.")


class PayoutStatsResponse(BaseSchema):
    pending_commission: Decimal
    approved_commission: Decimal
    paid_commission: Decimal
