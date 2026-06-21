from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.account import Account
from app.schemas.common import PaginatedResponse
from app.schemas.crm.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.crm.utils import build_paginated_response, ensure_account, paginate


class AccountService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        return self.db.query(Account).filter(Account.company_id == self.company_id)

    def create(self, data: AccountCreate, created_by: UUID) -> AccountResponse:
        account = Account(
            company_id=self.company_id,
            created_by=created_by,
            **data.model_dump(),
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return AccountResponse.model_validate(account)

    def get(self, account_id: UUID) -> AccountResponse:
        account = self._base_query().filter(Account.id == account_id).first()
        if not account:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
        return AccountResponse.model_validate(account)

    def list_accounts(self, page: int = 1, page_size: int = 20) -> PaginatedResponse[AccountResponse]:
        query = self._base_query().order_by(Account.name.asc())
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [AccountResponse.model_validate(i) for i in items], total, page, page_size
        )

    def search(
        self, q: str, page: int = 1, page_size: int = 20
    ) -> PaginatedResponse[AccountResponse]:
        term = f"%{q.strip()}%"
        query = (
            self._base_query()
            .filter(
                or_(
                    Account.name.ilike(term),
                    Account.email.ilike(term),
                    Account.industry.ilike(term),
                    Account.website.ilike(term),
                )
            )
            .order_by(Account.name.asc())
        )
        items, total = paginate(query, page, page_size)
        return build_paginated_response(
            [AccountResponse.model_validate(i) for i in items], total, page, page_size
        )

    def update(self, account_id: UUID, data: AccountUpdate) -> AccountResponse:
        account = ensure_account(self.db, self.company_id, account_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(account, field, value)
        self.db.commit()
        self.db.refresh(account)
        return AccountResponse.model_validate(account)

    def delete(self, account_id: UUID) -> None:
        account = ensure_account(self.db, self.company_id, account_id)
        self.db.delete(account)
        self.db.commit()
