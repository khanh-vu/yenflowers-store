"""
Authentication router.
Handles admin login/logout.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from supabase import Client

from app.database import get_supabase_admin
from app.core.security import create_access_token, hash_password, verify_password, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Client = Depends(get_supabase_admin)
):
    """
    Admin login endpoint.
    Returns JWT token for authenticated sessions.
    """
    # Find user by email
    result = db.table("profiles").select("*").eq("email", credentials.email).execute()
    
    if not result.data:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    user = result.data[0]
    
    # Check if admin or staff
    if user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập admin")
    
    # For now, check password from a simple password field
    # In production, use hashed passwords
    stored_password = user.get("password_hash")
    
    if stored_password:
        if not verify_password(credentials.password, stored_password):
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    else:
        # Fallback: if no password_hash, check if password matches a default or email
        # This is for initial setup only
        if credentials.password != "admin123":
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    # Create JWT token
    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"]
    })
    
    return LoginResponse(
        access_token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name"),
            "role": user["role"]
        }
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    Client should clear the token locally.
    """
    return {"message": "Đăng xuất thành công"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str,
    db: Client = Depends(get_supabase_admin)
):
    """
    Get current authenticated user info.
    Token should be passed as query parameter.
    """
    token_data = decode_token(token)
    
    if not token_data:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    
    # Get fresh user data
    result = db.table("profiles").select("*").eq("id", token_data.user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    
    user = result.data[0]
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=user["role"]
    )
