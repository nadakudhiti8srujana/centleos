from datetime import datetime
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderOut, ReminderUpdate
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_in: ReminderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    reminder = Reminder(
        company_id=current_user.company_id,
        user_id=current_user.id,
        **reminder_in.model_dump()
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.get("/", response_model=List[ReminderOut])
def get_reminders(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    is_completed: bool = None,
):
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if is_completed is not None:
        query = query.filter(Reminder.is_completed == is_completed)
    return query.order_by(Reminder.due_date.asc()).all()

@router.get("/due", response_model=List[ReminderOut])
def get_due_reminders(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Fetch incomplete reminders ordered by due_date
    now = datetime.utcnow()
    query = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.is_completed == False,
    ).order_by(Reminder.due_date.asc())
    
    return query.all()

@router.put("/{reminder_id}", response_model=ReminderOut)
def update_reminder(
    reminder_id: uuid.UUID,
    reminder_in: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    update_data = reminder_in.model_dump(exclude_unset=True)
    if "is_completed" in update_data:
        if update_data["is_completed"] and not reminder.is_completed:
            reminder.completed_at = datetime.utcnow()
        elif not update_data["is_completed"] and reminder.is_completed:
            reminder.completed_at = None
            
    for field, value in update_data.items():
        setattr(reminder, field, value)
        
    db.commit()
    db.refresh(reminder)
    
    if "is_completed" in update_data and update_data["is_completed"]:
        from app.services.audit_service import AuditService
        AuditService(db).log_action(
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="completed",
            entity_type="Reminder",
            entity_id=reminder.id,
            details={"title": reminder.title}
        )
        
    return reminder

@router.delete("/{reminder_id}", response_model=MessageResponse)
def delete_reminder(
    reminder_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(reminder)
    db.commit()
    return MessageResponse(message="Reminder deleted successfully")
