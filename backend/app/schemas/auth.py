"""
Pydantic schemas for authentication requests, responses, and organization onboarding.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator, ConfigDict
from app.models.user import UserRole
from app.models.organization import OrganizationStatus


# ---------------------------------------------------------------------------
# OTP Verification Schemas
# ---------------------------------------------------------------------------
class SendEmailOTPRequest(BaseModel):
    """Payload to request an email OTP."""

    email: EmailStr
    workflow: str = "registration"

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class SendEmailOTPResponse(BaseModel):
    """Response returned upon successful OTP dispatch."""

    message: str
    cooldown_seconds: int = 60
    expires_in_seconds: int = 600


class VerifyEmailOTPRequest(BaseModel):
    """Payload to verify an email OTP."""

    email: EmailStr
    otp: str
    workflow: str = "registration"

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("otp")
    @classmethod
    def validate_otp_format(cls, v: str) -> str:
        clean = v.strip()
        if not clean.isdigit() or len(clean) != 6:
            raise ValueError("OTP must be a 6-digit numeric code.")
        return clean


class VerifyEmailOTPResponse(BaseModel):
    """Response returned upon successful OTP verification."""

    verified: bool
    message: str
    verification_token: Optional[str] = None


# Backwards compatibility aliases for previous endpoint signatures
SendOTPRequest = SendEmailOTPRequest
SendOTPResponse = SendEmailOTPResponse
VerifyOTPRequest = VerifyEmailOTPRequest
VerifyOTPResponse = VerifyEmailOTPResponse


# ---------------------------------------------------------------------------
# Organization Onboarding Payload
# ---------------------------------------------------------------------------
class OrganizationSignupPayload(BaseModel):
    """Organization details required during Issuer onboarding."""

    name: str
    legal_name: Optional[str] = None
    org_type: str
    registration_number: str
    tax_id: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pin_code: Optional[str] = None
    authorized_representative_name: str
    authorized_representative_role: Optional[str] = None
    authorized_representative_email: Optional[EmailStr] = None
    authorized_representative_phone: Optional[str] = None
    primary_document_url: Optional[str] = None
    supporting_document_url: Optional[str] = None

    @field_validator("name", "org_type", "registration_number", "authorized_representative_name")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Required organization field cannot be empty.")
        return clean


# ---------------------------------------------------------------------------
# Signup & Login Schemas
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    """
    Public signup payload for VERIFIER or ISSUER.
    SUPER_ADMIN role is explicitly blocked.
    """

    full_name: str
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    role: UserRole = UserRole.VERIFIER
    verification_token: Optional[str] = None
    organization: Optional[OrganizationSignupPayload] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

    @field_validator("role")
    @classmethod
    def block_super_admin(cls, v: UserRole) -> UserRole:
        if v == UserRole.SUPER_ADMIN:
            raise ValueError("Public signup cannot create a Super Admin account.")
        return v

    @model_validator(mode="after")
    def validate_signup_rules(self) -> "SignupRequest":
        # 1. Validate password confirmation if provided
        if self.confirm_password and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")

        # 2. Issuer must provide organization profile
        if self.role == UserRole.ISSUER and not self.organization:
            raise ValueError("Organization profile is required for Issuer registration.")

        return self


class LoginRequest(BaseModel):
    """Login payload."""

    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    """JWT bearer token response."""

    access_token: str
    token_type: str = "bearer"


class OrganizationResponse(BaseModel):
    """Safe organization representation."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    legal_name: Optional[str]
    org_type: str
    registration_number: str
    website: Optional[str]
    official_email: str
    status: OrganizationStatus
    status_reason: Optional[str] = None
    primary_document_url: Optional[str]
    supporting_document_url: Optional[str]
    created_at: datetime


class UserResponse(BaseModel):
    """Safe user representation — never includes hashed_password or sensitive keys."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    organization_id: Optional[int] = None
    organization: Optional[OrganizationResponse] = None
    created_at: Optional[datetime] = None
