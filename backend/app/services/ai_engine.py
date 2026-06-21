from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.deal import Deal
from app.models.lead import Lead


class AIEngineService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def score_lead(self, lead: Lead) -> None:
        score = 0
        if lead.email: score += 20
        if lead.phone: score += 20
        if lead.lead_company: score += 10
        if lead.notes: score += 10
        
        days_old = (datetime.now(timezone.utc) - lead.created_at).days
        
        if lead.stage.value == "won":
            score += 40
            next_action = "Onboard customer."
        elif lead.stage.value == "lost":
            score = 0
            next_action = "Archived."
        else:
            if days_old > 14:
                score -= 10
                next_action = "Lead is getting cold. Send follow-up email."
            elif days_old > 7:
                next_action = "Schedule a discovery call."
            else:
                next_action = "Qualify and gather requirements."
                score += 10
                
        score = max(0, min(100, score))
        lead.ai_score = score
        lead.ai_next_action = next_action

    def score_deal(self, deal: Deal) -> dict:
        score = 0
        if deal.deal_value and deal.deal_value > Decimal("1000"):
            score += 30
        elif deal.deal_value and deal.deal_value > Decimal("0"):
            score += 10
            
        score += int((deal.probability or 0) * 0.5)
        
        if deal.status.value == "won":
            score = 100
            next_action = "Deal won!"
        elif deal.status.value == "lost":
            score = 0
            next_action = "Deal lost."
        else:
            if deal.expected_close_date:
                days_to_close = (deal.expected_close_date - datetime.now().date()).days
                if days_to_close < 0:
                    score -= 20
                    next_action = "Close date has passed. Update timeline or close deal."
                elif days_to_close <= 7:
                    score += 10
                    next_action = "Closing soon. Prepare final contracts."
                else:
                    next_action = "Nurture deal and handle objections."
            else:
                next_action = "Set an expected close date."
                
        score = max(0, min(100, score))
        return {"ai_score": score, "ai_next_action": next_action}

    def generate_insights(self) -> dict:
        leads = self.db.query(Lead).filter(Lead.company_id == self.company_id, Lead.stage != "won", Lead.stage != "lost").all()
        for lead in leads:
            self.score_lead(lead)
            
        deals = self.db.query(Deal).filter(Deal.company_id == self.company_id, Deal.status == "open").all()
        deal_insights = []
        for deal in deals:
            res = self.score_deal(deal)
            deal_insights.append({
                "id": str(deal.id),
                "name": deal.name,
                "ai_score": res["ai_score"],
                "ai_next_action": res["ai_next_action"]
            })
            
        self.db.commit()
        
        top_leads = sorted(leads, key=lambda x: x.ai_score or 0, reverse=True)[:5]
        top_deals = sorted(deal_insights, key=lambda x: x["ai_score"], reverse=True)[:5]
        
        return {
            "top_leads": [
                {
                    "id": str(l.id),
                    "name": l.name,
                    "ai_score": l.ai_score,
                    "ai_next_action": l.ai_next_action
                } for l in top_leads
            ],
            "top_deals": top_deals
        }
