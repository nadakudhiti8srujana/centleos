from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, RoleChecker
from app.core.enums import UserRole
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.saas import SaaSRegistrationRequest, JoinWorkspaceRequest, InviteUserRequest, UserRegistrationRequest
from app.schemas.common import MessageResponse
from app.services.saas_service import SaaSService

router = APIRouter(prefix="/saas", tags=["SaaS & Workspace"])

@router.post("/register-user", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegistrationRequest, db: Session = Depends(get_db)):
    """Register a new normal user within a workspace."""
    return SaaSService(db).register_user(data)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_saas(data: SaaSRegistrationRequest, db: Session = Depends(get_db)):
    """Register a new company and admin user (SaaS Signup)."""
    return SaaSService(db).register_saas(data)

@router.post("/join", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def join_workspace(data: JoinWorkspaceRequest, db: Session = Depends(get_db)):
    """Join an existing workspace using an invitation code."""
    return SaaSService(db).join_workspace(data)

@router.post("/invite", status_code=status.HTTP_201_CREATED)
def invite_user(
    data: InviteUserRequest,
    current_user: User = Depends(RoleChecker([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    """Invite a new user to the workspace. Generates an invitation code."""
    invitation = SaaSService(db).invite_user(current_user.company_id, current_user.id, data)
    # In a real app, send email here. For now, we return the code.
    return {
        "message": "Invitation created successfully",
        "code": invitation.code,
        "email": invitation.email,
        "role": invitation.role.value
    }
