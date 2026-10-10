"""
Pydantic schemas for Super Admin organization oversight and lifecycle operations.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.models.organization import OrganizationStatus
from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Organization Document Schemas
# ---------------------------------------------------------------------------
class OrganizationDocumentMetadata(BaseModel):
    """Metadata representation for an organization's supporting document."""

    id: str = Field(..., description="Document identifier, e.g. 'primary' or 'supporting'")
    document_type: str = Field(..., description="Type category: PRIMARY or SUPPORTING")
    label: str = Field(..., description="Human-readable document description")
    filename: str = Field(..., description="Uploaded or submitted filename reference")
    is_uploaded: bool = Field(False, description="Whether the physical file exists in private storage")
    storage_status: str = Field(..., description="'STORED' or 'METADATA_ONLY'")
    size_bytes: Optional[int] = None
    content_type: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    limitation_notice: Optional[str] = None


class OrganizationDocumentsListResponse(BaseModel):
    """List of submitted supporting documents and their metadata for an organization."""

    organization_id: int
    organization_name: str
    documents: List[OrganizationDocumentMetadata]


# ---------------------------------------------------------------------------
# Organization Summary & Detail Schemas
# ---------------------------------------------------------------------------
class OrganizationAdminSummaryResponse(BaseModel):
    """Summary view of an organization for admin listing and pagination."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    legal_name: Optional[str] = None
    org_type: str
    registration_number: str
    tax_id: Optional[str] = None
    official_email: str
    status: OrganizationStatus
    status_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_count: int = 0
    issuer_name: Optional[str] = None
    issuer_email: Optional[EmailStr] = None
    has_documents: bool = False


class OrganizationPaginationResponse(BaseModel):
    """Paginated organization list response."""

    total: int
    page: int
    limit: int
    total_pages: int
    items: List[OrganizationAdminSummaryResponse]


class OrganizationUserSummary(BaseModel):
    """Summary of users associated with an organization."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None


class OrganizationAdminDetailResponse(BaseModel):
    """Comprehensive detail view of an organization for Super Admin oversight."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    legal_name: Optional[str] = None
    org_type: str
    registration_number: str
    tax_id: Optional[str] = None
    website: Optional[str] = None
    official_email: str

    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pin_code: Optional[str] = None

    # Authorized Representative
    authorized_representative_name: str
    authorized_representative_role: Optional[str] = None
    authorized_representative_email: Optional[str] = None
    authorized_representative_phone: Optional[str] = None

    # Documents
    primary_document_url: Optional[str] = None
    supporting_document_url: Optional[str] = None
    documents: List[OrganizationDocumentMetadata] = []

    # Lifecycle & Status
    status: OrganizationStatus
    status_reason: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Associated Users
    users: List[OrganizationUserSummary] = []


# ---------------------------------------------------------------------------
# Administrative Action Requests & Responses
# ---------------------------------------------------------------------------
class SuspendOrganizationRequest(BaseModel):
    """Payload to suspend an active organization."""

    reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory non-empty reason for suspension")

    @field_validator("reason")
    @classmethod
    def validate_reason_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 3:
            raise ValueError("A meaningful suspension reason (at least 3 characters) is required.")
        return clean


class RevokeOrganizationRequest(BaseModel):
    """Payload to revoke an organization's authority."""

    reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory non-empty reason for revocation")

    @field_validator("reason")
    @classmethod
    def validate_reason_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 3:
            raise ValueError("A meaningful revocation reason (at least 3 characters) is required.")
        return clean


class RestoreOrganizationRequest(BaseModel):
    """Payload to restore a suspended organization."""

    reason: str = Field(..., min_length=3, max_length=1000, description="Mandatory non-empty reason for restoration")
    allow_reinstatement: bool = Field(False, description="Set True only if explicitly reinstating a REVOKED organization")

    @field_validator("reason")
    @classmethod
    def validate_reason_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 3:
            raise ValueError("A meaningful restoration reason (at least 3 characters) is required.")
        return clean


class ReinstateOrganizationRequest(BaseModel):
    """Payload for explicit Super Admin reinstatement of a previously REVOKED organization."""

    reason: str = Field(..., min_length=5, max_length=1000, description="Mandatory justification for reinstating a revoked organization")

    @field_validator("reason")
    @classmethod
    def validate_reason_not_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 5:
            raise ValueError("A detailed reinstatement justification (at least 5 characters) is mandatory.")
        return clean


class OrganizationStatusChangeResponse(BaseModel):
    """Response returned upon lifecycle status change (suspend, revoke, restore)."""

    success: bool
    organization_id: int
    organization_name: str
    previous_status: OrganizationStatus
    new_status: OrganizationStatus
    reason: str
    acted_by: str
    timestamp: datetime


# ---------------------------------------------------------------------------
# Oversight Audit History Schemas
# ---------------------------------------------------------------------------
class OrganizationHistoryEventResponse(BaseModel):
    """Representation of an administrative audit event for an organization."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    user_id: Optional[int] = None
    actor_email: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class OrganizationHistoryResponse(BaseModel):
    """Audit and oversight history for an organization."""

    organization_id: int
    organization_name: str
    current_status: OrganizationStatus
    events: List[OrganizationHistoryEventResponse]
    total: int = 0
    page: int = 1
    limit: int = 100
    total_pages: int = 1
