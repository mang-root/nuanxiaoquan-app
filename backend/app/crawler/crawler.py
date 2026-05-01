"""
自动化爬虫系统 - 每日语录和学习资源
"""
import requests
from bs4 import BeautifulSoup
import schedule
import time
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import DailyQuote, Resource
from app.utils.database import SessionLocal
import random

class QuoteCrawler:
    """每日语录爬虫"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def crawl_quotes(self):
        """爬取每日语录"""
        db = SessionLocal()
        try:
            print(f"[{datetime.now()}] 开始爬取每日语录...")
            
            # 方法1：从预设语录库随机选择（备用方案）
            quotes = self._get_preset_quotes()
            
            # 方法2：爬取知乎（需要注意反爬虫）
            # zhihu_quotes = self._crawl_zhihu()
            # quotes.extend(zhihu_quotes)
            
            # 存入数据库
            for quote_data in quotes:
                existing = db.query(DailyQuote).filter(
                    DailyQuote.content == quote_data['content']
                ).first()
                
                if not existing:
                    quote = DailyQuote(**quote_data)
                    db.add(quote)
            
            db.commit()
            print(f"成功添加 {len(quotes)} 条语录")
            
        except Exception as e:
            print(f"爬取语录失败: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _get_preset_quotes(self):
        """预设语录库"""
        quotes = [
            {
                'content': '成功不是将来才有的，而是从决定去做的那一刻起，持续累积而成。',
                'author': '佚名',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '学习这件事不在乎有没有人教你，最重要的是在于你自己有没有觉悟和恒心。',
                'author': '法布尔',
                'category': '学习',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '今天不走，明天要跑。',
                'author': '哈佛校训',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '只有比别人更早、更勤奋地努力，才能尝到成功的滋味。',
                'author': '佚名',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '学习的敌人是自己的满足，要认真学习一点东西，必须从不自满开始。',
                'author': '毛泽东',
                'category': '学习',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '天才就是无止境刻苦勤奋的能力。',
                'author': '卡莱尔',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '你的努力，别人不一定放在眼里，你不努力，别人一定放在心里。',
                'author': '佚名',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            },
            {
                'content': '没有谁的幸运，凭空而来，只有当你足够努力，你才会足够幸运。',
                'author': '佚名',
                'category': '励志',
                'source': '内置语录库',
                'crawl_time': datetime.now()
            }
        ]
        
        # 随机选择3-5条
        return random.sample(quotes, min(5, len(quotes)))
    
    def _crawl_zhihu(self):
        """
        爬取知乎（示例，需要根据实际情况调整）
        注意：需要处理反爬虫、登录验证等问题
        """
        try:
            # 这里是示例代码，实际需要更复杂的处理
            url = 'https://www.zhihu.com/hot'
            response = requests.get(url, headers=self.headers, timeout=10)
            
            # 解析内容...
            # 实际项目中建议使用官方API或合法的数据源
            
            return []
        except:
            return []
    
    def get_today_quote(self, db: Session):
        """获取今日语录"""
        today = datetime.now().date()
        
        # 检查今天是否已有语录
        quote = db.query(DailyQuote).filter(
            DailyQuote.show_date == today
        ).first()
        
        if quote:
            return quote
        
        # 随机选择一条未展示的语录
        quote = db.query(DailyQuote).filter(
            DailyQuote.is_shown == False
        ).order_by(DailyQuote.id).first()
        
        if not quote:
            # 如果没有未展示的，重置所有语录
            db.query(DailyQuote).update({DailyQuote.is_shown: False})
            db.commit()
            quote = db.query(DailyQuote).first()
        
        if quote:
            quote.is_shown = True
            quote.show_date = today
            db.commit()
        
        return quote


class ResourceCrawler:
    """学习资源爬虫"""
    
    def crawl_resources(self):
        """爬取学习资源"""
        db = SessionLocal()
        try:
            print(f"[{datetime.now()}] 开始爬取学习资源...")
            
            # 这里是示例，实际需要对接合法的资源API
            # 可以对接：
            # 1. B站API - 获取优质课程视频
            # 2. 公开的学习资料网站
            # 3. 教育类公众号API
            
            resources = self._get_preset_resources()
            
            for resource_data in resources:
                existing = db.query(Resource).filter(
                    Resource.title == resource_data['title']
                ).first()
                
                if not existing:
                    resource = Resource(**resource_data)
                    db.add(resource)
            
            db.commit()
            print(f"成功添加 {len(resources)} 条资源")
            
        except Exception as e:
            print(f"爬取资源失败: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _get_preset_resources(self):
        """预设资源库"""
        return [
            {
                'type': '官方爬虫',
                'title': '高考数学必考知识点总结',
                'description': '涵盖高考数学所有重点知识点，含公式和例题',
                'file_url': 'https://example.com/math.pdf',
                'file_type': 'PDF',
                'education_level': '高中',
                'subject': '数学',
                'tags': ['高考', '数学', '知识点'],
                'created_at': datetime.now()
            },
            {
                'type': '官方爬虫',
                'title': '考研英语词汇5500',
                'description': '考研英语大纲词汇，带音标和例句',
                'file_url': 'https://example.com/english.pdf',
                'file_type': 'PDF',
                'education_level': '考研',
                'subject': '英语',
                'tags': ['考研', '英语', '词汇'],
                'created_at': datetime.now()
            }
        ]


def start_crawler_scheduler():
    """启动定时任务"""
    quote_crawler = QuoteCrawler()
    resource_crawler = ResourceCrawler()
    
    # 每天8:00爬取每日语录
    schedule.every().day.at("08:00").do(quote_crawler.crawl_quotes)
    
    # 每周一凌晨2:00爬取学习资源
    schedule.every().monday.at("02:00").do(resource_crawler.crawl_resources)
    
    print("爬虫调度器已启动")
    
    while True:
        schedule.run_pending()
        time.sleep(60)


# 导出
quote_crawler = QuoteCrawler()
resource_crawler = ResourceCrawler()
