from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import Optional
from app.config import get_settings
from app.core.security import decode_token, TokenData

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

async def get_current_user_jwt(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
        
    return token_data


# Simplified version for occasions API (uses simple token check)
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Get current authenticated user - simplified for occasions
    In production, use full JWT validation above
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # For now, use basic validation
    #  In production: Use get_current_user_jwt or full JWT decode
    token = authorization.split(" ")[1]
    
    # Mock user for now
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "role": "customer"
    }


async def get_current_admin(current_user: TokenData = Depends(get_current_user_jwt)) -> TokenData:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
