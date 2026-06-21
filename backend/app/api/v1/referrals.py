from typing import List
from uuid import UUID
import io
import csv

from fastapi import APIRouter, Depends, Request, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_active_user,
    get_workspace_id,
    require_company_admin,
    require_crm_access,
)
from app.models.user import User
from app.schemas.referral import (
    PayoutApproveRequest,
    PayoutStatsResponse,
    ReferralLinkCreate,
    ReferralLinkResponse,
    ReferralResponse,
)
from app.schemas.common import MessageResponse
from app.services.referral_service import ReferralService

router = APIRouter(prefix="/referrals", tags=["Referrals & Revenue Share"])


@router.post("/links", response_model=ReferralLinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(
    data: ReferralLinkCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_active_user),
):
    return ReferralService(db).create_referral_link(current_user.id, company_id, data)


@router.get("/links", response_model=List[ReferralLinkResponse])
def get_ambassador_links(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_active_user),
):
    ambassador_id = (
        None if current_user.role in ["super_admin", "company_admin"] else current_user.id
    )
    return ReferralService(db).get_ambassador_links(company_id, ambassador_id)


@router.delete("/links/{link_id}", response_model=MessageResponse)
def delete_link(
    link_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_company_admin),
):
    ReferralService(db).delete_referral_link(company_id, link_id)
    return MessageResponse(message="Referral link deleted successfully")


@router.get("/click/{code}")
def record_click(
    code: str,
    request: Request,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")

    link = ReferralService(db).record_click(
        code=code,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer_url=referrer,
    )

    return {"redirect_url": link.url}


@router.get("/export", response_class=StreamingResponse)
def export_referrals(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    referrals = ReferralService(db).get_referrals(company_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Ambassador ID", "Commission Amount", "Status", "Converted At", "Created At"])
    
    for ref in referrals:
        writer.writerow([
            str(ref.id),
            str(ref.ambassador_id),
            str(ref.commission_amount),
            ref.payout_status.value,
            ref.converted_at.isoformat() if ref.converted_at else "",
            ref.created_at.isoformat()
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=referrals.csv"}
    )


@router.get("/payouts", response_model=List[ReferralResponse])
def list_referrals(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_active_user),
):
    ambassador_id = (
        None if current_user.role in ["super_admin", "company_admin"] else current_user.id
    )
    return ReferralService(db).get_referrals(company_id, ambassador_id)


@router.get("/payouts/stats", response_model=PayoutStatsResponse)
def get_payout_stats(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_active_user),
):
    ambassador_id = (
        None if current_user.role in ["super_admin", "company_admin"] else current_user.id
    )
    return ReferralService(db).get_payout_stats(company_id, ambassador_id)


@router.post("/payouts/{referral_id}/approve", response_model=ReferralResponse)
def approve_payout(
    referral_id: UUID,
    data: PayoutApproveRequest,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_company_admin),
):
    return ReferralService(db).approve_payout(
        referral_id=referral_id,
        approver_id=current_user.id,
        company_id=company_id,
        amount=data.amount,
    )

@router.post("/payouts/{referral_id}/reject", response_model=ReferralResponse)
def reject_payout(
    referral_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_company_admin),
):
    return ReferralService(db).reject_payout(
        referral_id=referral_id,
        approver_id=current_user.id,
        company_id=company_id,
    )


@router.post("/payouts/{referral_id}/pay", response_model=ReferralResponse)
def mark_payout_paid(
    referral_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_company_admin),
):
    return ReferralService(db).mark_payout_paid(referral_id, company_id)
