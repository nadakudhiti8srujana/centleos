from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.schemas.common import PaginatedResponse
from app.services.crm.utils import build_paginated_response, paginate


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        company_id: UUID,
        user_id: Optional[UUID],
        action: str,
        entity_type: str,
        entity_id: Optional[UUID] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        log = AuditLog(
            company_id=str(company_id) if company_id else None,
            user_id=str(user_id) if user_id else None,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details or {},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_logs(
        self,
        company_id: UUID,
        page: int = 1,
        page_size: int = 50,
        user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
    ):
        query = self.db.query(AuditLog).filter(AuditLog.company_id == str(company_id))

        if user_id:
            query = query.filter(AuditLog.user_id == str(user_id))
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)

        query = query.order_by(AuditLog.created_at.desc())
        
        items, total = paginate(query, page, page_size)
        
        from app.schemas.audit_log import AuditLogResponse
        return build_paginated_response(
            [AuditLogResponse.model_validate(i) for i in items], total, page, page_size
        )

    def list_all_logs(
        self,
        page: int = 1,
        page_size: int = 50,
    ):
        query = self.db.query(AuditLog).order_by(AuditLog.created_at.desc())
        items, total = paginate(query, page, page_size)
        
        from app.schemas.audit_log import AuditLogResponse
        return build_paginated_response(
            [AuditLogResponse.model_validate(i) for i in items], total, page, page_size
        )
