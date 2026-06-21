import os
import uuid
import shutil
from typing import List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_id
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/attachments", tags=["Attachments"])

UPLOAD_DIR = Path("uploads/attachments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    entity_type: str = Form(...),
    entity_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    if entity_type not in ["lead", "contact", "deal", "invoice"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")

    # Read file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_uuid = uuid.uuid4()
    file_path = UPLOAD_DIR / f"{company_id}_{file_uuid}{ext}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    attachment = Attachment(
        company_id=company_id,
        entity_type=entity_type,
        entity_id=entity_id,
        file_name=file.filename,
        file_path=str(file_path),
        content_type=file.content_type,
        file_size=file_size,
        uploaded_by=current_user.id
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment


@router.get("/{entity_type}/{entity_id}", response_model=List[AttachmentOut])
def list_attachments(
    entity_type: str,
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    return db.query(Attachment).filter(
        Attachment.company_id == company_id,
        Attachment.entity_type == entity_type,
        Attachment.entity_id == entity_id
    ).order_by(Attachment.created_at.desc()).all()


@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.company_id == company_id
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(attachment.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.content_type
    )


@router.delete("/{attachment_id}", response_model=MessageResponse)
def delete_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    attachment = db.query(Attachment).filter(
        Attachment.id == attachment_id,
        Attachment.company_id == company_id
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Remove physical file
    file_path = Path(attachment.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(attachment)
    db.commit()

    return MessageResponse(message="Attachment deleted successfully")
