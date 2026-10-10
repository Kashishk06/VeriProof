"""Schemas for organization-owned profile and supporting-document operations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.organization import OrganizationStatus


class OrganizationProfileUpdate(BaseModel):
    """Allowlisted organization profile fields; ownership and lifecycle are immutable here."""

    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    org_type: Optional[str] = Field(None, min_length=1, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    pin_code: Optional[str] = Field(None, max_length=50)
    authorized_representative_name: Optional[str] = Field(None, min_length=1, max_length=255)
    authorized_representative_role: Optional[str] = Field(None, max_length=100)
    authorized_representative_email: Optional[EmailStr] = None
    authorized_representative_phone: Optional[str] = Field(None, max_length=50)

    @field_validator("*", mode="before")
    @classmethod
    def trim_strings(cls, value):
        return value.strip() if isinstance(value, str) else value


class OrganizationProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    legal_name: Optional[str]
    org_type: str
    registration_number: str
    tax_id: Optional[str]
    website: Optional[str]
    official_email: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    pin_code: Optional[str]
    authorized_representative_name: str
    authorized_representative_role: Optional[str]
    authorized_representative_email: Optional[str]
    authorized_representative_phone: Optional[str]
    status: OrganizationStatus
    status_reason: Optional[str]
    created_at: datetime
    updated_at: datetime


class OrganizationDocumentUploadResponse(BaseModel):
    id: str
    organization_id: int
    document_type: str
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime