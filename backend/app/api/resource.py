"""
学习资源API
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.utils.database import get_db
from app.models.models import Resource, UserBehavior, User
from app.api.auth import get_current_user
from app.services.recommend_service import recommend_service

router = APIRouter()

class ResourceResponse(BaseModel):
    id: int
    type: str
    title: str
    description: Optional[str]
    file_url: Optional[str]
    file_type: Optional[str]
    education_level: Optional[str]
    subject: Optional[str]
    views: int
    likes: int
    collects: int
    recommend_score: float
    
    class Config:
        from_attributes = True

@router.get("/recommend", response_model=List[ResourceResponse])
async def get_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取AI个性化推荐资源"""
    resources = recommend_service.get_recommendations(current_user.id, db, limit)
    return resources

@router.get("/hot", response_model=List[ResourceResponse])
async def get_hot_resources(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """获取热门资源"""
    resources = recommend_service.get_hot_resources(db, limit)
    return resources

@router.get("/list", response_model=List[ResourceResponse])
async def get_resources(
    education_level: Optional[str] = None,
    subject: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """获取资源列表（支持筛选）"""
    query = db.query(Resource)
    
    if education_level:
        query = query.filter(Resource.education_level == education_level)
    
    if subject:
        query = query.filter(Resource.subject == subject)
    
    if keyword:
        query = query.filter(
            (Resource.title.like(f'%{keyword}%')) |
            (Resource.description.like(f'%{keyword}%'))
        )
    
    resources = query.order_by(Resource.created_at.desc()).offset(skip).limit(limit).all()
    return resources

@router.post("/upload")
async def upload_resource(
    title: str,
    description: str,
    education_level: str,
    subject: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """用户上传学习资源"""
    # TODO: 实际项目中需要上传到OSS
    # file_url = upload_to_oss(file)
    
    # 这里使用模拟URL
    file_url = f"https://cdn.warmcircle.com/uploads/{file.filename}"
    
    # 检测文件类型
    file_extension = file.filename.split('.')[-1].lower()
    file_type_map = {
        'pdf': 'PDF',
        'doc': 'Word',
        'docx': 'Word',
        'mp4': '视频',
        'jpg': '图片',
        'png': '图片'
    }
    file_type = file_type_map.get(file_extension, 'PDF')
    
    new_resource = Resource(
        type='用户上传',
        uploader_id=current_user.id,
        title=title,
        description=description,
        file_url=file_url,
        file_type=file_type,
        education_level=education_level,
        subject=subject
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    # 奖励积分
    current_user.points += 10
    db.commit()
    
    return {"message": "上传成功", "resource_id": new_resource.id}

@router.post("/{resource_id}/view")
async def record_view(
    resource_id: int,
    duration: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """记录浏览行为"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    # 增加浏览量
    resource.views += 1
    
    # 记录行为
    behavior = UserBehavior(
        user_id=current_user.id,
        resource_id=resource_id,
        action='浏览',
        duration=duration
    )
    db.add(behavior)
    db.commit()
    
    return {"message": "记录成功"}

@router.post("/{resource_id}/like")
async def like_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """点赞资源"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    # 检查是否已点赞
    existing = db.query(UserBehavior).filter(
        UserBehavior.user_id == current_user.id,
        UserBehavior.resource_id == resource_id,
        UserBehavior.action == '点赞'
    ).first()
    
    if existing:
        # 取消点赞
        resource.likes -= 1
        db.delete(existing)
        message = "取消点赞"
    else:
        # 点赞
        resource.likes += 1
        behavior = UserBehavior(
            user_id=current_user.id,
            resource_id=resource_id,
            action='点赞'
        )
        db.add(behavior)
        message = "点赞成功"
    
    db.commit()
    return {"message": message, "likes": resource.likes}

@router.post("/{resource_id}/collect")
async def collect_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """收藏资源"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    existing = db.query(UserBehavior).filter(
        UserBehavior.user_id == current_user.id,
        UserBehavior.resource_id == resource_id,
        UserBehavior.action == '收藏'
    ).first()
    
    if existing:
        resource.collects -= 1
        db.delete(existing)
        message = "取消收藏"
    else:
        resource.collects += 1
        behavior = UserBehavior(
            user_id=current_user.id,
            resource_id=resource_id,
            action='收藏'
        )
        db.add(behavior)
        message = "收藏成功"
    
    db.commit()
    return {"message": message, "collects": resource.collects}

@router.get("/my-collects", response_model=List[ResourceResponse])
async def get_my_collects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的收藏"""
    behaviors = db.query(UserBehavior).filter(
        UserBehavior.user_id == current_user.id,
        UserBehavior.action == '收藏'
    ).all()
    
    resource_ids = [b.resource_id for b in behaviors]
    resources = db.query(Resource).filter(Resource.id.in_(resource_ids)).all()
    
    return resources
