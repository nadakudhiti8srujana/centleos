from datetime import datetime, date
from collections import defaultdict
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access, get_current_user
from app.models.deal import Deal
from app.models.erp_invoice import ERPInvoice
from app.models.user import User
from app.services.ai_engine import AIEngineService
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/insights")
def get_ai_insights(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
) -> Dict[str, Any]:
    engine = AIEngineService(db, company_id)
    return engine.generate_insights()

@router.get("/forecast")
def get_revenue_forecast(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
) -> Dict[str, Any]:
    deals = db.query(Deal).filter(
        Deal.company_id == company_id,
        Deal.status == "open",
        Deal.expected_close_date != None
    ).all()
    
    invoices = db.query(ERPInvoice).filter(
        ERPInvoice.company_id == company_id,
        ERPInvoice.status != "draft"
    ).all()
    
    monthly_data = defaultdict(lambda: {"expected_revenue": 0.0, "secured_revenue": 0.0})
    
    for deal in deals:
        if deal.expected_close_date:
            month_key = deal.expected_close_date.strftime("%Y-%m")
            weighted_val = float(deal.deal_value) * (deal.probability / 100.0)
            monthly_data[month_key]["expected_revenue"] += weighted_val
            
    for inv in invoices:
        if inv.issue_date:
            month_key = inv.issue_date.strftime("%Y-%m")
            monthly_data[month_key]["secured_revenue"] += float(inv.total_amount)
            
    # Sort and format
    sorted_months = sorted(monthly_data.keys())
    result = []
    for month in sorted_months:
        result.append({
            "month": month,
            "expected_revenue": round(monthly_data[month]["expected_revenue"], 2),
            "secured_revenue": round(monthly_data[month]["secured_revenue"], 2)
        })
        
    return {"forecast": result}


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AnalyticsService(db, company_id).get_kpis()


@router.get("/leaderboard/sales")
def get_sales_leaderboard(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AnalyticsService(db, company_id).get_sales_leaderboard()


@router.get("/leaderboard/referrals")
def get_referral_leaderboard(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
):
    service = AnalyticsService(db, company_id)
    return service.get_referral_leaderboard()

@router.get("/suggestions")
def get_ai_suggestions(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
):
    service = AnalyticsService(db, company_id)
    return service.get_ai_suggestions(user_id=current_user.id)


@router.get("/activity-feed")
def get_activity_feed(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    # Proxy to AuditService
    # Fetch all logs for the company and let the frontend filter/display them as an activity feed
    return AuditService(db).list_logs(
        company_id=company_id,
        page=page,
        page_size=page_size
    )
