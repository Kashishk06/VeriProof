from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "VeriProof API"
    API_V1_STR: str = "/api/v1"

    # DB
    DATABASE_URL: str = "postgresql+psycopg://postgres:change-me@localhost:5432/veriproof"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_TIMEOUT_SECONDS: int = 10

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Mail / SMTP Configuration
    SMTP_TLS: bool = True
    SMTP_USE_TLS: Optional[bool] = None
    SMTP_USE_SSL: bool = False
    SMTP_PORT: int = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    SMTP_TIMEOUT_SECONDS: int = 10

    # Direct MAIL_* aliases
    MAIL_HOST: Optional[str] = None
    MAIL_PORT: Optional[int] = None
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: Optional[str] = None
    MAIL_USE_TLS: Optional[bool] = None
    MAIL_USE_SSL: Optional[bool] = None
    MAIL_TIMEOUT: Optional[int] = None

    # Field-level Encryption (AES-256-GCM)
    FIELD_ENCRYPTION_KEY: Optional[str] = None

    # Testing flag
    TESTING: bool = False

    # Private organization document storage
    STORAGE_DIR: Optional[str] = None
    MAX_ORGANIZATION_DOCUMENT_SIZE_BYTES: int = 10 * 1024 * 1024
    MAX_DOCUMENT_SIZE_BYTES: int = 15 * 1024 * 1024
    PUBLIC_VERIFICATION_MAX_REQUESTS_PER_MINUTE: int = 120
    PUBLIC_COMPARISON_MAX_REQUESTS_PER_MINUTE: int = 20
    DOCUMENT_SIGNING_PRIVATE_KEY_PATH: Optional[str] = None
    DOCUMENT_SIGNING_KEY_ID: str = "veriproof-dev-ecdsa-p256-v1"
    DOCUMENT_SIGNING_PUBLIC_KEYS_JSON: Optional[str] = None
    PUBLIC_FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
