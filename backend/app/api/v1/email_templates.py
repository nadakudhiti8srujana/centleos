from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_company_admin, require_crm_access
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailTemplateUpdate,
    PreviewRequest,
)
from app.services.email_service import EmailService

router = APIRouter(prefix="/email-templates", tags=["Email Templates"])


@router.get("", response_model=List[EmailTemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    return EmailService(db).list_templates(company_id)


@router.post("", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    return EmailService(db).create_template(company_id, data)


@router.get("/{template_id}", response_model=EmailTemplateResponse)
def get_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    return EmailService(db).get_template(company_id, template_id)


@router.put("/{template_id}", response_model=EmailTemplateResponse)
def update_template(
    template_id: UUID,
    data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    return EmailService(db).update_template(company_id, template_id, data)


@router.delete("/{template_id}", response_model=MessageResponse)
def delete_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    EmailService(db).delete_template(company_id, template_id)
    return MessageResponse(message="Template deleted")


@router.post("/preview")
def preview_template(
    data: PreviewRequest,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    svc = EmailService(db)
    if data.template_id:
        template = svc.get_template(company_id, UUID(data.template_id))
    else:
        from app.models.email_template import EmailTemplate
        template = EmailTemplate(
            subject=data.subject or "",
            body_html=data.body_html or "",
            body_text="",
        )
    
    subject, body_html, _ = svc.render_template(template, data.variables)
    return {"subject": subject, "body_html": body_html}
