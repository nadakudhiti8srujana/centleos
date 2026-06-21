from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.crm.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.crm.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["CRM - Company Accounts"])


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    return AccountService(db, company_id).create(data, current_user.id)


@router.get("", response_model=PaginatedResponse[AccountResponse])
def list_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AccountService(db, company_id).list_accounts(page, page_size)


@router.get("/search", response_model=PaginatedResponse[AccountResponse])
def search_accounts(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AccountService(db, company_id).search(q, page, page_size)


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AccountService(db, company_id).get(account_id)


@router.patch("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: UUID,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return AccountService(db, company_id).update(account_id, data)


@router.delete("/{account_id}", response_model=MessageResponse)
def delete_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    AccountService(db, company_id).delete(account_id)
    return MessageResponse(message="Account deleted successfully")
