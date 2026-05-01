"""生理期API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.utils.database import get_db
from app.models.models import MenstrualRecord, User
from app.api.auth import get_current_user

router = APIRouter()

class MenstrualCreate(BaseModel):
    start_date: datetime
    end_date: datetime = None

@router.post("/add")
async def add_record(
    data: MenstrualCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = MenstrualRecord(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(record)
    db.commit()
    return {"message": "记录成功"}

@router.get("/list")
async def get_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(MenstrualRecord).filter(
        MenstrualRecord.user_id == current_user.id
    ).order_by(MenstrualRecord.start_date.desc()).all()
    return records
