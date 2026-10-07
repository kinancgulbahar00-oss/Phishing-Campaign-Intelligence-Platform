from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field

class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="Analiz edilecek URL veya domain adresi", example="https://verify-account-update.com")

class ReasonItem(BaseModel):
    rule_name: str
    description: str
    severity: str = "medium"
    contribution: Optional[int] = Field(None, description="Bulgunun skora katkisi (puan); eksi deger skoru dusurur")

class IOCDetails(BaseModel):
    domain: Optional[str] = None
    registrar: Optional[str] = None
    domain_age_days: Optional[int] = None
    domain_registration_date: Optional[str] = None
    ip_address: Optional[str] = None
    abuse_score: Optional[int] = None
    ip_reports_count: Optional[int] = None
    abuse_status: Optional[str] = None
    url: Optional[str] = None
    vt_positives: Optional[int] = None
    vt_total: Optional[int] = None
    vt_status: Optional[str] = None
    has_https: bool = False
    tls_status: Optional[str] = Field(None, description="valid | invalid | none | unreachable")
    target_brand: Optional[str] = Field(None, description="Taklit edildigi degerlendirilen kurum")
    target_sector: Optional[str] = None
    page_status: Optional[str] = Field(None, description="ok | blocked | error | disabled | unreachable")
    page_title: Optional[str] = None
    final_url: Optional[str] = Field(None, description="Yonlendirme sonrasi ulasilan adres")
    page_fields: List[str] = Field(default_factory=list, description="Sayfanin istedigi hassas alanlar")

class MitreTechnique(BaseModel):
    id: str
    tactic: str
    technique: str

class RelatedDomain(BaseModel):
    domain: str
    similarity: int

class AnalyzeResponse(BaseModel):
    id: Optional[int] = None
    url: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    reasons: List[ReasonItem] = []
    ioc_details: IOCDetails
    mitre_techniques: List[MitreTechnique] = []
    related_domains: List[RelatedDomain] = []

class IOCResponse(BaseModel):
    id: int
    type: str
    value: str
    risk_score: int
    risk_level: str
    first_seen: str
    ioc_details: Optional[IOCDetails] = None
    mitre_techniques: List[MitreTechnique] = []
    related_domains: List[RelatedDomain] = []

class CampaignResponse(BaseModel):
    id: int
    name: str
    confidence: str
    target_brand: Optional[str] = None
    description: Optional[str] = None
    iocs: List[IOCResponse] = []
