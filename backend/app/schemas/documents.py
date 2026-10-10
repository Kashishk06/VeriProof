"""Document registry, QR forensics, and email delivery schemas."""

from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


VerificationOutcome = Literal["VERIFIED", "TAMPERED", "UNVERIFIED", "REVOKED", "EXPIRED"]


class DocumentRegistrationMetadata(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    document_type: str = Field(min_length=1, max_length=100)
    issue_date: date
    expires_at: Optional[date] = None
    recipient_name: Optional[str] = Field(None, max_length=255)
    recipient_identifier: Optional[str] = Field(None, max_length=255)
    recipient_email: Optional[EmailStr] = None
    issuer_notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("title", "document_type", "recipient_name", "recipient_identifier", "issuer_notes", mode="before")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_expiry(self) -> "DocumentRegistrationMetadata":
        if self.expires_at and self.expires_at <= self.issue_date:
            raise ValueError("Expiry date must be after issue date.")
        return self


class DocumentListItem(BaseModel):
    document_id: str
    public_verification_id: str
    title: str
    document_type: str
    recipient_name: Optional[str]
    recipient_identifier: Optional[str]
    original_filename: str
    sha256_hash: str
    signature_algorithm: str
    signature_value: str
    signing_key_id: str
    signing_public_key: str
    status: Literal["ACTIVE", "REVOKED"]
    issue_date: date
    issued_at: datetime
    expires_at: Optional[datetime]
    revoked_at: Optional[datetime]
    revocation_reason: Optional[str] = None
    version: int


class DocumentListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: list[DocumentListItem]


class AdminDocumentListItem(DocumentListItem):
    organization_id: int
    organization_name: str
    issuer_user_id: int
    issuer_name: Optional[str]


class AdminDocumentListResponse(DocumentListResponse):
    items: list[AdminDocumentListItem]
    active_count: int = 0
    revoked_count: int = 0


class IssuerDocumentListItem(DocumentListItem):
    recipient_email: Optional[EmailStr] = None


class IssuerDocumentListResponse(DocumentListResponse):
    items: list[IssuerDocumentListItem]


class DocumentRegistrationResponse(DocumentListItem):
    recipient_email: Optional[EmailStr]
    issuer_notes: Optional[str]
    verification_url: str
    qr_code_data_url: str
    hash_matches: Optional[bool]
    signature_valid: Optional[bool]


class DocumentRevokeRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        clean = value.strip()
        if len(clean) < 3:
            raise ValueError("A meaningful revocation reason is required.")
        return clean


class DocumentHistoryEvent(BaseModel):
    id: int
    event_type: str
    actor_id: Optional[int]
    actor_name: Optional[str]
    created_at: datetime
    metadata: dict[str, object]


class DocumentHistoryResponse(BaseModel):
    document_id: str
    events: list[DocumentHistoryEvent]
    total: int
    page: int
    limit: int
    total_pages: int


class PublicVerificationResponse(BaseModel):
    public_verification_id: str
    outcome: VerificationOutcome
    title: Optional[str] = None
    issuer_name: Optional[str] = None
    document_type: Optional[str] = None
    issue_date: Optional[date] = None
    issued_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    registry_status: Optional[Literal["ACTIVE", "REVOKED"]] = None
    sha256_hash: Optional[str] = None
    hash_matches: Optional[bool] = None
    signature_valid: Optional[bool] = None
    qr_decoded: Optional[bool] = None
    qr_trusted_domain: Optional[bool] = None
    ml_tamper_score: Optional[float] = None
    ml_anomaly_score: Optional[float] = None
    ml_verdict: Optional[str] = None
    field_comparisons: Optional[List[Dict[str, Any]]] = None
    ocr_extracted_fields: Optional[Dict[str, Any]] = None
    tamper_reasons: Optional[List[str]] = None


class DocumentEmailDispatchRequest(BaseModel):
    recipient_email: Optional[EmailStr] = None
    custom_message: Optional[str] = Field(None, max_length=1000)


class DocumentEmailDispatchResponse(BaseModel):
    status: str
    document_id: str
    public_verification_id: str
    recipient_email: str
    provider_message_id: str
    timestamp: str
    details: Optional[str] = None
    is_test_mode: bool = False


class QRDecodeResponse(BaseModel):
    success: bool
    raw_text: Optional[str] = None
    verification_url: Optional[str] = None
    public_verification_id: Optional[str] = None
    is_trusted_domain: bool = False
    page_index: Optional[int] = None
    confidence: float = 0.0
    error: Optional[str] = None


class ScanCalibrationResponse(BaseModel):
    total_scenarios: int
    passed_scenarios: int
    failed_scenarios: int
    recovery_rate_percent: float
    reference_url: str
    recommended_minimum_print_size_mm: str
    recommended_minimum_scan_dpi: int
    scenarios: List[Dict[str, Any]]
    status: str