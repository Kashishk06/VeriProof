"""Pydantic v2 schemas for VeriProof ML Inference Endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class MLHealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    active_models: Dict[str, str]
    message: str

class MLModelInfo(BaseModel):
    model_id: str
    version: str
    task_type: str
    status: str
    sha256_checksum: str
    created_at: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    license_restriction: str = "internal_veriproof_permissive"

class MLModelsResponse(BaseModel):
    total_models: int
    models: List[MLModelInfo]

class ImageForensicsRequest(BaseModel):
    image_base64: Optional[str] = None
    document_id: Optional[str] = None
    ela_quality: int = Field(default=90, ge=50, le=100)

class ImageForensicsResponse(BaseModel):
    task: str
    model_id: str
    model_version: str
    tamper_score: float
    is_suspicious: bool
    forensic_features: Dict[str, float]
    localization: Dict[str, Any]
    warnings: List[str]
    duration_ms: float
    disclaimer: str

class FieldConsistencyRequest(BaseModel):
    field_name: str
    expected_value: str
    extracted_value: str
    ocr_confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    passing_year: Optional[int] = None
    issue_date: Optional[str] = None

class FieldConsistencyResponse(BaseModel):
    field_name: str
    ground_truth_value: str
    ocr_extracted_value: str
    ocr_confidence: float
    similarity_score: float
    is_consistent: bool
    classification: str
    warnings: List[str]
    model_version: str
    duration_ms: float

class AnomalyScoreRequest(BaseModel):
    verification_requests_last_hour: float = 0.0
    consecutive_failed_checks: int = 0
    burst_request_rate_per_sec: float = 0.0
    time_of_day_anomaly_score: float = 0.0
    metadata_tampering_score: float = 0.0
    issuer_revocation_status: str = "active"

class AnomalyScoreResponse(BaseModel):
    task: str
    model_id: str
    model_version: str
    anomaly_score: float
    is_anomalous: bool
    rule_flags: List[str]
    severity: str
    duration_ms: float
    disclaimer: str

class OCRAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    document_id: Optional[str] = None
    fields_to_validate: Optional[Dict[str, str]] = None

class OCRAnalysisResponse(BaseModel):
    task: str
    extracted_text: str
    extracted_fields: Dict[str, str]
    field_evaluations: List[FieldConsistencyResponse]
    overall_confidence: float
    duration_ms: float
