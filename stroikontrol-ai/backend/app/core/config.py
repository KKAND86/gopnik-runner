"""Pydantic settings."""

from pydantic_settings import BaseSettings
from pydantic import RedisDsn
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "СтройКонтроль AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database — supports PostgreSQL, SQLite, etc.
    DATABASE_URL: str = "sqlite+aiosqlite:///./stroikontrol_dev.db"
    
    # Redis
    REDIS_URL: RedisDsn = "redis://localhost:6379/0"
    
    # MinIO / S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "stroikontrol"
    MINIO_SECURE: bool = False
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # SMS / OTP
    SMS_PROVIDER: str = "mock"  # mock, smsc, twilio
    SMS_API_KEY: str = ""
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 5
    
    # Payments
    PAYMENT_PROVIDER: str = "yookassa"  # yookassa, stripe
    YOOKASSA_SHOP_ID: str = ""
    YOOKASSA_SECRET_KEY: str = ""
    
    # Analysis SLA (seconds)
    SLA_B2B_SECONDS: int = 30
    SLA_B2C_SECONDS: int = 60
    SLA_FREE_SECONDS: int = 120
    
    # Human review SLA (minutes)
    HUMAN_REVIEW_B2B_MINUTES: int = 15
    HUMAN_REVIEW_B2C_MINUTES: int = 120
    HUMAN_REVIEW_PAYG_MINUTES: int = 24 * 60
    
    # Tariffs
    TARIFF_PAYG_PRICE: int = 199  # rubles per room
    
    # File limits
    MAX_IMAGE_SIZE_MB: int = 20
    MAX_AUDIO_SIZE_MB: int = 10
    MAX_IMAGES_PER_PROJECT: int = 50
    
    # ML
    CV_CONFIDENCE_THRESHOLD_AUTO: float = 0.85
    CV_CONFIDENCE_THRESHOLD_REVIEW: float = 0.70
    AUDIO_SNR_THRESHOLD_DB: float = 15.0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
