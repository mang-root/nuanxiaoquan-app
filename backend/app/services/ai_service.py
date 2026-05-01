"""
豆包AI服务 - 智能学习计划生成
"""
import json
import requests
from config.settings import settings
from typing import Dict, Any

class AIService:
    def __init__(self):
        self.access_key = settings.DOUBAO_ACCESS_KEY
        self.secret_key = settings.DOUBAO_SECRET_KEY
        self.endpoint = settings.DOUBAO_ENDPOINT
        self.model = settings.DOUBAO_MODEL
    
    def generate_study_plan(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成个性化学习计划
        
        Args:
            user_data: 用户数据
                - education_level: 学段
                - goal: 学习目标
                - duration: 计划时长(天)
                - daily_hours: 每日可用时间
                - strengths: 强项科目列表
                - weaknesses: 弱项科目列表
                - current_level: 当前基础
        
        Returns:
            AI生成的学习计划JSON
        """
        prompt = self._build_study_plan_prompt(user_data)
        
        response = self._call_doubao_api(prompt)
        
        return self._parse_study_plan(response)
    
    def _build_study_plan_prompt(self, data: Dict) -> str:
        """构建学习计划提示词"""
        strengths = ', '.join(data.get('strengths', []))
        weaknesses = ', '.join(data.get('weaknesses', []))
        
        return f"""你是一位专业的学习规划师，请为以下用户生成详细的学习计划。

**用户画像**
- 学段：{data['education_level']}
- 学习目标：{data['goal']}
- 计划时长：{data['duration']}天
- 每日可用时间：{data['daily_hours']}小时
- 强项科目：{strengths}
- 弱项科目：{weaknesses}
- 当前基础：{data.get('current_level', '中等')}

**要求**
1. 按周划分阶段，每周明确学习重点
2. 每天具体到科目和时间分配
3. 包含复习巩固环节
4. 根据强弱项调整学习比重（弱项多分配30%时间）
5. 设置阶段性检测点

请严格以JSON格式返回，不要有任何额外文字，结构如下：
{{
  "overall_goal": "总体目标描述",
  "phases": [
    {{
      "week": 1,
      "theme": "基础巩固周",
      "focus": "本周学习重点",
      "daily_tasks": [
        {{
          "day": 1,
          "date_label": "第1天",
          "subjects": [
            {{"name": "数学", "hours": 2, "content": "微积分基础", "type": "学习"}},
            {{"name": "英语", "hours": 1.5, "content": "单词背诵100个", "type": "记忆"}},
            {{"name": "复习", "hours": 0.5, "content": "回顾昨日内容", "type": "复习"}}
          ]
        }}
      ]
    }}
  ],
  "checkpoints": [
    {{"week": 2, "type": "阶段测试", "content": "第一章综合测试"}},
    {{"week": 4, "type": "模拟考试", "content": "月度模拟测试"}}
  ],
  "tips": [
    "每天早上复习前一天内容",
    "遇到难题及时标记，周末集中攻克"
  ]
}}"""
    
    def _call_doubao_api(self, prompt: str) -> str:
        """
        调用豆包API
        注意：这是示例代码，实际需要根据豆包SDK文档调整
        """
        url = f"https://{self.endpoint}/api/v1/chat"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一位专业的学习规划师，擅长为不同学段的学生制定高效学习计划。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 4000
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
        except Exception as e:
            print(f"豆包API调用失败: {e}")
            # 返回默认计划
            return self._get_default_plan()
    
    def _parse_study_plan(self, response: str) -> Dict[str, Any]:
        """解析AI返回的学习计划"""
        try:
            # 提取JSON部分
            start = response.find('{')
            end = response.rfind('}') + 1
            json_str = response[start:end]
            
            plan = json.loads(json_str)
            return plan
        except Exception as e:
            print(f"解析学习计划失败: {e}")
            return self._get_default_plan()
    
    def _get_default_plan(self) -> Dict[str, Any]:
        """返回默认学习计划模板"""
        return {
            "overall_goal": "系统性学习，稳步提升",
            "phases": [
                {
                    "week": 1,
                    "theme": "基础巩固周",
                    "focus": "夯实基础知识",
                    "daily_tasks": [
                        {
                            "day": i,
                            "date_label": f"第{i}天",
                            "subjects": [
                                {"name": "主科1", "hours": 2, "content": "基础知识学习", "type": "学习"},
                                {"name": "主科2", "hours": 1.5, "content": "练习巩固", "type": "练习"}
                            ]
                        }
                        for i in range(1, 8)
                    ]
                }
            ],
            "checkpoints": [
                {"week": 1, "type": "周测", "content": "本周知识点测试"}
            ],
            "tips": [
                "保持规律作息",
                "及时复习巩固"
            ]
        }
    
    def adjust_plan_by_progress(self, plan: Dict, completion_rate: float) -> Dict:
        """
        根据完成度调整学习计划
        
        Args:
            plan: 原计划
            completion_rate: 完成率 0-1
        
        Returns:
            调整后的计划
        """
        if completion_rate < 0.7:
            # 完成率低，降低难度
            suggestion = "建议放慢节奏，重点巩固基础"
        elif completion_rate > 0.9:
            # 完成率高，增加挑战
            suggestion = "进度良好，可以适当增加难度"
        else:
            suggestion = "保持当前节奏"
        
        plan['adjustment_suggestion'] = suggestion
        return plan

# 单例
ai_service = AIService()
