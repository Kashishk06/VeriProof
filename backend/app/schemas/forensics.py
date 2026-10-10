from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ForensicAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: str
    model_version: str
    risk_score: float = Field(description="Explainable risk index from 0 to 100; not a probability.")
    risk_level: str
    features: dict[str, Any]
    reason_codes: list[str]
    ml_signals: dict[str, Any] = Field(default_factory=dict)
    hash_matches: bool | None
    signature_valid: bool | None
    created_at: datetime


class ForensicAnalysisHistoryResponse(BaseModel):
    document_id: str
    total: int
    items: list[ForensicAnalysisResponse]