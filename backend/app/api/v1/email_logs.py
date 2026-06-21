from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_company_admin
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.email_log import EmailLogResponse
from app.services.email_service import EmailService

router = APIRouter(prefix="/email-logs", tags=["Email Logs"])


@router.get("", response_model=PaginatedResponse[EmailLogResponse])
def list_email_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
) -> Any:
    """List email logs for the workspace (Admin only)."""
    return EmailService(db).list_logs(company_id, page, page_size)


@router.post("/{log_id}/retry", response_model=EmailLogResponse)
def retry_email_log(
    log_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
) -> Any:
    """Retry sending a failed email log."""
    return EmailService(db).retry_email(company_id, log_id)
