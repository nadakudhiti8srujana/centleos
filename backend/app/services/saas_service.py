import uuid
import string
import random
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.user import User
from app.models.invitation import WorkspaceInvitation
from app.schemas.saas import SaaSRegistrationRequest, JoinWorkspaceRequest, InviteUserRequest
from app.schemas.auth import TokenResponse
from app.services.auth_service import AuthService
from app.core.config import get_settings

settings = get_settings()


class SaaSService:
    def __init__(self, db: Session):
        self.db = db
        self.auth_service = AuthService(db)

    def register_saas(self, data: SaaSRegistrationRequest) -> TokenResponse:
        # Check if company/slug exists
        existing_company = self.db.query(Company).filter(Company.slug == data.workspace_slug.lower()).first()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Workspace slug already taken",
            )
        
        # Check if user email exists
        existing_user = self.db.query(User).filter(User.email == data.admin_email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Admin email already registered",
            )

        # 1. Create Company
        company = Company(
            name=data.company_name,
            slug=data.workspace_slug.lower(),
            is_active=True
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)

        # 2. Create Admin User
        user = User(
            email=data.admin_email.lower(),
            hashed_password=get_password_hash(data.admin_password),
            full_name=data.admin_full_name,
            phone=data.phone,
            role=UserRole.COMPANY_ADMIN,
            company_id=company.id,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        # 3. Auto Login (Generate Tokens)
        return self.auth_service._create_token_response(user)

    def register_user(self, data: "UserRegistrationRequest") -> TokenResponse:
        company = self.db.query(Company).filter(Company.slug == data.workspace_slug.lower()).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found. Please select a valid workspace.",
            )

        existing_user = self.db.query(User).filter(User.email == data.email.lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            email=data.email.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole.USER,
            company_id=company.id,
            is_active=True,
            is_verified=False,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return self.auth_service._create_token_response(user)

    def invite_user(self, company_id: uuid.UUID, creator_id: uuid.UUID, data: InviteUserRequest) -> WorkspaceInvitation:
        # Generate random invitation code
        code = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        
        try:
            role_enum = UserRole(data.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            )
            
        invitation = WorkspaceInvitation(
            company_id=company_id,
            email=data.email.lower(),
            code=code,
            role=role_enum,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            created_by=creator_id
        )
        
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        
        # Send Email
        from app.services.email_service import EmailService
        email_service = EmailService(self.db)
        
        company = self.db.query(Company).filter(Company.id == company_id).first()
        creator = self.db.query(User).filter(User.id == creator_id).first()
        
        # Generate the frontend join link
        # The frontend expects to join at /join?code=XYZ
        frontend_url = settings.FRONTEND_URL
        join_link = f"{frontend_url}/join?code={code}"
        
        subject = f"You've been invited to join {company.name} on CentleOS"
        body_html = f"""
        <p>Hi there,</p>
        <p><strong>{creator.full_name}</strong> has invited you to join the workspace <strong>{company.name}</strong> on CentleOS.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
        <p><a href="{join_link}" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:5px;">Join Workspace</a></p>
        <p>Or use this invitation code: <strong>{code}</strong></p>
        <p>This invitation will expire in 7 days.</p>
        """
        
        email_service.send_email(
            company_id=company_id,
            to_email=data.email.lower(),
            subject=subject,
            body_html=body_html,
        )
        
        return invitation

    def join_workspace(self, data: JoinWorkspaceRequest) -> TokenResponse:
        invitation = self.db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.code == data.invitation_code
        ).first()
        
        if not invitation or not invitation.is_valid():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or expired invitation code",
            )
            
        existing_user = self.db.query(User).filter(User.email == invitation.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )
            
        # Create User
        user = User(
            email=invitation.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=invitation.role,
            company_id=invitation.company_id,
            is_active=True,
            is_verified=True,
        )
        self.db.add(user)
        
        # Mark invitation as used
        invitation.is_used = True
        
        self.db.commit()
        self.db.refresh(user)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=invitation.company_id,
            user_id=user.id,
            action="joined_workspace",
            entity_type="Workspace",
            entity_id=invitation.company_id,
            details={"email": user.email, "role": user.role.value}
        )
        
        return self.auth_service._create_token_response(user)
