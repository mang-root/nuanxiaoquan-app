# 暖小圈 APP v2.0 开发文档

> 专为小白准备，每一步都有说明，照着做就行 ✨

---

## 📋 目录

1. [项目结构说明](#项目结构)
2. [环境安装（一次性操作）](#环境安装)
3. [配置说明](#配置说明)
4. [爬虫网站配置（你自己填）](#爬虫网站配置)
5. [运行步骤](#运行步骤)
6. [主要改动说明（相比v1）](#主要改动)
7. [双等级体系说明](#双等级)
8. [AI小暖配置](#AI小暖)
9. [常见报错解决](#常见报错)

---

## 项目结构

```
warmcircle_v2/
├── frontend/                    ← Flutter 前端
│   ├── lib/
│   │   ├── main.dart           ← 程序入口（从这里启动）
│   │   ├── controllers/
│   │   │   └── app_controller.dart  ← 全局状态管理
│   │   ├── screens/            ← 所有页面
│   │   │   ├── splash_screen.dart   开屏动画
│   │   │   ├── login_screen.dart    登录页
│   │   │   ├── main_screen.dart     主框架（4个Tab）
│   │   │   ├── home_screen.dart     首页
│   │   │   ├── study_room_screen.dart  自习室
│   │   │   ├── knowledge_screen.dart   知识小馆
│   │   │   └── mine_screen.dart     我的
│   │   ├── widgets/            ← 可复用组件
│   │   │   ├── ai_float_button.dart 小暖悬浮按钮
│   │   │   ├── level_badge.dart     等级徽章
│   │   │   ├── quote_card.dart      语录卡片
│   │   │   ├── resource_card.dart   资源卡片
│   │   │   └── study_plan_card.dart 计划卡片
│   │   ├── services/
│   │   │   └── api_service.dart     和后端通信
│   │   └── themes/
│   │       └── app_themes.dart      5种主题配置
│   └── pubspec.yaml            ← 依赖包配置
│
└── backend/                    ← Python 后端
    ├── app/
    │   ├── api/                ← 接口路由
    │   ├── models/
    │   │   └── models.py       ← 数据库表结构
    │   ├── services/
    │   │   ├── level_service.py    双等级逻辑
    │   │   ├── ai_service.py       小暖AI服务
    │   │   └── recommend_service.py 推荐算法
    │   ├── crawler/
    │   │   └── crawler.py      ← 爬虫（网站你自己填！）
    │   └── utils/
    ├── config/
    │   └── settings.py         ← 所有配置（改这里！）
    ├── main.py                 ← 后端启动入口
    └── requirements.txt        ← Python依赖列表
```

---

## 环境安装

### 后端环境（Python）

```bash
# 1. 确认Python版本（需要3.9+）
python --version

# 2. 进入后端目录
cd backend

# 3. 创建虚拟环境（推荐，避免包冲突）
python -m venv venv

# 4. 激活虚拟环境
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 5. 安装依赖
pip install -r requirements.txt

# 6. 初始化数据库（先启动MySQL，再执行）
mysql -u root -p < ../database/schema.sql
```

### 前端环境（Flutter）

```bash
# 1. 确认Flutter安装
flutter --version  # 需要3.0+

# 2. 进入前端目录
cd frontend

# 3. 下载依赖包（国内网络慢的话配置镜像，见下方）
flutter pub get

# 4. 检查环境问题
flutter doctor
```

**Flutter国内镜像配置**（网络慢必做）：
```bash
# 在 .bashrc 或 .zshrc 里加这两行，然后重启终端
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

---

## 配置说明

### 修改 `backend/config/settings.py`

```python
# ===================== 必须改的 =====================

# 数据库（用你自己的MySQL账号密码）
MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = "你的数据库密码"   # ← 改这里
MYSQL_DATABASE = "warmcircle"

# 豆包AI（去火山引擎控制台获取）
DOUBAO_ACCESS_KEY = "你的AK"   # ← 改这里
DOUBAO_SECRET_KEY = "你的SK"   # ← 改这里

# JWT密钥（随便写一串复杂字符，用于加密token）
SECRET_KEY = "随机字符串比如WarmCircle2024XYZ"  # ← 改这里

# ===================== 可选（有条件再配）=====================

# 阿里云OSS（用户上传图片/文件必须配置）
OSS_ACCESS_KEY_ID = "你的OSS_AK"
OSS_ACCESS_KEY_SECRET = "你的OSS_SK"
OSS_BUCKET_NAME = "warmcircle"

# 腾讯云短信（手机号验证码登录必须配置）
TENCENT_SECRET_ID = "你的ID"
TENCENT_SECRET_KEY = "你的KEY"
```

### 修改 `frontend/lib/services/api_service.dart`

```dart
// 把这一行改成你的后端服务器IP
String baseUrl = 'http://你的服务器IP:8000/api';

// 本地开发时用：
String baseUrl = 'http://localhost:8000/api';
// 或（安卓模拟器访问电脑localhost用这个IP）：
String baseUrl = 'http://10.0.2.2:8000/api';
```

---

## 爬虫网站配置

> ⚠️ **重要：爬虫网站全部留空，请自己找中国合法网站！**

打开 `backend/app/crawler/crawler.py`，找到带注释 `【留空 - 请填写合法网站】` 的位置，按照模板填写。

**找合法爬虫网站的建议：**
1. 优先找有开放API的网站（不用爬HTML，更稳定）
2. 找robots.txt里允许爬取的网站
3. 可爬取对象参考：政府/学校公开资料、有授权的学习资源平台

**填写模板（照着改就行）：**
```python
def _crawl_website2(self):
    url = 'https://你找到的网站URL'
    response = requests.get(url, headers=self.headers, timeout=10)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 根据网站HTML结构，找到语录所在的标签
    # 方法：浏览器F12 → 右键点语录内容 → 选"检查" → 看标签
    items = soup.find_all('你的标签', class_='你的class名')
    for item in items:
        quotes.append({
            'content': item.text.strip(),
            'author': '来源网站名',
            'category': '励志',
            'source': '网站2',
            'crawl_time': datetime.now()
        })
```

---

## 运行步骤

### 启动后端

```bash
cd backend
python main.py
# 看到 "Application startup complete" 说明成功
# 访问 http://localhost:8000/docs 查看接口文档
```

### 启动前端（开发模式）

```bash
cd frontend

# 连接手机或开启模拟器，然后运行：
flutter run

# 指定设备运行：
flutter devices       # 查看可用设备
flutter run -d 设备ID  # 指定设备
```

### 启动爬虫（可选）

```bash
cd backend
python -c "from app.crawler.crawler import start_crawler_scheduler; start_crawler_scheduler()"
# 后台挂着跑，会按时间自动爬取
```

---

## 主要改动（相比v1版本的zip）

### Tab结构变化

| v1（zip版本） | v2（文档方案） |
|------------|------------|
| 首页 | 首页 ✅ |
| 自习室 | 自习室 ✅ |
| **知时** | **知识小馆** ← 改名且合并 |
| **小馆** | ~~去掉~~ |
| ~~没有~~ | **我的** ← 新增 |

**记账、生理期、备忘录的位置变化：**
- v1：知时Tab里
- v2：收纳进「我的」页面的子入口（不占主Tab）

### 等级系统变化

- v1：单等级（level字段）
- v2：双等级 → 星途学阶 + 知源贡献（两个独立系统）
- 等级显示：不用dock样式，用徽章横排显示（见 `level_badge.dart`）

### 生理期隐藏逻辑

- v1：直接显示入口
- v2：仅用户在「我的」设置性别为女性后才解锁入口，男性全程看不到

### AI命名变化

- v1：豆包AI
- v2：**小暖**（不显示豆包品牌，仅小字注明技术支持）

---

## 双等级体系说明

### 星途学阶（升级快）

**获取经验的行为：**
- 每日登录：+10经验
- 自习室专注30分钟：+20经验
- 自习室专注60分钟：+50经验
- 完成当日学习任务：+30经验
- 浏览资源：+5经验
- 查看语录：+2经验

**升级所需经验（线性增长，门槛低）：**
```
Lv1→2: 100经验     Lv2→3: 200经验
Lv3→4: 300经验     Lv4→5: 450经验
Lv5→6: 600经验     Lv6→7: 800经验
Lv7→8: 1000经验    Lv8→9: 1300经验
Lv9→10: 1700经验   满级Lv10
```

### 知源贡献（升级明显更慢）

**获取经验的行为（只有发资源才有！）：**
- 发布资源：+50经验
- 资源被点赞：+10经验
- 资源被收藏：+20经验
- 资源被下载：+15经验
- 资源被AI推荐到首页：+100经验

**升级所需经验（比学阶高50%）：**
```
Lv1→2: 150经验     Lv2→3: 320经验
Lv3→4: 500经验     Lv4→5: 720经验
Lv5→6: 1000经验    Lv6→7: 1350经验
Lv7→8: 1750经验    Lv8→9: 2200经验
Lv9→10: 2800经验   满级Lv10
```

**设计逻辑：** 普通用户靠打卡轻松升学阶，满足日常成就感；愿意分享资源的用户肝贡献等级，等级越高越稀有，有专属优越感，激励主动贡献内容。

---

## AI小暖配置

小暖是豆包AI的专属改造版，在后端配置人设：

```python
# backend/app/services/ai_service.py

XIAONAN_SYSTEM_PROMPT = """
你是暖小圈APP的专属AI助手，名字叫小暖。

【人设要求】
- 温柔、自信、治愈，贴合学生视角
- 文案有温度，不无聊不机械，有共情感
- 禁止闲聊，只做工具：学习计划/语录/资源分析/备忘录整理

【禁止行为】
- 不主动提及生理期、女性向内容
- 不使用套话空话（"好的！""明白了！"等）
- 不用冰冷的机器语气

【允许的服务】
1. 生成个性化学习计划
2. 创作励志语录（温柔治愈风）
3. 分析资源热度
4. 整理备忘录文案
5. 记账数据分析

请始终保持小暖的人设，有温度地服务用户。
"""
```

---

## 常见报错解决

### Flutter 编译报错

```bash
# 1. 清理缓存重来
flutter clean
flutter pub get
flutter run

# 2. 如果还报错，检查Flutter版本
flutter upgrade
```

### 后端连接数据库失败

```
错误：Can't connect to MySQL server
解决：
1. 确认MySQL服务已启动
2. 检查 settings.py 里的密码是否正确
3. 确认 warmcircle 数据库已创建
```

### pip install 失败

```bash
# 换国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 安卓模拟器连不上本地后端

```dart
// 安卓模拟器里访问电脑localhost要用这个IP
String baseUrl = 'http://10.0.2.2:8000/api';
// 真机调试用电脑实际局域网IP，如：
String baseUrl = 'http://192.168.1.100:8000/api';
```

---

## 📮 联系方式

- 项目邮箱：待补充
- 如遇问题：检查文档 → 搜索报错信息 → 提交Issue

---

*祝你开发顺利！有不懂的地方代码注释里都有详细说明 🌟*
