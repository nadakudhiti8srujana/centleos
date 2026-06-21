import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_id, RoleChecker
from app.core.enums import UserRole
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.crm.utils import build_paginated_response, paginate

router = APIRouter(prefix="/users", tags=["Users & Team"])

@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """List all users in the current workspace."""
    query = db.query(User).filter(User.company_id == company_id).order_by(User.created_at.desc())
    items, total = paginate(query, params.page, params.page_size)
    return build_paginated_response(
        [UserResponse.model_validate(i) for i in items], total, params.page, params.page_size
    )

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """Create a new user in the workspace."""
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        company_id=company_id,
        is_active=True,
        is_verified=True,  # created by admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """Get user details."""
    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """Update user details and role."""
    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.role is not None:
        if user.id == current_user.id and data.role != current_user.role:
            raise HTTPException(status_code=403, detail="Cannot change your own role")
        user.role = data.role
    if data.is_active is not None:
        if user.id == current_user.id and not data.is_active:
            raise HTTPException(status_code=403, detail="Cannot deactivate yourself")
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: uuid.UUID,
    password_data: dict, # expecting {"password": "new_password"}
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """Manually reset a user's password (Admin only)."""
    new_password = password_data.get("password")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/{user_id}/activity")
def get_user_activity(
    user_id: uuid.UUID,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
) -> Any:
    """View user's audit log activity."""
    from app.models.audit_log import AuditLog
    from app.schemas.audit_log import AuditLogResponse

    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(AuditLog).filter(
        AuditLog.company_id == company_id,
        AuditLog.user_id == user_id
    ).order_by(AuditLog.created_at.desc())
    
    items, total = paginate(query, params.page, params.page_size)
    return build_paginated_response(
        [AuditLogResponse.model_validate(i) for i in items], total, params.page, params.page_size
    )
