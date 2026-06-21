from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    SALES_REPRESENTATIVE = "sales_representative"
    AMBASSADOR = "ambassador"
    USER = "user"


class LeadSource(str, Enum):
    ORGANIC = "organic"
    REFERRAL = "referral"
    EVENT = "event"
    WEBSITE = "website"
    ADS = "ads"


class LeadStage(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


# Backward-compatible alias
LeadStatus = LeadStage

PIPELINE_STAGES = list(LeadStage)


class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"


class DealStatus(str, Enum):
    OPEN = "open"
    WON = "won"
    LOST = "lost"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"


class ERPInvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"


class PaymentStatus(str, Enum):
    PAID = "paid"
    PENDING = "pending"
    OVERDUE = "overdue"


class ReferralPayoutStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"


class NotificationChannel(str, Enum):
    EMAIL = "email"
    TELEGRAM = "telegram"
    IN_APP = "in_app"


class NotificationTrigger(str, Enum):
    LEAD_ASSIGNED = "lead_assigned"
    LEAD_STAGE_CHANGED = "lead_stage_changed"
    DEAL_WON = "deal_won"
    INVOICE_GENERATED = "invoice_generated"
    REFERRAL_CONVERSION = "referral_conversion"
    PAYOUT_PROCESSED = "payout_processed"


ROLE_HIERARCHY = {
    UserRole.SUPER_ADMIN: 5,
    UserRole.COMPANY_ADMIN: 4,
    UserRole.SALES_REPRESENTATIVE: 3,
    UserRole.USER: 2,
    UserRole.AMBASSADOR: 1,
}

ADMIN_ROLES = {UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN}
SALES_ROLES = {UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_REPRESENTATIVE, UserRole.USER}
