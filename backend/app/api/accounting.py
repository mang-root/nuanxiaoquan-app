"""记账API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.utils.database import get_db
from app.models.models import Accounting, User
from app.api.auth import get_current_user

router = APIRouter()

class AccountingCreate(BaseModel):
    type: str
    amount: float
    category: str
    note: str = ""
    record_date: datetime

@router.post("/add")
async def add_record(
    data: AccountingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = Accounting(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(record)
    db.commit()
    return {"message": "记账成功"}

@router.get("/list")
async def get_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(Accounting).filter(
        Accounting.user_id == current_user.id
    ).order_by(Accounting.record_date.desc()).all()
    return records
