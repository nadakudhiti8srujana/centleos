import os
import sys
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.lead import Lead
from app.models.deal import Deal
from app.core.enums import LeadStage, DealStatus
from app.models.user import User

def seed_ai_suggestions():
    db: Session = SessionLocal()
    
    # Get the admin user
    user = db.query(User).filter(User.email == "admin@saasum.com").first()
    if not user:
        print("Admin user not found.")
        return

    company_id = user.company_id
    now = datetime.now(timezone.utc)
    
    # 1. Lead inactivity
    inactive_lead = Lead(
        name="Inactive Acme Corp",
        email="inactive@acme.com",
        stage=LeadStage.CONTACTED,
        owner_id=user.id,
        company_id=company_id,
    )
    db.add(inactive_lead)
    
    # 2. High-value deal
    high_value_deal = Deal(
        name="Enterprise License Expansion",
        deal_value=50000.0,
        status=DealStatus.OPEN,
        probability=60,
        expected_close_date=(now + timedelta(days=30)).date(),
        owner_id=user.id,
        company_id=company_id,
    )
    db.add(high_value_deal)
    
    # 3. Deal closing soon
    closing_deal = Deal(
        name="Q3 Renewal Fast-track",
        deal_value=5000.0,
        status=DealStatus.OPEN,
        probability=90,
        expected_close_date=(now + timedelta(days=2)).date(),
        owner_id=user.id,
        company_id=company_id,
    )
    db.add(closing_deal)
    
    db.commit()
    
    # Update created_at and updated_at for inactive lead
    inactive_lead.updated_at = now - timedelta(days=10)
    db.commit()
    
    print("Seed complete.")

if __name__ == "__main__":
    seed_ai_suggestions()
