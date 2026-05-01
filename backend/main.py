"""
暖小圈APP - 后端主入口
FastAPI + MySQL + Redis
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, user, study_plan, resource, accounting, menstrual, badge
from app.utils.database import engine, Base
from contextlib import asynccontextmanager
import uvicorn

# 创建数据库表
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("🚀 暖小圈后端启动成功！")
    yield
    # 关闭时执行
    print("👋 暖小圈后端关闭")

app = FastAPI(
    title="暖小圈API",
    description="全人群智能学习助手",
    version="1.0.0",
    lifespan=lifespan
)

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(user.router, prefix="/api/user", tags=["用户"])
app.include_router(study_plan.router, prefix="/api/study-plan", tags=["学习计划"])
app.include_router(resource.router, prefix="/api/resource", tags=["学习资源"])
app.include_router(accounting.router, prefix="/api/accounting", tags=["记账"])
app.include_router(menstrual.router, prefix="/api/menstrual", tags=["生理期"])
app.include_router(badge.router, prefix="/api/badge", tags=["勋章"])

@app.get("/")
async def root():
    return {
        "message": "欢迎使用暖小圈API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
