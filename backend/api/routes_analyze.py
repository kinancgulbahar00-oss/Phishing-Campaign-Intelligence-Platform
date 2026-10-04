from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.ioc_model import IOCModel, DomainModel, IPModel, URLModel, AnalysisResultModel
from backend.schemas.analyze_schema import AnalyzeRequest, AnalyzeResponse, IOCDetails, ReasonItem, MitreTechnique, RelatedDomain
from backend.core.analyzer_interface import analyze_url_pipeline

router = APIRouter(prefix="", tags=["Analyze"])

@router.post("/analyze/url", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK,
             summary="URL analiz eder, sonucu kaydeder ve açıklanabilir risk skoru döner")
def analyze_url_endpoint(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="URL boş olamaz.")
        
    try:
        analysis_result = analyze_url_pipeline(request.url, db=db)
        
        url_str = analysis_result["url"]
        risk_score = analysis_result["risk_score"]
        risk_level = analysis_result["risk_level"]
        ioc_det = analysis_result["ioc_details"]
        
        existing_ioc = db.query(IOCModel).filter(IOCModel.value == url_str).first()
        if existing_ioc:
            ioc_record = existing_ioc
            ioc_record.risk_score = risk_score
            ioc_record.risk_level = risk_level
        else:
            ioc_record = IOCModel(
                type="url",
                value=url_str,
                risk_score=risk_score,
                risk_level=risk_level
            )
            db.add(ioc_record)
            db.flush()

        if ioc_record.url_info:
            ioc_record.url_info.vt_malicious_count = ioc_det.get("vt_positives")
            ioc_record.url_info.vt_total_count = ioc_det.get("vt_total")
            ioc_record.url_info.has_https = ioc_det.get("has_https", False)
        else:
            url_info = URLModel(
                ioc_id=ioc_record.id,
                url=url_str,
                vt_malicious_count=ioc_det.get("vt_positives"),
                vt_total_count=ioc_det.get("vt_total"),
                has_https=ioc_det.get("has_https", False)
            )
            db.add(url_info)

        domain_val = ioc_det.get("domain")
        if domain_val:
            if ioc_record.domain_info:
                ioc_record.domain_info.whois_registrar = ioc_det.get("registrar")
                ioc_record.domain_info.age_days = ioc_det.get("domain_age_days")
                ioc_record.domain_info.created_date = ioc_det.get("domain_registration_date")
            else:
                domain_info = DomainModel(
                    ioc_id=ioc_record.id,
                    domain_name=domain_val,
                    whois_registrar=ioc_det.get("registrar"),
                    age_days=ioc_det.get("domain_age_days"),
                    created_date=ioc_det.get("domain_registration_date")
                )
                db.add(domain_info)

        ip_val = ioc_det.get("ip_address")
        if ip_val:
            if ioc_record.ip_info:
                ioc_record.ip_info.abuseipdb_score = ioc_det.get("abuse_score")
                ioc_record.ip_info.reports_count = ioc_det.get("ip_reports_count")
            else:
                ip_info = IPModel(
                    ioc_id=ioc_record.id,
                    ip_address=ip_val,
                    abuseipdb_score=ioc_det.get("abuse_score"),
                    reports_count=ioc_det.get("ip_reports_count")
                )
                db.add(ip_info)

        analysis_record = AnalysisResultModel(
            ioc_id=ioc_record.id,
            risk_score=risk_score,
            risk_level=risk_level,
            reasons_json=analysis_result.get("reasons", []),
            mitre_json=analysis_result.get("mitre_techniques", []),
            related_domains_json=analysis_result.get("related_domains", [])
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(ioc_record)
        
        return AnalyzeResponse(
            id=ioc_record.id,
            url=analysis_result["url"],
            risk_score=analysis_result["risk_score"],
            risk_level=analysis_result["risk_level"],
            reasons=[ReasonItem(**r) for r in analysis_result.get("reasons", [])],
            ioc_details=IOCDetails(**analysis_result.get("ioc_details", {})),
            mitre_techniques=[MitreTechnique(**m) for m in analysis_result.get("mitre_techniques", [])],
            related_domains=[RelatedDomain(**rd) for rd in analysis_result.get("related_domains", [])]
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Analiz işlemi sırasında sunucu hatası: {str(e)}")
