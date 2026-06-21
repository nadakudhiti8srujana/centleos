import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.models.pipeline_stage import PipelineStage
from app.models.user import User
from app.schemas.pipeline_stage import PipelineStageCreate, PipelineStageOut, PipelineStageUpdate

router = APIRouter()

@router.get("/", response_model=List[PipelineStageOut])
def get_pipeline_stages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(PipelineStage).filter(
        PipelineStage.company_id == current_user.company_id
    ).order_by(PipelineStage.order.asc()).all()

@router.post("/", response_model=PipelineStageOut, status_code=status.HTTP_201_CREATED)
def create_pipeline_stage(
    stage_in: PipelineStageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stage = PipelineStage(
        company_id=current_user.company_id,
        **stage_in.model_dump()
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage

@router.put("/{stage_id}", response_model=PipelineStageOut)
def update_pipeline_stage(
    stage_id: uuid.UUID,
    stage_in: PipelineStageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stage = db.query(PipelineStage).filter(
        PipelineStage.id == stage_id,
        PipelineStage.company_id == current_user.company_id
    ).first()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Pipeline stage not found")
        
    for field, value in stage_in.model_dump(exclude_unset=True).items():
        setattr(stage, field, value)
        
    db.commit()
    db.refresh(stage)
    return stage

@router.delete("/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline_stage(
    stage_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stage = db.query(PipelineStage).filter(
        PipelineStage.id == stage_id,
        PipelineStage.company_id == current_user.company_id
    ).first()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Pipeline stage not found")
        
    db.delete(stage)
    db.commit()
    return None
