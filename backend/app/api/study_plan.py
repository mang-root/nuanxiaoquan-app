"""
学习计划API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.utils.database import get_db
from app.models.models import StudyPlan, User
from app.api.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()

class StudyPlanCreate(BaseModel):
    title: str
    goal: str
    duration: int
    daily_hours: float
    strengths: List[str] = []
    weaknesses: List[str] = []
    current_level: str = "中等"

class StudyPlanResponse(BaseModel):
    id: int
    title: str
    goal: str
    duration: int
    daily_hours: float
    progress: float
    status: str
    ai_generated: dict
    
    class Config:
        from_attributes = True

@router.post("/create", response_model=StudyPlanResponse)
async def create_study_plan(
    plan_data: StudyPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建AI学习计划
    """
    # 准备AI生成所需数据
    ai_input = {
        'education_level': current_user.education_level,
        'goal': plan_data.goal,
        'duration': plan_data.duration,
        'daily_hours': plan_data.daily_hours,
        'strengths': plan_data.strengths,
        'weaknesses': plan_data.weaknesses,
        'current_level': plan_data.current_level
    }
    
    # 调用豆包AI生成计划
    ai_plan = ai_service.generate_study_plan(ai_input)
    
    # 创建学习计划
    new_plan = StudyPlan(
        user_id=current_user.id,
        title=plan_data.title,
        goal=plan_data.goal,
        duration=plan_data.duration,
        daily_hours=plan_data.daily_hours,
        ai_generated=ai_plan,
        progress=0,
        status='进行中'
    )
    
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    return new_plan

@router.get("/list", response_model=List[StudyPlanResponse])
async def get_study_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的所有学习计划"""
    plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id
    ).order_by(StudyPlan.created_at.desc()).all()
    
    return plans

@router.get("/{plan_id}", response_model=StudyPlanResponse)
async def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个学习计划详情"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    return plan

@router.put("/{plan_id}/progress")
async def update_progress(
    plan_id: int,
    progress: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新学习计划进度"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    plan.progress = progress
    
    # 自动更新状态
    if progress >= 100:
        plan.status = '已完成'
    
    db.commit()
    
    return {"message": "进度更新成功", "progress": progress}

@router.post("/{plan_id}/adjust")
async def adjust_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """根据完成度AI调整计划"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    # AI调整计划
    completion_rate = float(plan.progress) / 100
    adjusted_plan = ai_service.adjust_plan_by_progress(
        plan.ai_generated,
        completion_rate
    )
    
    plan.ai_generated = adjusted_plan
    db.commit()
    
    return {
        "message": "计划调整成功",
        "suggestion": adjusted_plan.get('adjustment_suggestion', '')
    }

@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除学习计划"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    
    db.delete(plan)
    db.commit()
    
    return {"message": "删除成功"}
