from typing import Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.contact import Contact
from app.schemas.common import PaginatedResponse
from app.schemas.crm.contact import ContactCreate, ContactResponse, ContactUpdate
from app.services.crm.utils import (
    build_paginated_response,
    ensure_account,
    ensure_contact,
    paginate,
)


class ContactService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        return self.db.query(Contact).filter(Contact.company_id == self.company_id)

    def _to_response(self, contact: Contact) -> ContactResponse:
        data = ContactResponse.model_validate(contact)
        return data.model_copy(update={"full_name": contact.full_name})

    def create(self, data: ContactCreate, created_by: UUID) -> ContactResponse:
        if data.account_id:
            ensure_account(self.db, self.company_id, data.account_id)
        contact = Contact(
            company_id=self.company_id,
            created_by=created_by,
            **data.model_dump(),
        )
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return self._to_response(contact)

    def get(self, contact_id: UUID) -> ContactResponse:
        contact = self._base_query().filter(Contact.id == contact_id).first()
        if not contact:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
        return self._to_response(contact)

    def list_contacts(
        self, page: int = 1, page_size: int = 20, account_id: Optional[UUID] = None
    ) -> PaginatedResponse[ContactResponse]:
        query = self._base_query().order_by(Contact.created_at.desc())
        if account_id:
            query = query.filter(Contact.account_id == account_id)
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [self._to_response(i) for i in items], total, page, page_size
        )

    def search(
        self, q: str, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse[ContactResponse]:
        term = f"%{q.strip()}%"
        query = (
            self._base_query()
            .filter(
                or_(
                    Contact.first_name.ilike(term),
                    Contact.last_name.ilike(term),
                    Contact.email.ilike(term),
                    Contact.phone.ilike(term),
                    Contact.contact_company.ilike(term),
                )
            )
            .order_by(Contact.created_at.desc())
        )
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [self._to_response(i) for i in items], total, page, page_size
        )

    def update(self, contact_id: UUID, data: ContactUpdate) -> ContactResponse:
        contact = ensure_contact(self.db, self.company_id, contact_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("account_id"):
            ensure_account(self.db, self.company_id, update_data["account_id"])
        for field, value in update_data.items():
            setattr(contact, field, value)
        self.db.commit()
        self.db.refresh(contact)
        return self._to_response(contact)

    def delete(self, contact_id: UUID) -> None:
        contact = ensure_contact(self.db, self.company_id, contact_id)
        self.db.delete(contact)
        self.db.commit()
