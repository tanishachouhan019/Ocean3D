from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "Officer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserOut
