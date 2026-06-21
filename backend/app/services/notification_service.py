from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.enums import NotificationChannel, NotificationTrigger
from app.models.notification import Notification
from app.models.notification_log import NotificationLog


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(
        self,
        company_id: UUID,
        user_id: UUID,
        trigger_type: NotificationTrigger,
        title: str,
        message: str,
        metadata: Optional[dict] = None,
        channel: NotificationChannel = NotificationChannel.IN_APP,
    ) -> Notification:
        notification = Notification(
            company_id=company_id,
            user_id=user_id,
            trigger_type=trigger_type,
            channel=channel,
            title=title,
            message=message,
            metadata_=metadata or {},
            created_at=datetime.now(timezone.utc),
            sent_at=datetime.now(timezone.utc),
        )
        self.db.add(notification)
        
        # Create an audit log for the super admin
        log = NotificationLog(
            company_id=company_id,
            user_id=user_id,
            type=trigger_type.value,
            channel=channel.value,
            message=message,
            status="sent",
            sent_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        
        self.db.commit()
        self.db.refresh(notification)
        return notification
