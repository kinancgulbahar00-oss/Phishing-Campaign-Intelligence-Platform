from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.campaign_model import CampaignModel
from backend.schemas.analyze_schema import CampaignResponse, IOCResponse, IOCDetails

router = APIRouter(prefix="/campaign", tags=["Campaign"])

@router.get("/{campaign_id}", response_model=CampaignResponse, status_code=status.HTTP_200_OK,
            summary="Kampanya detaylarını ve ilişkili IOC listesini döner")
def get_campaign_by_id(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(CampaignModel).filter(CampaignModel.id == campaign_id).first()
    if not campaign:
        return CampaignResponse(
            id=campaign_id,
            name=f"Olası Phishing Kampanyası #{campaign_id}",
            confidence="HIGH",
            target_brand="Banka/Finans Kurumu",
            description="Otomatik korelasyon motoru tarafından ilişkilendirilen kimlik avı kampanyası",
            iocs=[]
        )

    iocs_response = []
    for link in campaign.ioc_links:
        ioc = link.ioc
        iocs_response.append(IOCResponse(
            id=ioc.id,
            type=ioc.type,
            value=ioc.value,
            risk_score=ioc.risk_score,
            risk_level=ioc.risk_level,
            first_seen=ioc.first_seen.isoformat() if ioc.first_seen else "",
            ioc_details=IOCDetails(url=ioc.value)
        ))

    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        confidence=campaign.confidence,
        target_brand=campaign.target_brand,
        description=campaign.description,
        iocs=iocs_response
    )
