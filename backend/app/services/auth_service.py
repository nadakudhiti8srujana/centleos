from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.enums import UserRole
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.company import Company
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, GoogleLoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserResponse
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

settings = get_settings()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def _validate_registration(self, data: RegisterRequest) -> Optional[UUID]:
        if data.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot self-register as super admin",
            )

        company_id = data.company_id

        if data.company_slug:
            company = (
                self.db.query(Company)
                .filter(Company.slug == data.company_slug, Company.is_active.is_(True))
                .first()
            )
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Workspace '{data.company_slug}' not found",
                )
            company_id = company.id

        if data.role != UserRole.SUPER_ADMIN and company_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="company_id or company_slug is required for workspace users",
            )

        if company_id:
            company = self.db.query(Company).filter(Company.id == company_id).first()
            if not company or not company.is_active:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found or inactive",
                )

        existing = self.db.query(User).filter(User.email == data.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        return company_id

    def register(self, data: RegisterRequest) -> TokenResponse:
        company_id = self._validate_registration(data)

        user = User(
            email=data.email.lower(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=data.role,
            company_id=company_id,
            is_active=True,
            is_verified=False,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return self._create_token_response(user)

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.db.query(User).filter(User.email == data.email.lower()).first()

        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        if data.company_slug:
            company = self.db.query(Company).filter(Company.slug == data.company_slug).first()
            if not company or user.company_id != company.id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User does not belong to the selected company",
                )
        elif user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Company selection is required for workspace users",
            )

        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)

        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=user.company_id or user.id, # Fallback to user_id for super admins
            user_id=user.id,
            action="login",
            entity_type="Auth",
            entity_id=user.id,
            details={"email": user.email}
        )

        return self._create_token_response(user)

    def google_login(self, data: GoogleLoginRequest) -> TokenResponse:
        try:
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                data.token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = idinfo["email"].lower()
            name = idinfo.get("name", email.split("@")[0])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )

        # Check if user exists
        user = self.db.query(User).filter(User.email == email).first()

        if user:
            # User exists, proceed with login checks
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is deactivated",
                )
            if data.company_slug:
                company = self.db.query(Company).filter(Company.slug == data.company_slug).first()
                if not company or user.company_id != company.id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User does not belong to the selected company",
                    )
            elif user.role != UserRole.SUPER_ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Company selection is required for workspace users",
                )
            
            user.last_login_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(user)

        else:
            # User does not exist, automatically register them
            if not data.company_slug:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Company selection is required for new workspace users",
                )
            
            company = self.db.query(Company).filter(Company.slug == data.company_slug, Company.is_active.is_(True)).first()
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Workspace '{data.company_slug}' not found",
                )

            user = User(
                email=email,
                hashed_password=get_password_hash(""), # No password for Google Auth users
                full_name=name,
                role=UserRole.SALES_REPRESENTATIVE, # Default role
                company_id=company.id,
                is_active=True,
                is_verified=True, # Google emails are already verified
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=user.company_id or user.id,
            user_id=user.id,
            action="login_google",
            entity_type="Auth",
            entity_id=user.id,
            details={"email": user.email}
        )

        return self._create_token_response(user)

    def refresh_access_token(self, raw_refresh_token: str) -> TokenResponse:
        token_hash = hash_token(raw_refresh_token)
        stored = (
            self.db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
            .first()
        )

        if not stored:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if stored.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = self.db.query(User).filter(User.id == stored.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        stored.revoked_at = datetime.now(timezone.utc)
        self.db.commit()

        return self._create_token_response(user)

    def logout(self, user_id: UUID, raw_refresh_token: Optional[str] = None) -> None:
        if raw_refresh_token:
            token_hash = hash_token(raw_refresh_token)
            stored = (
                self.db.query(RefreshToken)
                .filter(
                    RefreshToken.user_id == user_id,
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.revoked_at.is_(None),
                )
                .first()
            )
            if stored:
                stored.revoked_at = datetime.now(timezone.utc)
        else:
            self.db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            ).update({"revoked_at": datetime.now(timezone.utc)})

        self.db.commit()
        
        # Audit Log
        from app.services.audit_service import AuditService
        user = self.get_user_by_id(user_id)
        if user:
            AuditService(self.db).log_action(
                company_id=user.company_id or user.id,
                user_id=user.id,
                action="logout",
                entity_type="Auth",
                entity_id=user.id,
                details={}
            )

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.hashed_password = get_password_hash(new_password)
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": datetime.now(timezone.utc)})
        self.db.commit()

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def forgot_password(self, data: ForgotPasswordRequest) -> None:
        user = self.db.query(User).filter(User.email == data.email.lower()).first()
        if not user or not user.is_active:
            return # Don't leak user existence
            
        # Create a simple JWT token with 1 hour expiration for reset
        import jwt
        from datetime import timedelta
        payload = {
            "sub": str(user.id),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "type": "reset_password"
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        # Send Email
        from app.services.email_service import EmailService
        from app.models.company import Company
        email_service = EmailService(self.db)
        
        company = None
        if user.company_id:
            company = self.db.query(Company).filter(Company.id == user.company_id).first()
            
        company_name = company.name if company else "CentleOS"
        company_id = company.id if company else user.id # Fallback
        
        frontend_url = settings.FRONTEND_URL
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        subject = "Reset your password"
        body_html = f"""
        <p>Hi {user.full_name},</p>
        <p>You requested to reset your password for {company_name}.</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="{reset_link}" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:5px;">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        """
        
        email_service.send_email(
            company_id=company_id,
            to_email=user.email,
            subject=subject,
            body_html=body_html,
        )

    def reset_password(self, data: ResetPasswordRequest) -> None:
        import jwt
        import uuid
        try:
            payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "reset_password":
                raise HTTPException(status_code=400, detail="Invalid token type")
            user_id = uuid.UUID(payload.get("sub"))
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Reset token expired")
        except (jwt.InvalidTokenError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid reset token")
            
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=404, detail="User not found or inactive")
            
        user.hashed_password = get_password_hash(data.new_password)
        # Revoke all sessions
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": datetime.now(timezone.utc)})
        
        self.db.commit()

    def _create_token_response(self, user: User) -> TokenResponse:
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={
                "email": user.email,
                "role": user.role.value,
                "company_id": str(user.company_id) if user.company_id else None,
            },
        )

        raw_refresh, token_hash, expires_at = create_refresh_token()
        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(refresh_record)
        self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )
