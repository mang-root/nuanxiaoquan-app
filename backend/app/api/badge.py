"""勋章API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.database import get_db
from app.models.models import Badge, User
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/list")
async def get_badges(db: Session = Depends(get_db)):
    """获取所有勋章"""
    badges = db.query(Badge).all()
    return badges

@router.get("/my-badges")
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的勋章"""
    from app.models.models import UserBadge
    user_badges = db.query(UserBadge).filter(
        UserBadge.user_id == current_user.id
    ).all()
    return user_badges
