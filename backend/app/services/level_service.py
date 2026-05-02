"""
============================================================
文件：backend/app/services/level_service.py
作用：双等级系统核心逻辑
  - 星途学阶：日常打卡轻松升级（升级快）
  - 知源贡献：发布资源才能升（升级明显更慢，难度+50%）
  - 自动检测升级、发放奖励
============================================================
"""
from sqlalchemy.orm import Session
from app.models.models import User
from typing import Tuple


# ============================================================
# 星途学阶经验配置（升级快，门槛低）
# Lv1→2: 需要100经验，Lv2→3: 需要200，...
# 每日打卡 + 自习计时就能轻松升
# ============================================================
STUDY_LEVEL_EXP = {
    1: 100,    # Lv1升Lv2需要100经验
    2: 200,    # Lv2升Lv3需要200经验
    3: 300,
    4: 450,
    5: 600,
    6: 800,
    7: 1000,
    8: 1300,
    9: 1700,
    10: 9999,  # 满级（不可继续升）
}

# ============================================================
# 知源贡献经验配置（升级明显更慢，比学阶高50%以上）
# 只有发布资源、被点赞收藏才能涨经验
# 普通登录打卡不涨贡献经验！
# ============================================================
CONTRIB_LEVEL_EXP = {
    1: 150,    # 比学阶多50%
    2: 320,
    3: 500,
    4: 720,
    5: 1000,
    6: 1350,
    7: 1750,
    8: 2200,
    9: 2800,
    10: 9999,  # 满级
}

# ============================================================
# 各行为获得的经验量
# ============================================================

# 星途学阶经验来源（日常行为）
STUDY_EXP_REWARDS = {
    'daily_login': 10,         # 每日登录 +10
    'study_30min': 20,         # 自习室专注30分钟 +20
    'study_60min': 50,         # 专注60分钟 +50
    'complete_plan_task': 30,  # 完成学习计划当日任务 +30
    'view_resource': 5,        # 浏览资源 +5
    'view_quote': 2,           # 查看语录 +2
}

# 知源贡献经验来源（必须发资源才有）
CONTRIB_EXP_REWARDS = {
    'publish_resource': 50,       # 发布资源 +50（基础）
    'resource_liked': 10,          # 资源被点赞 +10
    'resource_collected': 20,      # 资源被收藏 +20
    'resource_downloaded': 15,     # 资源被下载 +15
    'resource_recommended': 100,   # 资源被AI推荐到首页 +100（大额）
}


class LevelService:
    """等级服务类：处理经验增加、等级判断、升级检测"""

    def __init__(self, db: Session):
        self.db = db  # 数据库会话

    def add_study_exp(self, user_id: int, action: str) -> dict:
        """
        给用户增加星途学阶经验
        
        参数：
            user_id: 用户ID
            action: 行为类型（对应 STUDY_EXP_REWARDS 的key）
        
        返回：
            包含增加经验量、是否升级、新等级等信息的字典
        """
        # 获取该行为对应的经验量
        exp_gain = STUDY_EXP_REWARDS.get(action, 0)
        if exp_gain == 0:
            return {'success': False, 'message': f'未知行为类型: {action}'}

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {'success': False, 'message': '用户不存在'}

        # 叠加经验
        user.star_exp += exp_gain

        # 检查是否可以升级
        level_up, new_level = self._check_level_up(
            current_level=user.star_level,
            current_exp=user.star_exp,
            exp_table=STUDY_LEVEL_EXP
        )

        if level_up:
            user.star_level = new_level
            # 升级后经验从0开始（也可以选择扣除升级所需经验）
            # 这里选择清零（更简单，玩家体感更爽）
            user.star_exp = 0

        self.db.commit()

        return {
            'success': True,
            'exp_gained': exp_gain,
            'level_up': level_up,
            'new_level': user.star_level,
            'current_exp': user.star_exp,
            'next_level_exp': STUDY_LEVEL_EXP.get(user.star_level, 9999),
        }

    def add_contrib_exp(self, user_id: int, action: str) -> dict:
        """
        给用户增加知源贡献经验
        注意：只有发布资源相关行为才能涨贡献经验！
        
        参数：
            user_id: 用户ID
            action: 行为类型（对应 CONTRIB_EXP_REWARDS 的key）
        """
        exp_gain = CONTRIB_EXP_REWARDS.get(action, 0)
        if exp_gain == 0:
            return {'success': False, 'message': f'该行为不产生贡献经验'}

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {'success': False, 'message': '用户不存在'}

        user.contrib_exp += exp_gain

        level_up, new_level = self._check_level_up(
            current_level=user.contrib_level,
            current_exp=user.contrib_exp,
            exp_table=CONTRIB_LEVEL_EXP
        )

        if level_up:
            user.contrib_level = new_level
            user.contrib_exp = 0

        self.db.commit()

        return {
            'success': True,
            'exp_gained': exp_gain,
            'level_up': level_up,
            'new_level': user.contrib_level,
            'current_exp': user.contrib_exp,
            'next_level_exp': CONTRIB_LEVEL_EXP.get(user.contrib_level, 9999),
        }

    def _check_level_up(
        self,
        current_level: int,
        current_exp: int,
        exp_table: dict
    ) -> Tuple[bool, int]:
        """
        判断是否达到升级条件
        
        返回：(是否升级, 升级后的等级)
        """
        # 已满级（10级），不再升级
        if current_level >= 10:
            return False, current_level

        # 当前等级升级所需经验
        required_exp = exp_table.get(current_level, 9999)

        if current_exp >= required_exp:
            # 可以升级
            new_level = min(current_level + 1, 10)
            return True, new_level

        return False, current_level

    def get_user_levels(self, user_id: int) -> dict:
        """获取用户完整等级信息"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        return {
            # 星途学阶信息
            'star': {
                'level': user.star_level,
                'exp': user.star_exp,
                'next_level_exp': STUDY_LEVEL_EXP.get(user.star_level, 9999),
                'title': self._get_study_title(user.star_level),
            },
            # 知源贡献信息
            'contrib': {
                'level': user.contrib_level,
                'exp': user.contrib_exp,
                'next_level_exp': CONTRIB_LEVEL_EXP.get(user.contrib_level, 9999),
                'title': self._get_contrib_title(user.contrib_level),
            },
        }

    def _get_study_title(self, level: int) -> str:
        """
        星途学阶各级称号（与暖小圈品牌强关联）
        升级逻辑：用了记账/生理期/学习工具，像暖芽一点点生长
        """
        titles = {
            1:  '暖芽萌动',   # 刚注册，像小芽破土
            2:  '圈圈行者',   # 踏上暖圈之路
            3:  '晴心学伴',   # 记账/生理期/学习初体验
            4:  '暖意日积',   # 坚持打卡，暖意积累
            5:  '小圈达人',   # 三大工具用熟了
            6:  '暖光引路',   # 自己变好也引导别人
            7:  '圈中精英',   # 暖小圈核心用户
            8:  '暖圈先锋',   # 先锋探索者
            9:  '暖圈守望',   # 守护暖小圈社区
            10: '暖圈至尊',   # 无上荣耀
        }
        return titles.get(level, '暖芽萌动')

    def _get_contrib_title(self, level: int) -> str:
        """
        暖源贡献各级称号（与资源分享、帮助他人强关联）
        升级逻辑：在暖小圈分享资源，是"传递温暖"的象征
        """
        titles = {
            1:  '知芽初生',    # 第一次分享，知识的幼芽
            2:  '暖圈分享者',  # 开始分享，传递暖意
            3:  '资料小暖手',  # 分享了不少资料，别人受益
            4:  '暖心传递者',  # 传递温暖的使者
            5:  '圈中知灯',    # 在暖圈里发光，照亮求学路
            6:  '暖圈布道师',  # 积极传播好资源
            7:  '资源守护星',  # 守护知识质量的明星
            8:  '暖圈灯塔',    # 灯塔般指引迷茫的学习者
            9:  '暖源大师',    # 知识与温暖的来源
            10: '暖源至尊',    # 暖小圈知识贡献最高荣誉
        }
        return titles.get(level, '知芽初生')
