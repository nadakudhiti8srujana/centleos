from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_workspace_id, require_crm_access
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.crm.activity import (
    ActivityCreate,
    ActivityResponse,
    ActivityTimelineResponse,
    ActivityUpdate,
)
from app.services.crm.activity_service import ActivityService

router = APIRouter(prefix="/activities", tags=["CRM - Activities"])


@router.post(
    "/leads/{lead_id}",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lead_activity(
    lead_id: UUID,
    data: ActivityCreate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    current_user: User = Depends(require_crm_access),
):
    """Log a call, email, meeting, or note on a lead."""
    return ActivityService(db, company_id).create_for_lead(lead_id, data, current_user.id)


@router.get("/leads/{lead_id}/timeline", response_model=ActivityTimelineResponse)
def get_lead_timeline(
    lead_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    """Activity timeline for a lead."""
    return ActivityService(db, company_id).get_lead_timeline(lead_id)


@router.patch("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: UUID,
    data: ActivityUpdate,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    return ActivityService(db, company_id).update(activity_id, data)


@router.delete("/{activity_id}", response_model=MessageResponse)
def delete_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    company_id: UUID = Depends(get_workspace_id),
    _: User = Depends(require_crm_access),
):
    ActivityService(db, company_id).delete(activity_id)
    return MessageResponse(message="Activity deleted successfully")
