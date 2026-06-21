from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy import func, case, extract, and_
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.core.enums import LeadStage
from app.models.deal import Deal, DealStatus
from app.models.erp_invoice import ERPInvoice
from app.core.enums import ERPInvoiceStatus
from app.models.user import User
from app.models.referral import Referral
from app.models.attachment import Attachment


class AnalyticsService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def get_kpis(self) -> Dict[str, Any]:
        # Lead Conversion Rate
        total_leads = self.db.query(func.count(Lead.id)).filter(Lead.company_id == self.company_id).scalar() or 0
        converted_leads = self.db.query(func.count(Lead.id)).filter(
            Lead.company_id == self.company_id,
            Lead.stage == LeadStage.WON
        ).scalar() or 0
        lead_conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0.0

        # Deal Win Rate
        closed_deals = self.db.query(func.count(Deal.id)).filter(
            Deal.company_id == self.company_id,
            Deal.status.in_([DealStatus.WON, DealStatus.LOST])
        ).scalar() or 0
        won_deals = self.db.query(func.count(Deal.id)).filter(
            Deal.company_id == self.company_id,
            Deal.status == DealStatus.WON
        ).scalar() or 0
        deal_win_rate = (won_deals / closed_deals * 100) if closed_deals > 0 else 0.0

        # Average Deal Value
        avg_deal_value = self.db.query(func.avg(Deal.deal_value)).filter(
            Deal.company_id == self.company_id,
            Deal.status == DealStatus.WON
        ).scalar() or 0.0

        # Active Deals Count
        active_deals = self.db.query(func.count(Deal.id)).filter(
            Deal.company_id == self.company_id,
            Deal.status == DealStatus.OPEN
        ).scalar() or 0

        # Revenue
        now = datetime.now(timezone.utc)
        current_year = now.year
        current_month = now.month
        current_quarter = (now.month - 1) // 3 + 1

        invoices = self.db.query(ERPInvoice).filter(
            ERPInvoice.company_id == self.company_id,
            ERPInvoice.status != ERPInvoiceStatus.DRAFT,
            ERPInvoice.issue_date != None
        ).all()

        revenue_month = 0.0
        revenue_quarter = 0.0
        revenue_year = 0.0

        for inv in invoices:
            if inv.issue_date:
                inv_year = inv.issue_date.year
                inv_month = inv.issue_date.month
                inv_quarter = (inv.issue_date.month - 1) // 3 + 1
                
                amount = float(inv.total_amount)
                if inv_year == current_year:
                    revenue_year += amount
                    if inv_quarter == current_quarter:
                        revenue_quarter += amount
                    if inv_month == current_month:
                        revenue_month += amount

        # Top Performing Sales Rep
        top_rep = self.db.query(
            User.full_name,
            func.sum(Deal.deal_value).label('total_revenue')
        ).join(Deal, Deal.owner_id == User.id).filter(
            Deal.company_id == self.company_id,
            Deal.status == DealStatus.WON
        ).group_by(User.id).order_by(func.sum(Deal.deal_value).desc()).first()

        top_rep_name = top_rep.full_name if top_rep else "N/A"

        # Attachment Counts
        lead_attachments = self.db.query(func.count(Attachment.id)).filter(
            Attachment.company_id == self.company_id, Attachment.entity_type == "lead"
        ).scalar() or 0
        
        deal_attachments = self.db.query(func.count(Attachment.id)).filter(
            Attachment.company_id == self.company_id, Attachment.entity_type == "deal"
        ).scalar() or 0
        
        invoice_attachments = self.db.query(func.count(Attachment.id)).filter(
            Attachment.company_id == self.company_id, Attachment.entity_type == "invoice"
        ).scalar() or 0

        # Forecast
        open_deals = self.db.query(Deal).filter(
            Deal.company_id == self.company_id,
            Deal.status == DealStatus.OPEN,
            Deal.expected_close_date != None
        ).all()

        next_month = current_month + 1 if current_month < 12 else 1
        next_month_year = current_year if current_month < 12 else current_year + 1
        next_quarter = current_quarter + 1 if current_quarter < 4 else 1
        next_quarter_year = current_year if current_quarter < 4 else current_year + 1

        forecast_next_month = 0.0
        forecast_next_quarter = 0.0
        total_forecast = 0.0
        total_unweighted = 0.0

        for deal in open_deals:
            close_year = deal.expected_close_date.year
            close_month = deal.expected_close_date.month
            close_quarter = (close_month - 1) // 3 + 1
            
            prob = deal.probability or 0
            val = float(deal.deal_value or 0)
            weighted_value = val * (prob / 100.0)
            
            if close_year == next_month_year and close_month == next_month:
                forecast_next_month += weighted_value
            if close_year == next_quarter_year and close_quarter == next_quarter:
                forecast_next_quarter += weighted_value
                
            total_forecast += weighted_value
            total_unweighted += val
            
        forecast_confidence_score = (total_forecast / total_unweighted * 100) if total_unweighted > 0 else 0.0

        return {
            "lead_conversion_rate": round(lead_conversion_rate, 2),
            "deal_win_rate": round(deal_win_rate, 2),
            "average_deal_value": round(float(avg_deal_value), 2),
            "revenue_this_month": round(revenue_month, 2),
            "revenue_this_quarter": round(revenue_quarter, 2),
            "revenue_this_year": round(revenue_year, 2),
            "active_deals_count": active_deals,
            "top_performing_sales_rep": top_rep_name,
            "lead_attachments_count": lead_attachments,
            "deal_attachments_count": deal_attachments,
            "invoice_attachments_count": invoice_attachments,
            "forecast_next_month": round(forecast_next_month, 2),
            "forecast_next_quarter": round(forecast_next_quarter, 2),
            "forecast_confidence_score": round(forecast_confidence_score, 2),
        }

    def get_sales_leaderboard(self) -> List[Dict[str, Any]]:
        # Top Sales Reps, Revenue Closed, Deals Closed, Win Rate
        reps = self.db.query(User).filter(
            User.company_id == self.company_id,
            User.is_active == True
        ).all()

        leaderboard = []
        for rep in reps:
            deals = self.db.query(Deal).filter(Deal.owner_id == rep.id).all()
            if not deals:
                continue

            won_deals = [d for d in deals if d.status == DealStatus.WON]
            closed_deals = [d for d in deals if d.status in (DealStatus.WON, DealStatus.LOST)]
            
            revenue_closed = sum(float(d.deal_value) for d in won_deals)
            win_rate = (len(won_deals) / len(closed_deals) * 100) if closed_deals else 0.0

            if len(deals) > 0:
                leaderboard.append({
                    "id": str(rep.id),
                    "name": rep.full_name,
                    "revenue_closed": round(revenue_closed, 2),
                    "deals_closed": len(won_deals),
                    "win_rate": round(win_rate, 2)
                })

        # Sort by revenue closed descending
        leaderboard.sort(key=lambda x: x["revenue_closed"], reverse=True)
        return leaderboard[:10]  # Top 10

    def get_referral_leaderboard(self) -> List[Dict[str, Any]]:
        # Top Referrers, Referral Count, Revenue Generated, Commission Earned
        reps = self.db.query(User).filter(User.company_id == self.company_id).all()
        
        leaderboard = []
        for rep in reps:
            referrals = self.db.query(Referral).filter(
                Referral.company_id == self.company_id,
                Referral.ambassador_id == rep.id
            ).all()

            if not referrals:
                continue

            total_referrals = len(referrals)
            converted = [r for r in referrals if r.converted_at is not None]
            
            revenue_generated = sum(float(r.deal.deal_value) for r in converted if r.deal and r.deal.deal_value)
            commission_earned = sum(float(r.commission_amount) for r in converted if r.commission_amount)

            if total_referrals > 0:
                leaderboard.append({
                    "id": str(rep.id),
                    "name": rep.full_name,
                    "referral_count": total_referrals,
                    "revenue_generated": round(revenue_generated, 2),
                    "commission_earned": round(commission_earned, 2)
                })

        # Sort by commission earned descending
        leaderboard.sort(key=lambda x: x["commission_earned"], reverse=True)
        return leaderboard[:10]

    def get_ai_suggestions(self, user_id: UUID) -> List[Dict[str, Any]]:
        suggestions = []
        now = datetime.now(timezone.utc)
        
        # 1. Lead inactivity alerts & Follow-up reminders
        seven_days_ago = now - timedelta(days=7)
        inactive_leads = self.db.query(Lead).filter(
            Lead.company_id == self.company_id,
            Lead.owner_id == user_id,
            Lead.updated_at < seven_days_ago,
            Lead.stage.notin_([LeadStage.WON, LeadStage.LOST, LeadStage.UNQUALIFIED])
        ).all()
        
        for lead in inactive_leads:
            suggestions.append({
                "type": "follow_up",
                "title": f"Follow up with {lead.name}",
                "description": f"No activity in over 7 days for lead '{lead.name}' ({lead.stage}). Reaching out might keep them warm.",
                "action_url": f"/leads/{lead.id}",
                "priority": "medium"
            })

        # 2. High-value lead/deal suggestions
        high_value_deals = self.db.query(Deal).filter(
            Deal.company_id == self.company_id,
            Deal.owner_id == user_id,
            Deal.status == DealStatus.OPEN,
            Deal.deal_value >= 10000
        ).all()
        
        for deal in high_value_deals:
            suggestions.append({
                "type": "high_value",
                "title": f"Focus on high-value deal: {deal.name}",
                "description": f"This deal is worth ${deal.deal_value}. Ensure active engagement to secure this high-value opportunity.",
                "action_url": f"/deals/{deal.id}",
                "priority": "high"
            })

        # 3. Deal closing recommendations
        next_7_days = now + timedelta(days=7)
        closing_deals = self.db.query(Deal).filter(
            Deal.company_id == self.company_id,
            Deal.owner_id == user_id,
            Deal.status == DealStatus.OPEN,
            Deal.expected_close_date <= next_7_days,
            Deal.expected_close_date >= now.date()
        ).all()
        
        for deal in closing_deals:
            suggestions.append({
                "type": "closing_soon",
                "title": f"Deal closing soon: {deal.name}",
                "description": f"Expected to close by {deal.expected_close_date}. Prepare final proposals and follow-up to seal the deal.",
                "action_url": f"/deals/{deal.id}",
                "priority": "high"
            })

        return suggestions
