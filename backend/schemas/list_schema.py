from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class ListCreateRequest(BaseModel):
    list_type: Literal["whitelist", "blacklist"] = Field(..., description="'whitelist' veya 'blacklist'")
    entry_type: Literal["domain", "ip", "url"] = Field("domain", description="'domain', 'ip' veya 'url'")
    pattern: str = Field(..., description="Eşleşecek alan adı, IP veya URL kalıbı (örn: google.com, 1.1.1.1)")
    description: Optional[str] = Field(None, description="Kural açıklama / gerekçesi")

class ListItemResponse(BaseModel):
    id: int
    list_type: str
    entry_type: str
    pattern: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
