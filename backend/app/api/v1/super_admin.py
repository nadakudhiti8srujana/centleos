from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.enums import UserRole
from app.models.company import Company
from app.models.user import User
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.invoice import Invoice
from app.models.erp_invoice import ERPInvoice
from app.models.referral import Referral
from app.models.notification_log import NotificationLog

router = APIRouter()

def require_super_admin(current_user = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required")
    return current_user

@router.get("/overview")
def get_overview(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    total_companies = db.query(func.count(Company.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_leads = db.query(func.count(Lead.id)).scalar()
    total_deals = db.query(func.count(Deal.id)).scalar()
    
    # Revenue can be deals won or invoices paid
    # Simple example: sum of deal values for won deals
    total_revenue = db.query(func.sum(Deal.deal_value)).filter(Deal.status == "won").scalar() or 0
    
    total_referrals = db.query(func.count(Referral.id)).scalar()
    total_pending_payouts = db.query(func.count(Referral.id)).filter(Referral.payout_status == "pending").scalar()
    
    return {
        "total_companies": total_companies,
        "total_users": total_users,
        "total_leads": total_leads,
        "total_deals": total_deals,
        "total_revenue": float(total_revenue),
        "total_referrals": total_referrals,
        "total_pending_payouts": total_pending_payouts,
    }

@router.get("/companies")
def get_all_companies(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    # Assuming basic dict response to avoid creating a dozen schemas
    companies = db.query(Company).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug, "created_at": c.created_at} for c in companies]

@router.get("/users")
def get_all_users(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "company_id": u.company_id} for u in users]

@router.get("/leads")
def get_all_leads(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    leads = db.query(Lead).all()
    return [{"id": l.id, "name": l.name, "email": l.email, "company_id": l.company_id, "stage": l.stage} for l in leads]

@router.get("/deals")
def get_all_deals(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    deals = db.query(Deal).all()
    return [{"id": d.id, "name": d.name, "deal_value": d.deal_value, "status": d.status, "company_id": d.company_id} for d in deals]

@router.get("/invoices")
def get_all_invoices(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    invoices = db.query(ERPInvoice).all()
    return [{"id": i.id, "invoice_number": i.invoice_number, "total_amount": i.total_amount, "status": i.status, "company_id": i.company_id} for i in invoices]

@router.get("/referrals")
def get_all_referrals(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    referrals = db.query(Referral).all()
    return [{"id": r.id, "payout_status": r.payout_status, "commission_amount": r.commission_amount, "company_id": r.company_id} for r in referrals]

@router.get("/notifications")
def get_all_notifications(db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    logs = db.query(NotificationLog).order_by(NotificationLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id, 
            "user_id": l.user_id, 
            "type": l.type, 
            "channel": l.channel, 
            "message": l.message, 
            "status": l.status, 
            "sent_at": l.sent_at,
            "created_at": l.created_at
        } 
        for l in logs
    ]

from pydantic import BaseModel
class RoleUpdateSchema(BaseModel):
    role: UserRole

class StatusUpdateSchema(BaseModel):
    is_active: bool

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, data: RoleUpdateSchema, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    
    # Audit Log
    from app.services.audit_service import AuditService
    AuditService(db).log_action(
        company_id=user.company_id or user.id,
        user_id=None, # Super admin doing the change
        action="role_change",
        entity_type="User",
        entity_id=user.id,
        details={"new_role": data.role.value}
    )
    
    db.commit()
    return {"message": "Role updated"}

@router.put("/users/{user_id}/status")
def update_user_status(user_id: str, data: StatusUpdateSchema, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = data.is_active
    db.commit()
    return {"message": "Status updated"}

@router.delete("/users/{user_id}")
def delete_user_admin(user_id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(User).filter(User.id == user_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}

@router.delete("/companies/{company_id}")
def delete_company_admin(company_id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(Company).filter(Company.id == company_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}

@router.delete("/leads/{id}")
def delete_lead_admin(id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(Lead).filter(Lead.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}

@router.delete("/deals/{id}")
def delete_deal_admin(id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(Deal).filter(Deal.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}

@router.delete("/invoices/{id}")
def delete_invoice_admin(id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(ERPInvoice).filter(ERPInvoice.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}

@router.delete("/referrals/{id}")
def delete_referral_admin(id: str, db: Session = Depends(get_db), _ = Depends(require_super_admin)):
    obj = db.query(Referral).filter(Referral.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return {"message": "Deleted"}
