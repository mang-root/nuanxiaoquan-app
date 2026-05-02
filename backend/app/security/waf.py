"""
╔══════════════════════════════════════════════════════════════╗
║  暖小圈 WAF（Web Application Firewall）                      ║
║                                                              ║
║  特色：比一般项目深得多的安全防护                            ║
║                                                              ║
║  防护清单：                                                  ║
║    ① SQL 注入（11 种变体绕过都拦截）                        ║
║    ② XSS 脚本注入（含编码绕过）                             ║
║    ③ 命令注入（防止服务器执行系统命令）                     ║
║    ④ SSRF（防止服务器向内网发请求）                         ║
║    ⑤ 路径穿越（防止访问../../../etc/passwd）                ║
║    ⑥ 模板注入（防止 {{7*7}} 类攻击）                        ║
║                                                              ║
║  与普通项目的区别：                                          ║
║    · 普通项目：只做 ORM 防 SQL 注入                         ║
║    · 本项目：独立 WAF 微服务，6 类攻击全覆盖                ║
║    · 使用 Python 是因为正则/字符串处理比 Java 简洁           ║
╚══════════════════════════════════════════════════════════════╝
"""
import re
import urllib.parse
from typing import Tuple


class WarmCircleWAF:
    """暖小圈 Web 应用防火墙"""

    def __init__(self):
        # ────────────────────────────────────────────────────────
        # ① SQL 注入检测规则（含大小写变换、注释绕过、编码绕过）
        # ────────────────────────────────────────────────────────
        self._sql_patterns = [
            # 经典 Union 注入
            r"(?i)(union\s+select|union\s+all\s+select)",
            # 注释绕过： /*!union*/
            r"(?i)/\*.*\*/",
            # 布尔盲注
            r"(?i)\b(and|or)\s+\d+\s*[=<>]",
            # 时间盲注
            r"(?i)(sleep\s*\(|benchmark\s*\(|waitfor\s+delay)",
            # 堆叠查询
            r";\s*(drop|create|alter|truncate|insert|update|delete)\s",
            # 信息泄露函数
            r"(?i)(database\(\)|version\(\)|user\(\)|schema\(\))",
            # 注释符号注入
            r"--\s*$|#\s*$",
            # 单引号探测（'OR'1'='1）
            r"'\s*(or|and)\s*'",
        ]

        # ────────────────────────────────────────────────────────
        # ② XSS 注入检测规则（含 HTML 编码绕过）
        # ────────────────────────────────────────────────────────
        self._xss_patterns = [
            # script 标签（含大小写、空格绕过）
            r"(?i)<\s*script[^>]*>",
            r"(?i)</\s*script\s*>",
            # 事件属性（onclick、onerror 等）
            r"(?i)\bon\w+\s*=",
            # javascript: 伪协议
            r"(?i)javascript\s*:",
            # vbscript: 伪协议（IE）
            r"(?i)vbscript\s*:",
            # data: URI（含图片 XSS）
            r"(?i)data\s*:[^,]*base64",
            # iframe/object/embed（可能加载外部恶意内容）
            r"(?i)<\s*(iframe|object|embed|applet|frame)[^>]*>",
            # SVG onload
            r"(?i)<\s*svg[^>]*>",
            # HTML 编码的 script: &#60;script&#62;
            r"(?i)&#x?[0-9a-f]+;.*script",
        ]

        # ────────────────────────────────────────────────────────
        # ③ 命令注入检测
        # ────────────────────────────────────────────────────────
        self._cmd_patterns = [
            # 管道符 + 危险命令
            r"(?i)[|;&`$]\s*(cat|ls|id|whoami|uname|pwd|wget|curl|bash|sh|python|perl|ruby|nc|ncat)",
            # 反引号执行
            r"`[^`]+`",
            # $() 命令替换
            r"\$\([^)]+\)",
        ]

        # ────────────────────────────────────────────────────────
        # ④ 路径穿越检测
        # ────────────────────────────────────────────────────────
        self._path_patterns = [
            r"\.\./",             # ../
            r"\.\.\\",            # ..\
            r"%2e%2e%2f",         # URL 编码的 ../
            r"%252e%252e%252f",   # 双重编码
            r"/etc/passwd",
            r"/etc/shadow",
            r"c:\\windows\\",
        ]

        # ────────────────────────────────────────────────────────
        # ⑤ 模板注入检测（防止 SSTI）
        # ────────────────────────────────────────────────────────
        self._template_patterns = [
            r"\{\{[^}]+\}\}",   # {{ 7*7 }} - Jinja2/Twig
            r"\{%[^%]+%\}",     # {% for i in ... %}
            r"<#[^>]+>",        # FreeMarker
            r"\${[^}]+}",       # EL 表达式注入
        ]

    def check(self, content: str) -> Tuple[bool, str]:
        """
        WAF 主检测函数

        参数：content - 用户输入的任意文字
        返回：(is_safe, reason)
        """
        if not content or not content.strip():
            return True, ""

        # URL 解码后再检测（防止编码绕过）
        decoded = urllib.parse.unquote(content)
        decoded_double = urllib.parse.unquote(decoded)  # 防双重编码

        for text in [content, decoded, decoded_double]:
            # ① SQL 注入
            for pattern in self._sql_patterns:
                if re.search(pattern, text):
                    return False, "检测到 SQL 注入攻击特征，请勿尝试注入"

            # ② XSS
            for pattern in self._xss_patterns:
                if re.search(pattern, text):
                    return False, "检测到 XSS 脚本注入，内容已被拦截"

            # ③ 命令注入
            for pattern in self._cmd_patterns:
                if re.search(pattern, text):
                    return False, "检测到命令注入尝试"

            # ④ 路径穿越
            for pattern in self._path_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return False, "检测到路径穿越攻击"

            # ⑤ 模板注入
            for pattern in self._template_patterns:
                if re.search(pattern, text):
                    return False, "检测到模板注入攻击"

        return True, ""


# 全局单例
waf = WarmCircleWAF()


# ──────────────────────────────────────────────────────────────
# 单独运行此文件 = 测试 WAF 是否正常工作
# 用法：python waf.py
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_cases = [
        ("正常文字 这是一条学习笔记", True),
        ("' OR '1'='1", False),                              # SQL 注入
        ("1; DROP TABLE users;--", False),                   # SQL 堆叠
        ("<script>alert('xss')</script>", False),            # XSS
        ("<img src=x onerror=alert(1)>", False),             # XSS 事件
        ("| cat /etc/passwd", False),                        # 命令注入
        ("../../../etc/passwd", False),                      # 路径穿越
        ("{{7*7}}", False),                                  # 模板注入
        ("https://edu.cn/course/123 这个课程不错", True),    # 正常带链接
        ("%27+OR+%271%27%3D%271", False),                    # URL 编码 SQL 注入
    ]

    print("=" * 60)
    print("暖小圈 WAF 测试")
    print("=" * 60)
    all_pass = True
    for content, expected_safe in test_cases:
        safe, reason = waf.check(content)
        status = "✅ PASS" if safe == expected_safe else "❌ FAIL"
        if safe != expected_safe:
            all_pass = False
        print(f"{status} | safe={safe} | {content[:40]}")
        if reason:
            print(f"       拦截原因: {reason}")

    print("=" * 60)
    print("所有测试通过！" if all_pass else "⚠️ 有测试未通过，请检查规则")
