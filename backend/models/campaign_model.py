from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.models.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class CampaignModel(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    confidence = Column(String(50), default="MEDIUM")
    target_brand = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    ioc_links = relationship("CampaignIOCModel", back_populates="campaign", cascade="all, delete-orphan")

class CampaignIOCModel(Base):
    __tablename__ = "campaign_iocs"

    campaign_id = Column(Integer, ForeignKey("campaigns.id"), primary_key=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id"), primary_key=True)

    campaign = relationship("CampaignModel", back_populates="ioc_links")
    ioc = relationship("IOCModel", back_populates="campaign_links")
