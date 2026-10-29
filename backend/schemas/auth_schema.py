from pydantic import BaseModel, Field
from typing import Optional

class AdminLoginRequest(BaseModel):
    password: str = Field(..., description="Yönetici erişim parolası")

class AdminLoginResponse(BaseModel):
    success: bool
    token: str
    role: str = "admin"
    message: str = "Giriş başarılı."

class AdminVerifyResponse(BaseModel):
    valid: bool
    role: str = "admin"

class AdminStatsResponse(BaseModel):
    total_iocs: int
    total_campaigns: int
    blacklist_count: int
    whitelist_count: int
    critical_iocs: int
    high_iocs: int
    database_type: str
    vt_active: bool
    abuse_active: bool
