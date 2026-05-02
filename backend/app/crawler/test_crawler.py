"""
╔══════════════════════════════════════════════════════════════╗
║  爬虫独立测试脚本                                            ║
║                                                              ║
║  用途：在启动完整后端之前，单独测试爬虫是否能正常运行        ║
║                                                              ║
║  运行方法（在 backend 目录下）：                             ║
║    python app/crawler/test_crawler.py                        ║
║                                                              ║
║  会显示：                                                    ║
║    - 每个爬虫函数的执行结果                                  ║
║    - 抓取到的条数                                            ║
║    - 第一条数据预览                                          ║
║    - 报错信息（方便调试）                                    ║
╚══════════════════════════════════════════════════════════════╝
"""
import sys
import os
import time

# 把 backend 目录加到 Python 路径（这样才能 import crawler）
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.crawler.crawler import WarmCircleCrawler


def test_quote_crawler():
    """测试语录爬虫"""
    print("\n" + "─" * 50)
    print("📖 测试语录爬虫...")
    print("─" * 50)

    crawler = WarmCircleCrawler()

    # 只测试第一个语录来源（避免测试太长）
    try:
        start = time.time()
        quotes = crawler._crawl_quotes_source1()  # 内置的第一个语录源
        elapsed = time.time() - start

        if quotes:
            print(f"✅ 爬取成功！共 {len(quotes)} 条，耗时 {elapsed:.2f}秒")
            print(f"   第一条预览：{quotes[0].get('content', '')[:50]}...")
            print(f"   作者：{quotes[0].get('author', '未知')}")
        else:
            print("⚠️ 爬取成功但没有数据（可能网站改版了，需要更新选择器）")
    except Exception as e:
        print(f"❌ 爬取失败：{e}")
        print("   提示：检查网络连接，或者网站 URL 是否正确")


def test_custom_url():
    """测试用户自定义填写的网站（如果有的话）"""
    print("\n" + "─" * 50)
    print("🌐 测试自定义网站爬虫...")
    print("─" * 50)

    # 读取 crawler.py 文件，检查用户是否填了自定义 URL
    crawler_file = os.path.join(os.path.dirname(__file__), "crawler.py")
    with open(crawler_file, "r", encoding="utf-8") as f:
        content = f.read()

    if "【留空 - 请填写合法网站】" in content:
        print("⚠️  你还没有填写自定义爬虫网站！")
        print("   打开 backend/app/crawler/crawler.py")
        print("   找到【留空 - 请填写合法网站】注释，按模板填入 URL")
    else:
        print("✅ 检测到已填写自定义 URL，尝试爬取...")
        try:
            crawler = WarmCircleCrawler()
            results = crawler._crawl_website2()
            if results:
                print(f"✅ 爬取成功！共 {len(results)} 条")
                print(f"   第一条：{str(results[0])[:80]}")
            else:
                print("⚠️ 没有数据，检查 HTML 选择器是否正确")
        except Exception as e:
            print(f"❌ 爬取失败：{e}")


def test_network():
    """测试网络连接"""
    print("\n" + "─" * 50)
    print("🔗 测试基础网络连接...")
    print("─" * 50)

    import requests
    test_urls = [
        ("百度", "https://www.baidu.com"),
        ("知乎", "https://www.zhihu.com"),
    ]

    for name, url in test_urls:
        try:
            resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            print(f"✅ {name}：连接正常（状态码 {resp.status_code}）")
        except Exception as e:
            print(f"❌ {name}：连接失败 → {e}")


def main():
    print("=" * 50)
    print("暖小圈爬虫独立测试工具")
    print("=" * 50)

    # 1. 先测网络
    test_network()

    # 2. 再测爬虫
    test_quote_crawler()

    # 3. 测试自定义 URL
    test_custom_url()

    print("\n" + "=" * 50)
    print("测试完成！")
    print("如果都是 ✅ 说明爬虫正常，可以正式启动后端。")
    print("如果有 ❌ 请根据提示修复后再重新测试。")
    print("=" * 50)


if __name__ == "__main__":
    main()
