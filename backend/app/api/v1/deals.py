from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.core.enums import DealStatus
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.crm.deal import DealCreate, DealResponse, DealUpdate
from app.services.crm.deal_service import DealService

router = APIRouter(prefix="/deals", tags=["CRM - Deals"])


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    data: DealCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return DealService(db, company_id).create(data, current_user.id)


@router.get("/export", response_class=StreamingResponse)
def export_deals(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    deals = DealService(db, company_id).list_deals(page=1, page_size=10000).items
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Value", "Probability", "Status", "Expected Close", "Created At"])
    
    for deal in deals:
        writer.writerow([
            str(deal.id),
            deal.name,
            str(deal.deal_value),
            deal.probability,
            deal.status.value,
            deal.expected_close_date.isoformat() if deal.expected_close_date else "",
            deal.created_at.isoformat()
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=deals.csv"}
    )


@router.get("", response_model=PaginatedResponse[DealResponse])
def list_deals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[DealStatus] = None,
    owner_id: Optional[UUID] = None,
    lead_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return DealService(db, company_id).list_deals(page, page_size, status, owner_id, lead_id)


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return DealService(db, company_id).get(deal_id)


@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: UUID,
    data: DealUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return DealService(db, company_id).update(deal_id, data)


@router.delete("/{deal_id}", response_model=MessageResponse)
def delete_deal(
    deal_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    DealService(db, company_id).delete(deal_id)
    return MessageResponse(message="Deal deleted successfully")
