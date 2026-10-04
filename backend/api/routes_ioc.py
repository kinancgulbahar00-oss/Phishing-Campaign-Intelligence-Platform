from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.ioc_model import IOCModel, AnalysisResultModel
from backend.schemas.analyze_schema import IOCResponse, IOCDetails, RelatedDomain, MitreTechnique

router = APIRouter(prefix="/ioc", tags=["IOC"])

@router.get("/{ioc_id}", response_model=IOCResponse, status_code=status.HTTP_200_OK,
            summary="Tek bir IOC kaydını ve son analiz sonucunu getirir")
def get_ioc_by_id(ioc_id: int, db: Session = Depends(get_db)):
    ioc = db.query(IOCModel).filter(IOCModel.id == ioc_id).first()
    if not ioc:
        raise HTTPException(status_code=404, detail=f"ID: {ioc_id} ile eşleşen IOC bulunamadı.")

    latest_analysis = (
        db.query(AnalysisResultModel)
        .filter(AnalysisResultModel.ioc_id == ioc_id)
        .order_by(AnalysisResultModel.id.desc())
        .first()
    )

    domain_val = ioc.domain_info.domain_name if ioc.domain_info else None
    registrar = ioc.domain_info.whois_registrar if ioc.domain_info else None
    age_days = ioc.domain_info.age_days if ioc.domain_info else None
    registered_on = ioc.domain_info.created_date if ioc.domain_info else None

    ip_addr = ioc.ip_info.ip_address if ioc.ip_info else None
    abuse_score = ioc.ip_info.abuseipdb_score if ioc.ip_info else None
    ip_reports = ioc.ip_info.reports_count if ioc.ip_info else None

    vt_pos = ioc.url_info.vt_malicious_count if ioc.url_info else None
    vt_tot = ioc.url_info.vt_total_count if ioc.url_info else None
    has_https = ioc.url_info.has_https if ioc.url_info else False

    ioc_det = IOCDetails(
        domain=domain_val,
        registrar=registrar,
        domain_age_days=age_days,
        domain_registration_date=registered_on,
        ip_address=ip_addr,
        abuse_score=abuse_score,
        ip_reports_count=ip_reports,
        url=ioc.value,
        vt_positives=vt_pos,
        vt_total=vt_tot,
        has_https=has_https
    )

    mitre_techs = []
    rel_domains = []
    if latest_analysis:
        if latest_analysis.mitre_json:
            mitre_techs = [MitreTechnique(**m) for m in latest_analysis.mitre_json]
        if latest_analysis.related_domains_json:
            rel_domains = [RelatedDomain(**rd) for rd in latest_analysis.related_domains_json]

    return IOCResponse(
        id=ioc.id,
        type=ioc.type,
        value=ioc.value,
        risk_score=ioc.risk_score,
        risk_level=ioc.risk_level,
        first_seen=ioc.first_seen.isoformat() if ioc.first_seen else "",
        ioc_details=ioc_det,
        mitre_techniques=mitre_techs,
        related_domains=rel_domains
    )

@router.get("/{ioc_id}/related", response_model=List[RelatedDomain], status_code=status.HTTP_200_OK,
            summary="IOC ile ilişkili benzer domain listesini döner")
def get_related_domains_by_ioc_id(ioc_id: int, db: Session = Depends(get_db)):
    ioc = db.query(IOCModel).filter(IOCModel.id == ioc_id).first()
    if not ioc:
        raise HTTPException(status_code=404, detail=f"ID: {ioc_id} ile eşleşen IOC bulunamadı.")

    latest_analysis = (
        db.query(AnalysisResultModel)
        .filter(AnalysisResultModel.ioc_id == ioc_id)
        .order_by(AnalysisResultModel.id.desc())
        .first()
    )

    if latest_analysis and latest_analysis.related_domains_json:
        return [RelatedDomain(**rd) for rd in latest_analysis.related_domains_json]
    
    return []
