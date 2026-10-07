from collections import Counter

from fastapi import APIRouter

from backend.core.brands import catalog, catalog_summary

router = APIRouter(prefix="/brands", tags=["Brand Catalog"])


@router.get("", summary="Taklit tespiti yapılan kurum kataloğunu döner")
@router.get("/", include_in_schema=False)
def list_brands():
    brands = catalog_summary()
    counts = Counter(b["sector"] for b in brands)
    sectors = [
        {"id": key, "label": value["label"], "count": counts.get(key, 0)}
        for key, value in catalog()["sectors"].items()
    ]
    sectors.sort(key=lambda s: -s["count"])
    return {"total": len(brands), "sectors": sectors, "brands": brands}
