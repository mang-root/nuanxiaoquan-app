"""
智能推荐算法服务
"""
from sqlalchemy.orm import Session
from app.models.models import Resource, User, UserBehavior
from datetime import datetime, timedelta
from typing import List
import math

class RecommendService:
    def get_recommendations(self, user_id: int, db: Session, limit: int = 10) -> List[Resource]:
        """
        获取个性化推荐资源
        
        Args:
            user_id: 用户ID
            db: 数据库会话
            limit: 返回数量
        
        Returns:
            推荐资源列表
        """
        # 1. 获取用户画像
        user_profile = self._get_user_profile(user_id, db)
        
        # 2. 获取候选资源池（最近30天的资源）
        thirty_days_ago = datetime.now() - timedelta(days=30)
        candidates = db.query(Resource).filter(
            Resource.created_at >= thirty_days_ago
        ).all()
        
        # 3. 计算每个资源的推荐分数
        scored_resources = []
        for resource in candidates:
            score = self._calculate_score(resource, user_profile, db)
            scored_resources.append((resource, score))
        
        # 4. 排序并返回Top N
        scored_resources.sort(key=lambda x: x[1], reverse=True)
        
        # 5. 更新推荐分数到数据库
        for resource, score in scored_resources[:limit]:
            resource.recommend_score = score
        db.commit()
        
        return [r[0] for r in scored_resources[:limit]]
    
    def _get_user_profile(self, user_id: int, db: Session) -> dict:
        """构建用户画像"""
        user = db.query(User).filter(User.id == user_id).first()
        
        # 获取用户最近的行为数据
        recent_behaviors = db.query(UserBehavior).filter(
            UserBehavior.user_id == user_id
        ).order_by(UserBehavior.created_at.desc()).limit(100).all()
        
        # 分析偏好科目
        subject_counts = {}
        for behavior in recent_behaviors:
            resource = db.query(Resource).filter(Resource.id == behavior.resource_id).first()
            if resource and resource.subject:
                subject_counts[resource.subject] = subject_counts.get(resource.subject, 0) + 1
        
        favorite_subjects = sorted(subject_counts.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'user_id': user_id,
            'education_level': user.education_level,
            'favorite_subjects': [s[0] for s in favorite_subjects[:3]],
            'total_behaviors': len(recent_behaviors),
            'level': user.level
        }
    
    def _calculate_score(self, resource: Resource, profile: dict, db: Session) -> float:
        """
        计算资源推荐分数
        
        综合评分 = 热度分 × 0.3 + 匹配分 × 0.5 + 新鲜度 × 0.2
        """
        # 1. 热度分（归一化到0-100）
        hotness_raw = (
            resource.views * 0.3 +
            resource.likes * 0.5 +
            resource.collects * 0.2
        )
        hotness_score = min(hotness_raw / 10, 100)  # 归一化
        
        # 2. 匹配分
        match_score = self._calculate_match_score(resource, profile, db)
        
        # 3. 新鲜度分（时间衰减）
        freshness_score = self._calculate_freshness_score(resource)
        
        # 综合得分
        final_score = (
            hotness_score * 0.3 +
            match_score * 0.5 +
            freshness_score * 0.2
        )
        
        return round(final_score, 2)
    
    def _calculate_match_score(self, resource: Resource, profile: dict, db: Session) -> float:
        """计算个性化匹配分数"""
        score = 0
        
        # 学段完全匹配 +50分
        if resource.education_level == profile['education_level']:
            score += 50
        
        # 科目偏好匹配 +30分
        if resource.subject in profile['favorite_subjects']:
            score += 30
        
        # 是否有历史相似资源互动 +20分
        has_similar = db.query(UserBehavior).join(Resource).filter(
            UserBehavior.user_id == profile['user_id'],
            Resource.subject == resource.subject,
            UserBehavior.action.in_(['点赞', '收藏'])
        ).count() > 0
        
        if has_similar:
            score += 20
        
        return min(score, 100)
    
    def _calculate_freshness_score(self, resource: Resource) -> float:
        """计算新鲜度分数（时间衰减）"""
        days_old = (datetime.now() - resource.created_at).days
        
        # 使用指数衰减，30天半衰期
        freshness = 100 * math.exp(-days_old / 30)
        
        return max(freshness, 0)
    
    def get_hot_resources(self, db: Session, limit: int = 10) -> List[Resource]:
        """
        获取热门资源（不考虑个性化）
        
        Args:
            db: 数据库会话
            limit: 返回数量
        
        Returns:
            热门资源列表
        """
        # 计算热度值并排序
        resources = db.query(Resource).all()
        
        hot_resources = []
        for resource in resources:
            hotness = (
                resource.views * 0.3 +
                resource.likes * 0.5 +
                resource.collects * 0.2
            )
            hot_resources.append((resource, hotness))
        
        hot_resources.sort(key=lambda x: x[1], reverse=True)
        
        return [r[0] for r in hot_resources[:limit]]

# 单例
recommend_service = RecommendService()
