from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_company_admin, require_super_admin
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_company_audit_logs(
    page: int = 1,
    page_size: int = 50,
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_company_admin),
):
    return AuditService(db).list_logs(
        company_id=company_id,
        page=page,
        page_size=page_size,
        user_id=user_id,
        action=action,
        entity_type=entity_type
    )

# Super admin route
@router.get("/global", response_model=PaginatedResponse[AuditLogResponse])
def list_global_audit_logs(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    return AuditService(db).list_all_logs(page=page, page_size=page_size)
