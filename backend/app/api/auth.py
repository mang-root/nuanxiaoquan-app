"""
用户认证API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.utils.database import get_db
from app.models.models import User
from config.settings import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Pydantic模型
class UserRegister(BaseModel):
    phone: str
    password: str
    nickname: str = "新用户"
    education_level: str = "高中"

class UserLogin(BaseModel):
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="认证失败",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查手机号是否已注册
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="手机号已注册")
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        phone=user_data.phone,
        password_hash=hashed_password,
        nickname=user_data.nickname,
        education_level=user_data.education_level
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 生成token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "phone": new_user.phone,
            "nickname": new_user.nickname,
            "education_level": new_user.education_level,
            "level": new_user.level,
            "points": new_user.points
        }
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.phone == user_data.phone).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="手机号或密码错误"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "education_level": user.education_level,
            "level": user.level,
            "points": user.points,
            "theme": user.theme
        }
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "phone": current_user.phone,
        "nickname": current_user.nickname,
        "avatar": current_user.avatar,
        "education_level": current_user.education_level,
        "level": current_user.level,
        "points": current_user.points,
        "theme": current_user.theme
    }
