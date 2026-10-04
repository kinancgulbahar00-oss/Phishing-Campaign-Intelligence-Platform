from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float, JSON
from sqlalchemy.orm import relationship
from backend.models.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class IOCModel(Base):
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True)
    value = Column(String(2048), nullable=False, index=True)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")
    first_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    domain_info = relationship("DomainModel", back_populates="ioc", uselist=False, cascade="all, delete-orphan")
    ip_info = relationship("IPModel", back_populates="ioc", uselist=False, cascade="all, delete-orphan")
    url_info = relationship("URLModel", back_populates="ioc", uselist=False, cascade="all, delete-orphan")
    analysis_results = relationship("AnalysisResultModel", back_populates="ioc", cascade="all, delete-orphan")
    campaign_links = relationship("CampaignIOCModel", back_populates="ioc", cascade="all, delete-orphan")

class DomainModel(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id"), nullable=False, unique=True)
    domain_name = Column(String(255), nullable=False, index=True)
    whois_registrar = Column(String(255), nullable=True)
    created_date = Column(String(100), nullable=True)
    age_days = Column(Integer, nullable=True)

    ioc = relationship("IOCModel", back_populates="domain_info")

class IPModel(Base):
    __tablename__ = "ip_addresses"

    id = Column(Integer, primary_key=True, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id"), nullable=False, unique=True)
    ip_address = Column(String(100), nullable=False, index=True)
    abuseipdb_score = Column(Integer, default=0)
    reports_count = Column(Integer, default=0)

    ioc = relationship("IOCModel", back_populates="ip_info")

class URLModel(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id"), nullable=False, unique=True)
    url = Column(Text, nullable=False)
    vt_malicious_count = Column(Integer, default=0)
    vt_total_count = Column(Integer, default=0)
    has_https = Column(Boolean, default=False)
    redirect_count = Column(Integer, default=0)

    ioc = relationship("IOCModel", back_populates="url_info")

class AnalysisResultModel(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    ioc_id = Column(Integer, ForeignKey("iocs.id"), nullable=False)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")
    reasons_json = Column(JSON, nullable=True)
    mitre_json = Column(JSON, nullable=True)
    related_domains_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    ioc = relationship("IOCModel", back_populates="analysis_results")
