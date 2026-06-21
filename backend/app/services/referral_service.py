import secrets
import string
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.enums import ReferralPayoutStatus
from app.models.referral import Referral, ReferralClick, ReferralLink
from app.schemas.referral import ReferralLinkCreate

settings = get_settings()


class ReferralService:
    def __init__(self, db: Session):
        self.db = db

    def generate_unique_code(self, length: int = 8) -> str:
        characters = string.ascii_letters + string.digits
        while True:
            code = "".join(secrets.choice(characters) for _ in range(length))
            if not self.db.query(ReferralLink).filter(ReferralLink.code == code).first():
                return code

    def create_referral_link(
        self, user_id: UUID, company_id: UUID, data: ReferralLinkCreate
    ) -> ReferralLink:
        code = data.code
        if not code:
            code = self.generate_unique_code()
        else:
            if self.db.query(ReferralLink).filter(ReferralLink.code == code).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Referral code already exists.",
                )

        # Generate the frontend URL
        url = f"{settings.FRONTEND_URL}/register?ref={code}"

        db_link = ReferralLink(
            company_id=company_id,
            ambassador_id=user_id,
            code=code,
            url=url,
            commission_rate=data.commission_rate or Decimal("10.00"),
        )
        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=company_id,
            user_id=user_id,
            action="create",
            entity_type="ReferralLink",
            entity_id=db_link.id,
            details={"code": code}
        )
        
        return db_link

    def get_ambassador_links(self, company_id: UUID, ambassador_id: Optional[UUID] = None) -> List[ReferralLink]:
        query = self.db.query(ReferralLink).filter(ReferralLink.company_id == company_id)
        if ambassador_id:
            query = query.filter(ReferralLink.ambassador_id == ambassador_id)
        return query.all()

    def delete_referral_link(self, company_id: UUID, link_id: UUID) -> None:
        link = self.db.query(ReferralLink).filter(
            ReferralLink.id == link_id,
            ReferralLink.company_id == company_id
        ).first()
        if not link:
            raise HTTPException(status_code=404, detail="Referral link not found")
        self.db.delete(link)
        self.db.commit()

    def record_click(
        self,
        code: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer_url: Optional[str] = None,
    ) -> ReferralLink:
        link = self.db.query(ReferralLink).filter(ReferralLink.code == code).first()
        if not link:
            raise HTTPException(status_code=404, detail="Referral link not found")

        # Record the click
        click = ReferralClick(
            referral_link_id=link.id,
            company_id=link.company_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer_url=referrer_url,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(click)

        # Increment click count
        link.click_count += 1

        self.db.commit()
        self.db.refresh(link)
        return link

    def record_conversion(
        self,
        code: str,
        company_id: UUID,
        amount: Decimal,
        lead_id: Optional[UUID] = None,
        customer_id: Optional[UUID] = None,
        deal_id: Optional[UUID] = None,
    ) -> Optional[Referral]:
        link = self.db.query(ReferralLink).filter(
            ReferralLink.code == code, ReferralLink.company_id == company_id
        ).first()
        
        if not link:
            return None

        # Check if we already recorded a conversion for this deal to avoid duplicates
        if deal_id:
            existing = self.db.query(Referral).filter(Referral.deal_id == deal_id).first()
            if existing:
                return existing

        commission = (amount * link.commission_rate) / Decimal("100.0")

        referral = Referral(
            company_id=company_id,
            referral_link_id=link.id,
            ambassador_id=link.ambassador_id,
            lead_id=lead_id,
            customer_id=customer_id,
            deal_id=deal_id,
            commission_amount=commission,
            payout_status=ReferralPayoutStatus.PENDING,
            converted_at=datetime.now(timezone.utc),
        )
        self.db.add(referral)
        
        link.conversion_count += 1
        
        # Notification Trigger
        from app.services.notification_service import NotificationService
        from app.core.enums import NotificationTrigger, NotificationChannel
        NotificationService(self.db).create_notification(
            company_id=company_id,
            user_id=link.ambassador_id,
            trigger_type=NotificationTrigger.REFERRAL_CONVERSION,
            title="Referral Converted!",
            message=f"A referral link of yours resulted in a conversion. Commission: ${commission:.2f}",
            channel=NotificationChannel.IN_APP
        )
        
        # Email Trigger
        from app.services.email_service import EmailService
        from app.models.user import User
        ambassador = self.db.query(User).filter(User.id == link.ambassador_id).first()
        if ambassador and ambassador.email:
            EmailService(self.db).trigger_email_event(
                company_id=company_id,
                trigger_event="referral_converted",
                to_email=ambassador.email,
                variables={"commission": str(commission), "ambassador_name": ambassador.full_name}
            )
            
        # Telegram Trigger
        from app.services.telegram_service import TelegramService
        TelegramService().trigger_referral_converted(
            ambassador_name=ambassador.full_name if ambassador else "Unknown",
            commission=str(commission)
        )
            
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=company_id,
            user_id=link.ambassador_id,
            action="convert",
            entity_type="Referral",
            entity_id=referral.id,
            details={"commission": str(commission)}
        )
        
        self.db.commit()
        self.db.refresh(referral)
        return referral

    def get_referrals(self, company_id: UUID, ambassador_id: Optional[UUID] = None) -> List[Referral]:
        query = self.db.query(Referral).filter(Referral.company_id == company_id)
        if ambassador_id:
            query = query.filter(Referral.ambassador_id == ambassador_id)
        return query.order_by(Referral.created_at.desc()).all()

    def approve_payout(
        self, referral_id: UUID, approver_id: UUID, company_id: UUID, amount: Optional[Decimal] = None
    ) -> Referral:
        referral = (
            self.db.query(Referral)
            .filter(Referral.id == referral_id, Referral.company_id == company_id)
            .first()
        )
        if not referral:
            raise HTTPException(status_code=404, detail="Referral not found")

        if referral.payout_status != ReferralPayoutStatus.PENDING:
            raise HTTPException(
                status_code=400, detail="Only pending referrals can be approved"
            )

        if amount is not None:
            referral.commission_amount = amount

        referral.payout_status = ReferralPayoutStatus.APPROVED
        referral.approved_by = approver_id
        referral.approved_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(referral)
        
        from app.models.user import User
        ambassador = self.db.query(User).filter(User.id == referral.ambassador_id).first()
        
        # Notification Trigger
        from app.services.notification_service import NotificationService
        from app.core.enums import NotificationTrigger, NotificationChannel
        NotificationService(self.db).create_notification(
            company_id=company_id,
            user_id=referral.ambassador_id,
            trigger_type=NotificationTrigger.PAYOUT_APPROVED,
            title="Payout Approved",
            message=f"Your referral payout of ${referral.commission_amount:.2f} has been approved.",
            channel=NotificationChannel.IN_APP
        )
        
        # Email Trigger
        from app.services.email_service import EmailService
        if ambassador and ambassador.email:
            EmailService(self.db).trigger_email_event(
                company_id=company_id,
                trigger_event="payout_approved",
                to_email=ambassador.email,
                variables={"amount": str(referral.commission_amount), "ambassador_name": ambassador.full_name}
            )
        
        # Telegram Trigger (Optional External)
        from app.services.telegram_service import TelegramService
        from app.models.user import User
        ambassador = self.db.query(User).filter(User.id == referral.ambassador_id).first()
        TelegramService().trigger_payout_approved(
            ambassador_name=ambassador.full_name if ambassador else "Unknown",
            amount=str(referral.commission_amount)
        )
        
        return referral

    def reject_payout(
        self, referral_id: UUID, approver_id: UUID, company_id: UUID
    ) -> Referral:
        referral = (
            self.db.query(Referral)
            .filter(Referral.id == referral_id, Referral.company_id == company_id)
            .first()
        )
        if not referral:
            raise HTTPException(status_code=404, detail="Referral not found")

        if referral.payout_status != ReferralPayoutStatus.PENDING:
            raise HTTPException(
                status_code=400, detail="Only pending referrals can be rejected"
            )

        referral.payout_status = ReferralPayoutStatus.REJECTED
        referral.approved_by = approver_id
        referral.approved_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(referral)
        return referral

    def mark_payout_paid(self, referral_id: UUID, company_id: UUID) -> Referral:
        referral = (
            self.db.query(Referral)
            .filter(Referral.id == referral_id, Referral.company_id == company_id)
            .first()
        )
        if not referral:
            raise HTTPException(status_code=404, detail="Referral not found")

        if referral.payout_status != ReferralPayoutStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Only approved referrals can be paid")

        referral.payout_status = ReferralPayoutStatus.PAID
        referral.paid_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(referral)
        return referral

    def get_payout_stats(self, company_id: UUID, ambassador_id: Optional[UUID] = None) -> dict:
        query = self.db.query(Referral).filter(Referral.company_id == company_id)
        if ambassador_id:
            query = query.filter(Referral.ambassador_id == ambassador_id)

        referrals = query.all()
        pending = sum(
            r.commission_amount
            for r in referrals
            if r.payout_status == ReferralPayoutStatus.PENDING
        )
        approved = sum(
            r.commission_amount
            for r in referrals
            if r.payout_status == ReferralPayoutStatus.APPROVED
        )
        paid = sum(
            r.commission_amount
            for r in referrals
            if r.payout_status == ReferralPayoutStatus.PAID
        )

        return {
            "pending_commission": pending,
            "approved_commission": approved,
            "paid_commission": paid,
        }
