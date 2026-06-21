from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.enums import DealStatus
from app.models.deal import Deal
from app.schemas.common import PaginatedResponse
from app.schemas.crm.deal import DealCreate, DealResponse, DealUpdate
from app.services.crm.utils import (
    build_paginated_response,
    ensure_account,
    ensure_contact,
    ensure_deal,
    ensure_lead,
    ensure_workspace_user,
    paginate,
)


class DealService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        return (
            self.db.query(Deal)
            .filter(Deal.company_id == self.company_id)
            .options(joinedload(Deal.owner))
        )

    def _validate_refs(
        self,
        lead_id: Optional[UUID] = None,
        contact_id: Optional[UUID] = None,
        account_id: Optional[UUID] = None,
        owner_id: Optional[UUID] = None,
    ) -> None:
        if lead_id:
            ensure_lead(self.db, self.company_id, lead_id)
        if contact_id:
            ensure_contact(self.db, self.company_id, contact_id)
        if account_id:
            ensure_account(self.db, self.company_id, account_id)
        if owner_id:
            ensure_workspace_user(self.db, self.company_id, owner_id)

    def create(self, data: DealCreate, created_by: UUID) -> DealResponse:
        self._validate_refs(data.lead_id, data.contact_id, data.account_id, data.owner_id)
        deal = Deal(
            company_id=self.company_id,
            created_by=created_by,
            **data.model_dump(),
        )
        self.db.add(deal)
        self.db.commit()
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=self.company_id,
            user_id=created_by,
            action="create",
            entity_type="Deal",
            entity_id=deal.id,
            details={"name": deal.name, "value": str(deal.deal_value)}
        )
        
        deal = self._base_query().filter(Deal.id == deal.id).first()
        return DealResponse.model_validate(deal)

    def get(self, deal_id: UUID) -> DealResponse:
        deal = self._base_query().filter(Deal.id == deal_id).first()
        if not deal:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
        return DealResponse.model_validate(deal)

    def list_deals(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[DealStatus] = None,
        owner_id: Optional[UUID] = None,
        lead_id: Optional[UUID] = None,
    ) -> PaginatedResponse[DealResponse]:
        query = self._base_query().order_by(Deal.created_at.desc())
        if status:
            query = query.filter(Deal.status == status)
        if owner_id:
            query = query.filter(Deal.owner_id == owner_id)
        if lead_id:
            query = query.filter(Deal.lead_id == lead_id)
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [DealResponse.model_validate(i) for i in items], total, page, page_size
        )

    def update(self, deal_id: UUID, data: DealUpdate) -> DealResponse:
        deal = ensure_deal(self.db, self.company_id, deal_id)
        update_data = data.model_dump(exclude_unset=True)
        self._validate_refs(
            update_data.get("lead_id"),
            update_data.get("contact_id"),
            update_data.get("account_id"),
            update_data.get("owner_id"),
        )
        if update_data.get("status") in (DealStatus.WON, DealStatus.LOST):
            deal.closed_at = datetime.now(timezone.utc)
            if update_data.get("status") == DealStatus.WON and deal.lead_id:
                from app.models.lead import Lead
                lead = self.db.query(Lead).filter(Lead.id == deal.lead_id).first()
                if lead and lead.referral_code:
                    from app.services.referral_service import ReferralService
                    ReferralService(self.db).record_conversion(
                        code=lead.referral_code,
                        company_id=self.company_id,
                        amount=deal.deal_value or 0,
                        lead_id=lead.id,
                        customer_id=None,
                        deal_id=deal.id
                    )
                    
            # Notification Trigger
            if update_data.get("status") == DealStatus.WON and deal.owner_id:
                from app.services.notification_service import NotificationService
                from app.core.enums import NotificationTrigger, NotificationChannel
                NotificationService(self.db).create_notification(
                    company_id=self.company_id,
                    user_id=deal.owner_id,
                    trigger_type=NotificationTrigger.DEAL_WON,
                    title="Deal Won!",
                    message=f"Deal '{deal.name}' has been won.",
                    channel=NotificationChannel.IN_APP
                )
                
                # Email Trigger
                from app.services.email_service import EmailService
                from app.models.user import User
                owner = self.db.query(User).filter(User.id == deal.owner_id).first()
                if owner and owner.email:
                    EmailService(self.db).trigger_email_event(
                        company_id=self.company_id,
                        trigger_event="deal_won",
                        to_email=owner.email,
                        variables={"deal_name": deal.name, "deal_value": str(deal.deal_value)}
                    )
                    
                # Telegram Trigger
                from app.services.telegram_service import TelegramService
                TelegramService().trigger_deal_won(
                    deal_name=deal.name,
                    amount=str(deal.deal_value or 0),
                    owner_name=owner.full_name if owner else "Unknown"
                )
                    
        for field, value in update_data.items():
            setattr(deal, field, value)
            
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=self.company_id,
            user_id=deal.owner_id, # Or pass changed_by if it was an arg
            action="update" if update_data.get("status") != DealStatus.WON else "won",
            entity_type="Deal",
            entity_id=deal.id,
            details={"fields_changed": list(update_data.keys())}
        )
        
        self.db.commit()
        deal = self._base_query().filter(Deal.id == deal_id).first()
        return DealResponse.model_validate(deal)

    def delete(self, deal_id: UUID) -> None:
        deal = ensure_deal(self.db, self.company_id, deal_id)
        self.db.delete(deal)
        self.db.commit()
