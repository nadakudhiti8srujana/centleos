from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class EmailTemplateBase(BaseModel):
    name: str
    trigger_event: str
    subject: str
    body_html: str
    body_text: Optional[str] = None
    variables: List[str] = []


class EmailTemplateCreate(EmailTemplateBase):
    pass


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    trigger_event: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    variables: Optional[List[str]] = None


class EmailTemplateResponse(EmailTemplateBase):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PreviewRequest(BaseModel):
    template_id: Optional[str] = None
    body_html: Optional[str] = None
    subject: Optional[str] = None
    variables: dict = {}
