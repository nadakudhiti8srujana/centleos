from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import Field

from app.core.enums import ERPInvoiceStatus
from app.schemas.common import BaseSchema


class ERPInvoiceItemBase(BaseSchema):
    item_name: str
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(..., ge=0)


class ERPInvoiceItemCreate(ERPInvoiceItemBase):
    pass


class ERPInvoiceItemResponse(ERPInvoiceItemBase):
    id: UUID
    erp_invoice_id: UUID
    total: Decimal


class ERPInvoiceBase(BaseSchema):
    customer_id: UUID
    deal_id: Optional[UUID] = None
    invoice_number: str
    issue_date: date
    due_date: date


class ERPInvoiceCreate(ERPInvoiceBase):
    items: List[ERPInvoiceItemCreate]


class ERPInvoiceUpdate(BaseSchema):
    customer_id: Optional[UUID] = None
    deal_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    items: Optional[List[ERPInvoiceItemCreate]] = None


class ERPInvoiceStatusUpdate(BaseSchema):
    status: ERPInvoiceStatus


class ERPInvoiceResponse(ERPInvoiceBase):
    id: UUID
    company_id: UUID
    subtotal: Decimal
    tax: Decimal
    total_amount: Decimal
    status: ERPInvoiceStatus
    created_at: datetime
    updated_at: datetime
    
    items: List[ERPInvoiceItemResponse]


class ERPInvoiceStatsResponse(BaseSchema):
    total_invoices: int
    paid_invoices: int
    pending_invoices: int
    revenue_collected: Decimal
