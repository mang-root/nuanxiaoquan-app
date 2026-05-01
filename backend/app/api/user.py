"""用户API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.database import get_db
from app.models.models import User
from app.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserUpdate(BaseModel):
    nickname: str = None
    avatar: str = None
    theme: str = None
    education_level: str = None

@router.put("/profile")
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.nickname:
        current_user.nickname = data.nickname
    if data.avatar:
        current_user.avatar = data.avatar
    if data.theme:
        current_user.theme = data.theme
    if data.education_level:
        current_user.education_level = data.education_level
    
    db.commit()
    return {"message": "更新成功"}

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户统计数据"""
    from app.models.models import StudyPlan, UserBehavior
    
    plans_count = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).count()
    behaviors_count = db.query(UserBehavior).filter(UserBehavior.user_id == current_user.id).count()
    
    return {
        "level": current_user.level,
        "points": current_user.points,
        "plans_count": plans_count,
        "total_actions": behaviors_count
    }
