from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.models.database import get_db
from backend.models.list_model import ListModel
from backend.schemas.list_schema import ListCreateRequest, ListItemResponse

router = APIRouter(prefix="/lists", tags=["Whitelist & Blacklist"])

@router.get("", response_model=List[ListItemResponse], summary="Whitelist ve Blacklist kurallarını listeler")
@router.get("/", response_model=List[ListItemResponse], include_in_schema=False)
def get_list_entries(
    list_type: Optional[str] = Query(None, description="Filtreleme: 'whitelist' veya 'blacklist'"),
    db: Session = Depends(get_db)
):
    query = db.query(ListModel)
    if list_type:
        if list_type not in ["whitelist", "blacklist"]:
            raise HTTPException(status_code=400, detail="Görünüm türü 'whitelist' veya 'blacklist' olmalıdır.")
        query = query.filter(ListModel.list_type == list_type)
    return query.order_by(ListModel.created_at.desc()).all()

@router.post("", response_model=ListItemResponse, status_code=status.HTTP_201_CREATED, summary="Yeni Whitelist veya Blacklist kuralı ekler")
@router.post("/", response_model=ListItemResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_list_entry(request: ListCreateRequest, db: Session = Depends(get_db)):
    pattern_clean = request.pattern.strip().lower()
    if not pattern_clean:
        raise HTTPException(status_code=400, detail="Pattern boş olamaz.")
        
    existing = db.query(ListModel).filter(
        ListModel.list_type == request.list_type,
        ListModel.pattern == pattern_clean
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Bu pattern zaten {request.list_type} listesinde mevcut.")

    new_item = ListModel(
        list_type=request.list_type,
        entry_type=request.entry_type,
        pattern=pattern_clean,
        description=request.description
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Whitelist veya Blacklist kuralını siler")
def delete_list_entry(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ListModel).filter(ListModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Silinecek kural bulunamadı.")
    
    db.delete(item)
    db.commit()
    return None
