import shutil
import uuid
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_id
from app.models.company import Company
from app.models.user import User

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

UPLOAD_DIR = Path("uploads/logos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}

@router.put("/settings")
def update_workspace_settings(
    settings_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    if current_user.role.value != "company_admin" and current_user.role.value != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to update workspace settings")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Update top level fields
    if "name" in settings_data:
        company.name = settings_data["name"]
    if "website" in settings_data:
        company.website = settings_data["website"]
    
    # Update nested settings dict
    new_settings = dict(company.settings or {})
    for key in ["address", "currency", "tax_percentage", "timezone", "description", "support_email", "support_phone"]:
        if key in settings_data:
            new_settings[key] = settings_data[key]
            
    company.settings = new_settings
    
    db.commit()
    db.refresh(company)

    return {"message": "Settings updated successfully", "settings": company.settings, "name": company.name, "website": company.website, "logo_url": company.logo_url}


@router.post("/logo")
def upload_workspace_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    company_id: uuid.UUID = Depends(get_workspace_id),
):
    if current_user.role.value != "company_admin" and current_user.role.value != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to update workspace logo")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, and JPEG are allowed for logos")

    file_uuid = uuid.uuid4()
    # Serve this via a static mount later, or just return the path
    # For a local app, we might need a route to serve uploaded files, or just use a static mount
    # Here we'll return a path that the frontend can fetch
    file_path = UPLOAD_DIR / f"{company_id}_logo_{file_uuid}{ext}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    company = db.query(Company).filter(Company.id == company_id).first()
    
    # The URL to access it: we'll set up a static route in main.py
    # /static/logos/...
    logo_url = f"/static/logos/{file_path.name}"
    company.logo_url = logo_url

    db.commit()
    db.refresh(company)

    return {"message": "Logo uploaded successfully", "logo_url": logo_url}
