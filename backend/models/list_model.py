from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.models.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ListModel(Base):
    __tablename__ = "list_entries"

    id = Column(Integer, primary_key=True, index=True)
    list_type = Column(String(20), nullable=False, index=True)  # 'whitelist' veya 'blacklist'
    entry_type = Column(String(20), nullable=False, default="domain")  # 'domain', 'ip', 'url'
    pattern = Column(String(1024), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
