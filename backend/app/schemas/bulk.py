"""
Pydantic v2 schemas for Bulk Operations (Registration & Verification).
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BulkValidationPreviewItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    row_index: int
    filename: str
    document_title: Optional[str] = None
    document_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_identifier: Optional[str] = None
    recipient_email: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    is_valid: bool = True
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    file_present_in_archive: bool = True
    file_size_bytes: Optional[int] = None


class BulkValidationPreviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_files_in_archive: int
    total_metadata_rows: int
    valid_items_count: int
    invalid_items_count: int
    missing_files_count: int
    unmatched_files_count: int
    duplicate_files_count: int
    items: List[BulkValidationPreviewItem]
    can_proceed: bool
    session_token: str
    archive_filename: str


class BulkBatchCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    batch_type: str
    status: str
    total_items: int
    message: str
    created_at: str


class BulkBatchStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    batch_type: str
    status: str
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    progress_percent: float
    archive_filename: Optional[str] = None
    error_summary: Optional[str] = None
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None


class BulkBatchItemDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_index: int
    original_filename: str
    document_title: Optional[str] = None
    document_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_identifier: Optional[str] = None
    recipient_email: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    sha256_hash: Optional[str] = None
    status: str
    verification_outcome: Optional[str] = None
    registered_document_id: Optional[str] = None
    public_verification_id: Optional[str] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    retry_count: int = 0
    ml_signals: Optional[Dict[str, Any]] = None
    processing_time_ms: Optional[float] = None
    created_at: str
    updated_at: str


class BulkBatchItemListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[BulkBatchItemDetail]


class BulkBatchListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    batch_type: str
    status: str
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    archive_filename: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


class BulkBatchListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    page: int
    limit: int
    total_pages: int
    items: List[BulkBatchListItem]


class BulkRetryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    retried_items_count: int
    status: str
    message: str


class BulkCancelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    batch_id: str
    status: str
    message: str
