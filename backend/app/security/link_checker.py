"""
════════════════════════════════════════════════════════════
文件：backend/app/security/link_checker.py
作用：链接与内容安全检测模块（网络安全核心亮点）
功能：
  1. 三层检测：格式校验 + 黑名单 + 白名单
  2. 防止用户分享违规链接、恶意网址
  3. 敏感词过滤
  4. 杜绝漏判
════════════════════════════════════════════════════════════
"""
import re
from typing import Tuple
from urllib.parse import urlparse


class LinkSecurityChecker:
    """链接与内容安全检测器"""

    def __init__(self):
        # ════════════════════════════════════════════════════════
        # 黑名单配置（你可以自己补充）
        # ════════════════════════════════════════════════════════
        
        # 敏感关键词黑名单（文字里不能包含这些词）
        self.sensitive_keywords = [
            # === 违法违规类 ===
            '赌博', '博彩', '六合彩', '彩票', '赛车',
            '色情', '黄色', '成人', 'porn', 'sex',
            '诈骗', '刷单', '兼职日结', '代考', '代写',
            '翻墙', 'vpn', '梯子', 'ss', 'ssr',
            '毒品', '大麻', '海洛因',
            
            # === 敏感政治类（根据需要调整）===
            # 这里可以添加不希望出现的政治敏感词
            
            # === 广告垃圾类 ===
            '加微信', '点击领取', '免费送', '中奖',
            '加QQ群', '代理招募', '躺赚', '日入过万',
        ]

        # 黑名单域名（绝对不允许分享的网站）
        self.blacklist_domains = [
            # === 境外社交平台 ===
            'facebook.com', 'twitter.com', 'instagram.com',
            'youtube.com', 'tiktok.com', 'telegram.org',
            
            # === 已知违规网站（示例，你自己补充）===
            'example-bad-site.com',
            
            # === 短链服务（容易被滥用跳转）===
            'bit.ly', 't.cn', 'tinyurl.com',
            
            # ⚠️ 注意：这里只是示例，实际使用时你需要：
            # 1. 根据实际情况补充真实的违规域名
            # 2. 定期更新黑名单
            # 3. 可以对接第三方黑名单库API（如腾讯云、阿里云的URL检测）
        ]

        # ════════════════════════════════════════════════════════
        # 白名单配置（允许分享的安全网站）
        # ════════════════════════════════════════════════════════
        self.whitelist_domains = [
            # === 学习平台 ===
            'xuexitong.com',      # 学习通
            'icourse163.org',     # 中国大学MOOC
            'edu.cn',             # 所有.edu.cn学校域名
            
            # === 工具网站 ===
            'baidu.com', 'bing.com',  # 搜索引擎
            'github.com',             # 代码仓库
            'zhihu.com',              # 知乎（学习问答）
            'csdn.net',               # CSDN（技术文章）
            
            # === 官方网站 ===
            'gov.cn',             # 政府网站
            
            # ⚠️ 你可以根据需要补充更多安全域名
            # 白名单策略：宁可严格（少加），也不要太宽松
        ]

    # ════════════════════════════════════════════════════════════
    # 主检测函数：检查用户输入的文字或链接是否安全
    # ════════════════════════════════════════════════════════════
    def check_content(self, content: str) -> Tuple[bool, str]:
        """
        检测用户输入内容是否安全
        
        参数：
            content: 用户输入的文字（可能包含链接）
        
        返回：
            (是否安全, 拦截原因)
            - (True, "") = 安全，允许发送
            - (False, "原因") = 不安全，拦截并显示原因
        """
        if not content or not content.strip():
            return True, ""  # 空内容直接放行

        content = content.strip()

        # ════════════════════════════════════════════════════════
        # 第一层检测：敏感词过滤
        # ════════════════════════════════════════════════════════
        for keyword in self.sensitive_keywords:
            if keyword.lower() in content.lower():
                return False, f"内容包含敏感词"{keyword}"，禁止发送"

        # ════════════════════════════════════════════════════════
        # 第二层检测：提取所有链接并逐个检查
        # ════════════════════════════════════════════════════════
        urls = self._extract_urls(content)
        
        for url in urls:
            is_safe, reason = self._check_single_url(url)
            if not is_safe:
                return False, reason

        # 通过所有检测
        return True, ""

    # ════════════════════════════════════════════════════════════
    # 提取文字中的所有URL
    # ════════════════════════════════════════════════════════════
    def _extract_urls(self, text: str) -> list:
        """
        从文字中提取所有URL（http/https开头的链接）
        """
        # 正则表达式匹配 http:// 或 https:// 开头的链接
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text, re.IGNORECASE)
        return urls

    # ════════════════════════════════════════════════════════════
    # 检查单个URL是否安全（核心三层检测）
    # ════════════════════════════════════════════════════════════
    def _check_single_url(self, url: str) -> Tuple[bool, str]:
        """
        检查单个URL是否安全
        
        三层检测：
          1. 格式检测：检查是否为标准http/https链接
          2. 黑名单检测：域名是否在黑名单中
          3. 白名单检测：不在白名单的陌生链接一律拦截
        """
        try:
            # 解析URL（提取域名）
            parsed = urlparse(url)
            domain = parsed.netloc.lower()  # 获取域名，转小写
            
            # 去掉 www. 前缀（统一处理）
            if domain.startswith('www.'):
                domain = domain[4:]

            # ──────────────────────────────────────────────────
            # 第一层：格式检测
            # ──────────────────────────────────────────────────
            if not parsed.scheme in ['http', 'https']:
                return False, "链接格式不合法，仅支持http/https"

            # 检测超长URL（可能是加密跳转链接）
            if len(url) > 500:
                return False, "链接过长，疑似加密跳转链接"

            # ──────────────────────────────────────────────────
            # 第二层：黑名单检测
            # ──────────────────────────────────────────────────
            for blacklist_domain in self.blacklist_domains:
                if blacklist_domain in domain:
                    return False, f"禁止分享来自 {blacklist_domain} 的链接"

            # ──────────────────────────────────────────────────
            # 第三层：白名单检测
            # ──────────────────────────────────────────────────
            # 检查域名是否在白名单中
            is_whitelisted = False
            for whitelist_domain in self.whitelist_domains:
                if domain.endswith(whitelist_domain):
                    is_whitelisted = True
                    break

            if not is_whitelisted:
                # 不在白名单，拦截
                return False, f"暂不支持分享来自 {domain} 的链接，请确保链接来自学习相关网站"

            # 通过所有检测
            return True, ""

        except Exception as e:
            # URL解析失败，说明格式有问题
            print(f"URL解析失败: {url}, 错误: {e}")
            return False, "链接格式错误"

    # ════════════════════════════════════════════════════════════
    # 过滤HTML特殊字符（防XSS注入）
    # ════════════════════════════════════════════════════════════
    def sanitize_html(self, text: str) -> str:
        """
        过滤HTML特殊字符，防止XSS脚本注入
        
        例如：把 <script> 转义成 &lt;script&gt;
        """
        if not text:
            return ""
        
        # 替换HTML特殊字符
        replacements = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;',
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text


# ════════════════════════════════════════════════════════════
# 单例实例（其他模块直接 import 使用）
# ════════════════════════════════════════════════════════════
link_checker = LinkSecurityChecker()


# ════════════════════════════════════════════════════════════
# 使用示例（在API接口里调用）
# ════════════════════════════════════════════════════════════
if __name__ == "__main__":
    # 测试用例
    checker = LinkSecurityChecker()
    
    # 测试1：正常学习链接
    is_safe, reason = checker.check_content("这是MOOC课程 https://icourse163.org/course/123")
    print(f"测试1: {is_safe}, 原因: {reason}")  # 应该通过
    
    # 测试2：敏感词
    is_safe, reason = checker.check_content("来加微信吧，免费送资料")
    print(f"测试2: {is_safe}, 原因: {reason}")  # 应该拦截
    
    # 测试3：黑名单域名
    is_safe, reason = checker.check_content("https://facebook.com/xxx")
    print(f"测试3: {is_safe}, 原因: {reason}")  # 应该拦截
    
    # 测试4：不在白名单的陌生域名
    is_safe, reason = checker.check_content("https://unknown-site.com/page")
    print(f"测试4: {is_safe}, 原因: {reason}")  # 应该拦截
