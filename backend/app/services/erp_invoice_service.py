from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.enums import ERPInvoiceStatus
from app.models.erp_invoice import ERPInvoice
from app.models.erp_invoice_item import ERPInvoiceItem
from app.schemas.erp_invoice import ERPInvoiceCreate, ERPInvoiceUpdate


class ERPInvoiceService:
    def __init__(self, db: Session):
        self.db = db

    def _calculate_totals(self, items_data: List[dict]):
        subtotal = Decimal("0.0")
        for item in items_data:
            qty = Decimal(str(item["quantity"]))
            price = Decimal(str(item["unit_price"]))
            subtotal += qty * price
        
        tax = subtotal * Decimal("0.10")  # Assuming 10% tax for ERP
        total = subtotal + tax
        return subtotal, tax, total

    def create_invoice(self, company_id: UUID, data: ERPInvoiceCreate) -> ERPInvoice:
        # Check if invoice_number exists
        existing = self.db.query(ERPInvoice).filter(
            ERPInvoice.company_id == company_id,
            ERPInvoice.invoice_number == data.invoice_number
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Invoice number already exists")

        subtotal, tax, total_amount = self._calculate_totals([item.model_dump() for item in data.items])

        invoice = ERPInvoice(
            company_id=company_id,
            customer_id=data.customer_id,
            deal_id=data.deal_id,
            invoice_number=data.invoice_number,
            issue_date=data.issue_date,
            due_date=data.due_date,
            subtotal=subtotal,
            tax=tax,
            total_amount=total_amount,
            status=ERPInvoiceStatus.DRAFT,
        )
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)

        # Create Items
        for item_data in data.items:
            item_total = Decimal(str(item_data.quantity)) * Decimal(str(item_data.unit_price))
            invoice_item = ERPInvoiceItem(
                erp_invoice_id=invoice.id,
                item_name=item_data.item_name,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total=item_total
            )
            self.db.add(invoice_item)
        
        self.db.commit()
        self.db.refresh(invoice)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=company_id,
            user_id=None, # In a real implementation we'd pass user_id
            action="create",
            entity_type="Invoice",
            entity_id=invoice.id,
            details={"invoice_number": invoice.invoice_number, "total": str(invoice.total_amount)}
        )
        
        # Email Trigger
        from app.services.email_service import EmailService
        from app.models.customer import Customer
        customer = self.db.query(Customer).filter(Customer.id == invoice.customer_id).first()
        if customer and customer.email:
            EmailService(self.db).trigger_email_event(
                company_id=company_id,
                trigger_event="invoice_generated",
                to_email=customer.email,
                variables={"invoice_number": invoice.invoice_number, "amount": str(invoice.total_amount), "customer_name": customer.name}
            )
            
        # Notification Trigger
        from app.services.notification_service import NotificationService
        from app.core.enums import NotificationTrigger, NotificationChannel
        # If invoice is linked to a customer with an account owner, notify them. We'll use created_by or an admin for now
        NotificationService(self.db).create_notification(
            company_id=company_id,
            user_id=invoice.created_by if invoice.created_by else company_id, # Fallback to company_id as an admin id in worst case, though created_by should exist
            trigger_type=NotificationTrigger.INVOICE_GENERATED,
            title="Invoice Generated",
            message=f"Invoice {invoice.invoice_number} for ${invoice.total_amount:.2f} has been generated.",
            channel=NotificationChannel.IN_APP
        )
        
        # Telegram Trigger (Optional External)
        from app.services.telegram_service import TelegramService
        TelegramService().trigger_invoice_generated(
            invoice_number=invoice.invoice_number,
            amount=str(invoice.total_amount),
            customer_name=customer.name if customer else "Unknown Customer"
        )
            
        return invoice

    def get_invoice(self, company_id: UUID, invoice_id: UUID) -> ERPInvoice:
        invoice = self.db.query(ERPInvoice).filter(
            ERPInvoice.company_id == company_id,
            ERPInvoice.id == invoice_id
        ).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice

    def list_invoices(self, company_id: UUID, customer_id: Optional[UUID] = None, status: Optional[ERPInvoiceStatus] = None) -> List[ERPInvoice]:
        query = self.db.query(ERPInvoice).filter(ERPInvoice.company_id == company_id)
        if customer_id:
            query = query.filter(ERPInvoice.customer_id == customer_id)
        if status:
            query = query.filter(ERPInvoice.status == status)
        return query.order_by(ERPInvoice.issue_date.desc()).all()

    def update_invoice(self, company_id: UUID, invoice_id: UUID, data: ERPInvoiceUpdate) -> ERPInvoice:
        invoice = self.get_invoice(company_id, invoice_id)
        
        if data.invoice_number and data.invoice_number != invoice.invoice_number:
            existing = self.db.query(ERPInvoice).filter(
                ERPInvoice.company_id == company_id,
                ERPInvoice.invoice_number == data.invoice_number
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Invoice number already exists")
            invoice.invoice_number = data.invoice_number

        if data.customer_id:
            invoice.customer_id = data.customer_id
        if data.deal_id is not None:
            invoice.deal_id = data.deal_id
        if data.issue_date:
            invoice.issue_date = data.issue_date
        if data.due_date:
            invoice.due_date = data.due_date
        
        if data.items is not None:
            # Delete old items
            self.db.query(ERPInvoiceItem).filter(ERPInvoiceItem.erp_invoice_id == invoice.id).delete()
            
            subtotal, tax, total_amount = self._calculate_totals([item.model_dump() for item in data.items])
            invoice.subtotal = subtotal
            invoice.tax = tax
            invoice.total_amount = total_amount

            for item_data in data.items:
                item_total = Decimal(str(item_data.quantity)) * Decimal(str(item_data.unit_price))
                invoice_item = ERPInvoiceItem(
                    erp_invoice_id=invoice.id,
                    item_name=item_data.item_name,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total=item_total
                )
                self.db.add(invoice_item)

        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def update_status(self, company_id: UUID, invoice_id: UUID, status: ERPInvoiceStatus) -> ERPInvoice:
        invoice = self.get_invoice(company_id, invoice_id)
        invoice.status = status
        self.db.commit()
        self.db.refresh(invoice)
        
        # Audit Log
        from app.services.audit_service import AuditService
        AuditService(self.db).log_action(
            company_id=company_id,
            user_id=None,
            action=f"status_update_{status.value}",
            entity_type="Invoice",
            entity_id=invoice.id,
            details={"status": status.value}
        )
        
        return invoice

    def delete_invoice(self, company_id: UUID, invoice_id: UUID):
        invoice = self.get_invoice(company_id, invoice_id)
        self.db.delete(invoice)
        self.db.commit()

    def get_stats(self, company_id: UUID) -> dict:
        invoices = self.db.query(ERPInvoice).filter(ERPInvoice.company_id == company_id).all()
        
        total = len(invoices)
        paid = sum(1 for i in invoices if i.status == ERPInvoiceStatus.PAID)
        pending = sum(1 for i in invoices if i.status in [ERPInvoiceStatus.SENT, ERPInvoiceStatus.DRAFT, ERPInvoiceStatus.OVERDUE])
        revenue = sum(i.total_amount for i in invoices if i.status == ERPInvoiceStatus.PAID)
        
        return {
            "total_invoices": total,
            "paid_invoices": paid,
            "pending_invoices": pending,
            "revenue_collected": revenue
        }
