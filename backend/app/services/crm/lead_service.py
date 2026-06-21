from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.enums import PIPELINE_STAGES, LeadStage
from app.models.lead import Lead, LeadHistory
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.crm.lead import (
    LeadCreate,
    LeadFilterParams,
    LeadHistoryResponse,
    LeadResponse,
    LeadStageUpdate,
    LeadUpdate,
    PipelineResponse,
    PipelineStageColumn,
)
from app.services.crm.utils import (
    build_paginated_response,
    ensure_account,
    ensure_contact,
    ensure_lead,
    ensure_workspace_user,
    paginate,
)


class LeadService:
    TRACKED_FIELDS = ("name", "email", "phone", "source", "stage", "owner_id", "account_id")

    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        return (
            self.db.query(Lead)
            .filter(Lead.company_id == self.company_id)
            .options(joinedload(Lead.owner))
        )

    def _to_response(self, lead: Lead) -> LeadResponse:
        return LeadResponse.model_validate(lead)

    def _record_history(
        self,
        lead: Lead,
        field: str,
        old_value: Any,
        new_value: Any,
        changed_by: Optional[UUID],
    ) -> None:
        if old_value == new_value:
            return
        entry = LeadHistory(
            lead_id=lead.id,
            company_id=self.company_id,
            field_changed=field,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            changed_by=changed_by,
        )
        self.db.add(entry)

    def _validate_refs(
        self,
        owner_id: Optional[UUID] = None,
        account_id: Optional[UUID] = None,
        contact_id: Optional[UUID] = None,
    ) -> None:
        if owner_id:
            ensure_workspace_user(self.db, self.company_id, owner_id)
        if account_id:
            ensure_account(self.db, self.company_id, account_id)
        if contact_id:
            ensure_contact(self.db, self.company_id, contact_id)

    def create(self, data: LeadCreate, created_by: UUID) -> LeadResponse:
        self._validate_refs(data.owner_id, data.account_id, data.contact_id)
        
        if data.email:
            existing_email = self.db.query(Lead).filter(
                Lead.company_id == self.company_id,
                Lead.email == data.email
            ).first()
            if existing_email:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="A lead with this email address already exists in your workspace.")
                
        if data.phone:
            existing_phone = self.db.query(Lead).filter(
                Lead.company_id == self.company_id,
                Lead.phone == data.phone
            ).first()
            if existing_phone:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="A lead with this phone number already exists in your workspace.")
        lead_data = data.model_dump()
        lead = Lead(
            company_id=self.company_id,
            created_by=created_by,
            **lead_data,
        )
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=self.company_id,
            user_id=created_by,
            action="create",
            entity_type="Lead",
            entity_id=lead.id,
            details={"name": lead.name, "email": lead.email}
        )
        
        if lead.owner_id:
            from app.services.notification_service import NotificationService
            from app.core.enums import NotificationTrigger, NotificationChannel
            NotificationService(self.db).create_notification(
                company_id=self.company_id,
                user_id=lead.owner_id,
                trigger_type=NotificationTrigger.LEAD_ASSIGNED,
                title="New Lead Assigned",
                message=f"Lead '{lead.name}' has been assigned to you.",
                channel=NotificationChannel.IN_APP
            )
            
            # Email Trigger
            from app.services.email_service import EmailService
            from app.models.user import User
            owner = self.db.query(User).filter(User.id == lead.owner_id).first()
            if owner and owner.email:
                EmailService(self.db).trigger_email_event(
                    company_id=self.company_id,
                    trigger_event="lead_assigned",
                    to_email=owner.email,
                    variables={"lead_name": lead.name, "owner_name": owner.full_name}
                )
                
            # Telegram Trigger
            from app.services.telegram_service import TelegramService
            TelegramService().trigger_lead_assigned(
                lead_name=lead.name,
                assigned_to=owner.full_name if owner else "Unknown"
            )
            
        lead = self._base_query().filter(Lead.id == lead.id).first()
        return self._to_response(lead)

    def get(self, lead_id: UUID) -> LeadResponse:
        lead = self._base_query().filter(Lead.id == lead_id).first()
        if not lead:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        return self._to_response(lead)

    def list_leads(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[LeadFilterParams] = None,
    ) -> PaginatedResponse[LeadResponse]:
        query = self._base_query().order_by(Lead.created_at.desc())
        query = self._apply_filters(query, filters)
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [self._to_response(i) for i in items], total, page, page_size
        )

    def search(
        self,
        q: str,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[LeadResponse]:
        term = f"%{q.strip()}%"
        query = (
            self._base_query()
            .filter(
                or_(
                    Lead.name.ilike(term),
                    Lead.email.ilike(term),
                    Lead.phone.ilike(term),
                    Lead.lead_company.ilike(term),
                )
            )
            .order_by(Lead.created_at.desc())
        )
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [self._to_response(i) for i in items], total, page, page_size
        )

    def filter_leads(
        self,
        filters: LeadFilterParams,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[LeadResponse]:
        return self.list_leads(page=page, page_size=page_size, filters=filters)

    def update(self, lead_id: UUID, data: LeadUpdate, changed_by: UUID) -> LeadResponse:
        lead = ensure_lead(self.db, self.company_id, lead_id)
        update_data = data.model_dump(exclude_unset=True)

        self._validate_refs(
            update_data.get("owner_id"),
            update_data.get("account_id"),
            update_data.get("contact_id"),
        )
        
        # Check duplicates on update
        if "email" in update_data and update_data["email"]:
            existing_email = self.db.query(Lead).filter(
                Lead.company_id == self.company_id,
                Lead.email == update_data["email"],
                Lead.id != lead_id
            ).first()
            if existing_email:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="A lead with this email address already exists in your workspace.")
                
        if "phone" in update_data and update_data["phone"]:
            existing_phone = self.db.query(Lead).filter(
                Lead.company_id == self.company_id,
                Lead.phone == update_data["phone"],
                Lead.id != lead_id
            ).first()
            if existing_phone:
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="A lead with this phone number already exists in your workspace.")

        for field, new_value in update_data.items():
            old_value = getattr(lead, field)
            if field in self.TRACKED_FIELDS:
                self._record_history(lead, field, old_value, new_value, changed_by)
            setattr(lead, field, new_value)
            
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=self.company_id,
            user_id=changed_by,
            action="update",
            entity_type="Lead",
            entity_id=lead.id,
            details={"fields_changed": list(update_data.keys())}
        )
            
        if "owner_id" in update_data and update_data["owner_id"]:
            from app.services.notification_service import NotificationService
            from app.core.enums import NotificationTrigger, NotificationChannel
            NotificationService(self.db).create_notification(
                company_id=self.company_id,
                user_id=update_data["owner_id"],
                trigger_type=NotificationTrigger.LEAD_ASSIGNED,
                title="Lead Reassigned",
                message=f"Lead '{lead.name}' has been assigned to you.",
                channel=NotificationChannel.IN_APP
            )
            
            # Email Trigger
            from app.services.email_service import EmailService
            from app.models.user import User
            owner = self.db.query(User).filter(User.id == update_data["owner_id"]).first()
            if owner and owner.email:
                EmailService(self.db).trigger_email_event(
                    company_id=self.company_id,
                    trigger_event="lead_assigned",
                    to_email=owner.email,
                    variables={"lead_name": lead.name, "owner_name": owner.full_name}
                )
                
            # Telegram Trigger
            from app.services.telegram_service import TelegramService
            TelegramService().trigger_lead_assigned(
                lead_name=lead.name,
                assigned_to=owner.full_name if owner else "Unknown"
            )

        self.db.commit()
        lead = self._base_query().filter(Lead.id == lead_id).first()
        return self._to_response(lead)

    def update_stage(
        self, lead_id: UUID, data: LeadStageUpdate, changed_by: UUID
    ) -> LeadResponse:
        lead = ensure_lead(self.db, self.company_id, lead_id)
        if data.stage is not None:
            self._record_history(lead, "stage", lead.stage, data.stage, changed_by)
            lead.stage = data.stage
        if data.custom_stage_id is not None or "custom_stage_id" in data.model_dump(exclude_unset=True):
            lead.custom_stage_id = data.custom_stage_id
        self.db.commit()
        lead = self._base_query().filter(Lead.id == lead_id).first()
        return self._to_response(lead)

    def delete(self, lead_id: UUID, deleted_by: Optional[UUID] = None) -> None:
        lead = ensure_lead(self.db, self.company_id, lead_id)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=self.company_id,
            user_id=deleted_by,
            action="delete",
            entity_type="Lead",
            entity_id=lead.id,
            details={"name": lead.name}
        )
        
        self.db.delete(lead)
        self.db.commit()

    def get_history(self, lead_id: UUID) -> list[LeadHistoryResponse]:
        ensure_lead(self.db, self.company_id, lead_id)
        history = (
            self.db.query(LeadHistory)
            .filter(LeadHistory.lead_id == lead_id)
            .order_by(LeadHistory.created_at.desc())
            .all()
        )
        return [LeadHistoryResponse.model_validate(h) for h in history]

    def get_pipeline(self) -> PipelineResponse:
        stages: list[PipelineStageColumn] = []
        total = 0
        
        from app.models.pipeline_stage import PipelineStage
        custom_stages = (
            self.db.query(PipelineStage)
            .filter(PipelineStage.company_id == self.company_id)
            .order_by(PipelineStage.order.asc())
            .all()
        )
        
        if custom_stages:
            for c_stage in custom_stages:
                leads = (
                    self._base_query()
                    .filter(Lead.custom_stage_id == c_stage.id)
                    .order_by(Lead.updated_at.desc())
                    .all()
                )
                total += len(leads)
                stages.append(
                    PipelineStageColumn(
                        stage=c_stage.name,
                        stage_id=c_stage.id,
                        color=c_stage.color,
                        count=len(leads),
                        leads=[self._to_response(l) for l in leads],
                    )
                )
            
            # also gather leads that don't have a custom stage yet
            unassigned = (
                self._base_query()
                .filter(Lead.custom_stage_id == None)
                .order_by(Lead.updated_at.desc())
                .all()
            )
            if unassigned:
                total += len(unassigned)
                stages.insert(0, PipelineStageColumn(
                    stage="Unassigned",
                    stage_id=None,
                    color="#94a3b8",
                    count=len(unassigned),
                    leads=[self._to_response(l) for l in unassigned],
                ))
        else:
            for stage in PIPELINE_STAGES:
                leads = (
                    self._base_query()
                    .filter(Lead.stage == stage)
                    .order_by(Lead.updated_at.desc())
                    .all()
                )
                total += len(leads)
                stages.append(
                    PipelineStageColumn(
                        stage=stage.value if hasattr(stage, "value") else str(stage),
                        stage_id=None,
                        color=None,
                        count=len(leads),
                        leads=[self._to_response(l) for l in leads],
                    )
                )
        return PipelineResponse(stages=stages, total_leads=total)

    def _apply_filters(self, query, filters: Optional[LeadFilterParams]):
        if not filters:
            return query
        if filters.stage:
            query = query.filter(Lead.stage == filters.stage)
        if filters.source:
            query = query.filter(Lead.source == filters.source)
        if filters.owner_id:
            query = query.filter(Lead.owner_id == filters.owner_id)
        if filters.account_id:
            query = query.filter(Lead.account_id == filters.account_id)
        if filters.created_from:
            query = query.filter(Lead.created_at >= filters.created_from)
        if filters.created_to:
            query = query.filter(Lead.created_at <= filters.created_to)
        return query
