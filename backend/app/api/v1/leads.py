from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.core.enums import LeadSource, LeadStage
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.crm.lead import (
    LeadCreate,
    LeadFilterParams,
    LeadHistoryResponse,
    LeadResponse,
    LeadStageUpdate,
    LeadUpdate,
    PipelineResponse,
)
from app.services.crm.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["CRM - Leads"])


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).create(data, current_user.id)


@router.get("", response_model=PaginatedResponse[LeadResponse])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    stage: Optional[LeadStage] = None,
    source: Optional[LeadSource] = None,
    owner_id: Optional[UUID] = None,
    account_id: Optional[UUID] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    filters = LeadFilterParams(
        stage=stage,
        source=source,
        owner_id=owner_id,
        account_id=account_id,
        created_from=created_from,
        created_to=created_to,
    )
    return LeadService(db, company_id).list_leads(page, page_size, filters)


@router.get("/export", response_class=StreamingResponse)
def export_leads(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    leads = LeadService(db, company_id).list_leads(page=1, page_size=10000).items
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Source", "Stage", "Company", "Created At"])
    
    for lead in leads:
        writer.writerow([
            str(lead.id),
            lead.name,
            lead.email or "",
            lead.phone or "",
            lead.source.value if lead.source else "",
            lead.stage.value if lead.stage else "",
            lead.lead_company or "",
            lead.created_at.isoformat()
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"}
    )

@router.get("/search", response_model=PaginatedResponse[LeadResponse])
def search_leads(
    q: str = Query(..., min_length=1, description="Search name, email, phone, company"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).search(q, page, page_size)


@router.get("/filter", response_model=PaginatedResponse[LeadResponse])
def filter_leads(
    stage: Optional[LeadStage] = None,
    source: Optional[LeadSource] = None,
    owner_id: Optional[UUID] = None,
    account_id: Optional[UUID] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    filters = LeadFilterParams(
        stage=stage,
        source=source,
        owner_id=owner_id,
        account_id=account_id,
        created_from=created_from,
        created_to=created_to,
    )
    return LeadService(db, company_id).filter_leads(filters, page, page_size)


@router.get("/pipeline", response_model=PipelineResponse)
def get_pipeline(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    """Kanban pipeline grouped by stage."""
    return LeadService(db, company_id).get_pipeline()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: UUID,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).update(lead_id, data, current_user.id)


@router.patch("/{lead_id}/stage", response_model=LeadResponse)
def update_lead_stage(
    lead_id: UUID,
    data: LeadStageUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).update_stage(lead_id, data, current_user.id)


@router.delete("/{lead_id}", response_model=MessageResponse)
def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    LeadService(db, company_id).delete(lead_id)
    return MessageResponse(message="Lead deleted successfully")


@router.get("/{lead_id}/history", response_model=list[LeadHistoryResponse])
def get_lead_history(
    lead_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return LeadService(db, company_id).get_history(lead_id)
