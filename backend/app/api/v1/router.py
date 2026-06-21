from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    activities,
    analytics,
    attachments,
    audit_logs,
    auth,
    contacts,
    deals,
    email_logs,
    email_templates,
    erp_invoices,
    leads,
    notifications,
    pipeline_stages,
    referrals,
    reminders,
    saas,
    search,
    super_admin,
    users,
    workspaces,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(leads.router)
api_router.include_router(contacts.router)
api_router.include_router(accounts.router)
api_router.include_router(deals.router)
api_router.include_router(activities.router, tags=["activities"])
api_router.include_router(referrals.router)
api_router.include_router(erp_invoices.router, tags=["erp-invoices"])
api_router.include_router(saas.router, tags=["saas"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])
api_router.include_router(pipeline_stages.router, prefix="/pipeline-stages", tags=["pipeline-stages"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(notifications.router)
api_router.include_router(email_templates.router)
api_router.include_router(audit_logs.router)
api_router.include_router(workspaces.router)
api_router.include_router(search.router)
api_router.include_router(users.router)
api_router.include_router(attachments.router)
