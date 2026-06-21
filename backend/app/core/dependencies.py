from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.enums import ADMIN_ROLES, SALES_ROLES, UserRole
from app.core.security import decode_access_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_roles(*allowed_roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


require_super_admin = require_roles(UserRole.SUPER_ADMIN)
require_company_admin = require_roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
require_sales_access = require_roles(*SALES_ROLES)
require_admin_access = require_roles(*ADMIN_ROLES)

class RoleChecker:
    def __init__(self, allowed_roles):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

def get_tenant_company_id(
    current_user: User,
    workspace_id: Optional[UUID] = None,
) -> Optional[UUID]:
    """Resolve company scope for multi-tenant data isolation."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return workspace_id

    if current_user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to any workspace",
        )

    if workspace_id and workspace_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this workspace",
        )

    return current_user.company_id


async def get_workspace_id(
    workspace_id: Optional[UUID] = Query(
        None, description="Workspace (company) ID — required for super admin"
    ),
    current_user: User = Depends(get_current_user),
) -> UUID:
    return await get_workspace_context(workspace_id, current_user)


async def get_workspace_context(
    workspace_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
) -> UUID:
    company_id = get_tenant_company_id(current_user, workspace_id)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace context required for super admin",
        )
    return company_id


require_crm_access = require_roles(*SALES_ROLES)
