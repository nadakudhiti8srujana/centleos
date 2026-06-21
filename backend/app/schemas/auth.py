from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.enums import UserRole
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.SALES_REPRESENTATIVE
    company_id: Optional[UUID] = None
    company_slug: Optional[str] = Field(
        None,
        description="Workspace slug for multi-tenant registration (e.g. skill-tank)",
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    company_slug: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    token: str
    company_slug: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
