import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Phishing Campaign Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = ""
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cti_platform.db")
    
    VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")

    # Sayfa icerigi analizi: supheli sayfa JavaScript calistirilmadan indirilir
    PAGE_FETCH_ENABLED: bool = True
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
