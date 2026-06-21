import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_workspace_id
from app.models.lead import Lead
from app.models.contact import Contact
from app.models.deal import Deal

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("")
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
) -> dict:
    """Unified search across Leads, Contacts, and Deals."""
    search_term = f"%{q.lower()}%"
    
    # Search Leads
    leads = db.query(Lead).filter(
        Lead.company_id == company_id,
        or_(
            Lead.name.ilike(search_term),
            Lead.email.ilike(search_term),
            Lead.lead_company.ilike(search_term)
        )
    ).limit(5).all()

    # Search Contacts
    contacts = db.query(Contact).filter(
        Contact.company_id == company_id,
        or_(
            Contact.first_name.ilike(search_term),
            Contact.last_name.ilike(search_term),
            Contact.email.ilike(search_term),
            Contact.contact_company.ilike(search_term)
        )
    ).limit(5).all()

    # Search Deals
    deals = db.query(Deal).filter(
        Deal.company_id == company_id,
        Deal.name.ilike(search_term)
    ).limit(5).all()

    return {
        "leads": [
            {
                "id": l.id,
                "title": l.name,
                "subtitle": l.lead_company or l.email or "",
                "type": "lead"
            } for l in leads
        ],
        "contacts": [
            {
                "id": c.id,
                "title": c.full_name,
                "subtitle": c.email or c.contact_company or "",
                "type": "contact"
            } for c in contacts
        ],
        "deals": [
            {
                "id": d.id,
                "title": d.name,
                "subtitle": f"${d.amount}",
                "type": "deal"
            } for d in deals
        ]
    }
