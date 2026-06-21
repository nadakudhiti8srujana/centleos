from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.activity import Activity
from app.schemas.crm.activity import (
    ActivityCreate,
    ActivityResponse,
    ActivityTimelineResponse,
    ActivityUpdate,
)
from app.services.crm.utils import ensure_deal, ensure_lead


class ActivityService:
    def __init__(self, db: Session, company_id: UUID):
        self.db = db
        self.company_id = company_id

    def _base_query(self):
        return (
            self.db.query(Activity)
            .filter(Activity.company_id == self.company_id)
            .options(joinedload(Activity.creator))
        )

    def create_for_lead(
        self, lead_id: UUID, data: ActivityCreate, created_by: UUID
    ) -> ActivityResponse:
        lead = ensure_lead(self.db, self.company_id, lead_id)
        if data.deal_id:
            ensure_deal(self.db, self.company_id, data.deal_id)
        activity = Activity(
            company_id=self.company_id,
            lead_id=lead.id,
            contact_id=data.contact_id or lead.contact_id,
            created_by=created_by,
            **data.model_dump(),
        )
        self.db.add(activity)
        self.db.commit()
        activity = self._base_query().filter(Activity.id == activity.id).first()
        return ActivityResponse.model_validate(activity)

    def get_lead_timeline(self, lead_id: UUID) -> ActivityTimelineResponse:
        ensure_lead(self.db, self.company_id, lead_id)
        activities = (
            self._base_query()
            .filter(Activity.lead_id == lead_id)
            .order_by(Activity.created_at.desc())
            .all()
        )
        return ActivityTimelineResponse(
            lead_id=lead_id,
            total=len(activities),
            activities=[ActivityResponse.model_validate(a) for a in activities],
        )

    def update(self, activity_id: UUID, data: ActivityUpdate) -> ActivityResponse:
        activity = self._base_query().filter(Activity.id == activity_id).first()
        if not activity:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(activity, field, value)
        self.db.commit()
        activity = self._base_query().filter(Activity.id == activity_id).first()
        return ActivityResponse.model_validate(activity)

    def delete(self, activity_id: UUID) -> None:
        activity = (
            self.db.query(Activity)
            .filter(Activity.id == activity_id, Activity.company_id == self.company_id)
            .first()
        )
        if not activity:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        self.db.delete(activity)
        self.db.commit()
