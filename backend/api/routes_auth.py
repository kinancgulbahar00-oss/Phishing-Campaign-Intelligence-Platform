from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.config import settings
from backend.models.database import get_db
from backend.models.list_model import ListModel
from backend.models.ioc_model import IOCModel
from backend.models.campaign_model import CampaignModel
from backend.schemas.auth_schema import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminVerifyResponse,
    AdminStatsResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def require_admin(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    token = x_admin_token
    if not token and authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token or token != settings.ADMIN_SESSION_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca sistem yöneticisi (Admin) tarafından gerçekleştirilebilir. Lütfen Yönetici Paneli üzerinden giriş yapın."
        )
    return True

@router.post("/login", response_model=AdminLoginResponse, summary="Yönetici Girişi")
def admin_login(payload: AdminLoginRequest):
    if payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı yönetici parolası. Lütfen parolanızı kontrol edip tekrar deneyin."
        )
    return AdminLoginResponse(
        success=True,
        token=settings.ADMIN_SESSION_TOKEN,
        role="admin",
        message="Yönetici girişi başarılı."
    )

@router.get("/verify", response_model=AdminVerifyResponse, summary="Yönetici Oturum Doğrulama")
def admin_verify(is_admin: bool = Depends(require_admin)):
    return AdminVerifyResponse(valid=True, role="admin")

@router.get("/stats", response_model=AdminStatsResponse, summary="Platform Yönetici İstatistikleri")
def admin_stats(db: Session = Depends(get_db)):
    blacklist_count = db.query(ListModel).filter(ListModel.list_type == "blacklist").count()
    whitelist_count = db.query(ListModel).filter(ListModel.list_type == "whitelist").count()
    total_iocs = db.query(IOCModel).count()
    total_campaigns = db.query(CampaignModel).count()

    critical_iocs = db.query(IOCModel).filter(func.lower(IOCModel.risk_level) == "critical").count()
    high_iocs = db.query(IOCModel).filter(func.lower(IOCModel.risk_level) == "high").count()

    db_type = "PostgreSQL" if "postgresql" in settings.DATABASE_URL.lower() else "SQLite"

    vt_active = bool(settings.VIRUSTOTAL_API_KEY and "your_" not in settings.VIRUSTOTAL_API_KEY.lower())
    abuse_active = bool(settings.ABUSEIPDB_API_KEY and "your_" not in settings.ABUSEIPDB_API_KEY.lower())

    return AdminStatsResponse(
        total_iocs=total_iocs,
        total_campaigns=total_campaigns,
        blacklist_count=blacklist_count,
        whitelist_count=whitelist_count,
        critical_iocs=critical_iocs,
        high_iocs=high_iocs,
        database_type=db_type,
        vt_active=vt_active,
        abuse_active=abuse_active,
    )
