from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.core.enums import ERPInvoiceStatus
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.erp_invoice import (
    ERPInvoiceCreate,
    ERPInvoiceResponse,
    ERPInvoiceStatsResponse,
    ERPInvoiceStatusUpdate,
    ERPInvoiceUpdate,
)
from app.services.erp_invoice_service import ERPInvoiceService

router = APIRouter(prefix="/erp-invoices", tags=["ERP - Invoices"])


@router.post("", response_model=ERPInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: ERPInvoiceCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).create_invoice(company_id, data)


@router.get("", response_model=List[ERPInvoiceResponse])
def list_invoices(
    customer_id: Optional[UUID] = None,
    status_filter: Optional[ERPInvoiceStatus] = None,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).list_invoices(company_id, customer_id, status_filter)


@router.get("/export", response_class=StreamingResponse)
def export_invoices(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    invoices = ERPInvoiceService(db).list_invoices(company_id=company_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Invoice Number", "Customer Name", "Issue Date", "Due Date", "Total Amount", "Status"])
    
    for inv in invoices:
        writer.writerow([
            str(inv.id),
            inv.invoice_number,
            inv.customer.name if inv.customer else "",
            inv.issue_date.isoformat() if inv.issue_date else "",
            inv.due_date.isoformat() if inv.due_date else "",
            str(inv.total_amount),
            inv.status.value
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices.csv"}
    )


@router.get("/stats", response_model=ERPInvoiceStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).get_stats(company_id)


@router.get("/{invoice_id}", response_model=ERPInvoiceResponse)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).get_invoice(company_id, invoice_id)


@router.put("/{invoice_id}", response_model=ERPInvoiceResponse)
def update_invoice(
    invoice_id: UUID,
    data: ERPInvoiceUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).update_invoice(company_id, invoice_id, data)


@router.patch("/{invoice_id}/status", response_model=ERPInvoiceResponse)
def update_invoice_status(
    invoice_id: UUID,
    data: ERPInvoiceStatusUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ERPInvoiceService(db).update_status(company_id, invoice_id, data.status)


@router.delete("/{invoice_id}", response_model=MessageResponse)
def delete_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    ERPInvoiceService(db).delete_invoice(company_id, invoice_id)
    return MessageResponse(message="Invoice deleted successfully")
