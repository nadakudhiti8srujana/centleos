import math
from typing import Optional, TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Query, Session

from app.models.account import Account
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.user import User
from app.schemas.common import PaginatedResponse

T = TypeVar("T")


def paginate(query: Query, page: int, page_size: int) -> tuple[list, int]:
    page = max(1, page)
    page_size = min(max(1, page_size), 100)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def build_paginated_response(
    items: list[T], total: int, page: int, page_size: int
) -> PaginatedResponse[T]:
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


def ensure_workspace_user(db: Session, company_id: UUID, user_id: UUID) -> User:
    user = (
        db.query(User)
        .filter(User.id == user_id, User.company_id == company_id, User.is_active.is_(True))
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found in this workspace",
        )
    return user


def ensure_account(db: Session, company_id: UUID, account_id: UUID) -> Account:
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.company_id == company_id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


def ensure_contact(db: Session, company_id: UUID, contact_id: UUID) -> Contact:
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.company_id == company_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


def ensure_lead(db: Session, company_id: UUID, lead_id: UUID) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.company_id == company_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead


def ensure_deal(db: Session, company_id: UUID, deal_id: UUID) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.company_id == company_id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return deal
