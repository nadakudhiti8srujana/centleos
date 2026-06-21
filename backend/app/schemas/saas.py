from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class SaaSRegistrationRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    workspace_slug: str = Field(..., min_length=3, max_length=100)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8, max_length=128)
    admin_full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

class UserRegistrationRequest(BaseModel):
    workspace_slug: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

class JoinWorkspaceRequest(BaseModel):
    invitation_code: str = Field(..., min_length=5, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    phone: Optional[str] = Field(None, max_length=20)

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str = Field("sales_representative", description="Role to assign the invited user")
