from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.models.database import init_db
from backend.api.routes_analyze import router as analyze_router
from backend.api.routes_ioc import router as ioc_router
from backend.api.routes_campaign import router as campaign_router
from backend.api.routes_list import router as list_router

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print(f"[Warning] Database initialization error: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Kimlik avı kampanyalarını skorlayan, açıklanabilir tehdit istihbaratı REST API'si.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(ioc_router)
app.include_router(campaign_router)
app.include_router(list_router)

@app.get("/health", tags=["Health"], summary="Servis sağlık kontrolü")
def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "frontend_embedded": FRONTEND_DIST.is_dir()
    }

from fastapi.responses import JSONResponse, FileResponse

if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", include_in_schema=False)
    def frontend_not_built():
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Frontend derlemesi bulunamadı.",
                "hint": "Proje kökünde `npm install && npm run build` çalıştırın, ardından sunucuyu yeniden başlatın.",
                "expected_path": str(FRONTEND_DIST),
                "api_docs": "/docs"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
