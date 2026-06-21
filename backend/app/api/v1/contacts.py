from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.crm.contact import ContactCreate, ContactResponse, ContactUpdate
from app.services.crm.contact_service import ContactService

router = APIRouter(prefix="/contacts", tags=["CRM - Contacts"])


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return ContactService(db, company_id).create(data, current_user.id)


@router.get("", response_model=PaginatedResponse[ContactResponse])
def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    account_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ContactService(db, company_id).list_contacts(page, page_size, account_id)


@router.get("/export", response_class=StreamingResponse)
def export_contacts(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    contacts = ContactService(db, company_id).list_contacts(page=1, page_size=10000).items
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Title", "Created At"])
    
    for contact in contacts:
        writer.writerow([
            str(contact.id),
            contact.full_name,
            contact.email or "",
            contact.phone or "",
            contact.job_title or "",
            contact.created_at.isoformat()
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"}
    )

@router.get("/search", response_model=PaginatedResponse[ContactResponse])
def search_contacts(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ContactService(db, company_id).search(q, page, page_size)


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ContactService(db, company_id).get(contact_id)


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: UUID,
    data: ContactUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ContactService(db, company_id).update(contact_id, data)


@router.delete("/{contact_id}", response_model=MessageResponse)
def delete_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    ContactService(db, company_id).delete(contact_id)
    return MessageResponse(message="Contact deleted successfully")
