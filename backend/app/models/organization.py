"""
Organization model for VeriProof.
Represents an issuing authority or entity registered on the platform.
"""

from datetime import datetime, timezone
import enum
import uuid
from sqlalchemy import CheckConstraint, Column, Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class OrganizationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"
    # Legacy statuses preserved for backward compatibility & safe migration
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Organization(Base):
    __tablename__ = "organizations"
    __table_args__ = (
        UniqueConstraint("registration_number", name="uq_organizations_registration_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    legal_name = Column(String(255), nullable=True)
    org_type = Column(String(100), nullable=False)
    registration_number = Column(String(100), nullable=False, index=True)
    tax_id = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    official_email = Column(String(255), nullable=False, index=True)

    # Address Details
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    pin_code = Column(String(50), nullable=True)

    # Authorized Representative
    authorized_representative_name = Column(String(255), nullable=False)
    authorized_representative_role = Column(String(100), nullable=True)
    authorized_representative_email = Column(String(255), nullable=True)
    authorized_representative_phone = Column(String(50), nullable=True)

    # Verification / Supporting Document references
    primary_document_url = Column(String(500), nullable=True)
    supporting_document_url = Column(String(500), nullable=True)

    # Super Admin Review & Lifecycle
    status = Column(
        SQLEnum(OrganizationStatus),
        default=OrganizationStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    status_reason = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    users = relationship("User", back_populates="organization", foreign_keys="User.organization_id")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
    audit_events = relationship("AuditEvent", back_populates="organization", cascade="all, delete-orphan")
    documents = relationship("OrganizationDocument", back_populates="organization", cascade="all, delete-orphan")
    registry_documents = relationship("RegisteredDocument", back_populates="organization")


class OrganizationDocument(Base):
    __tablename__ = "organization_documents"
    __table_args__ = (
        CheckConstraint("document_type IN ('PRIMARY', 'SUPPORTING')", name="ck_organization_documents_type"),
        UniqueConstraint("storage_key", name="uq_organization_documents_storage_key"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(16), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_key = Column(String(36), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="documents")


class RegisteredDocument(Base):
    __tablename__ = "registered_documents"
    __table_args__ = (
        CheckConstraint("status IN ('ACTIVE', 'REVOKED')", name="ck_registered_documents_status"),
        CheckConstraint("version >= 1", name="ck_registered_documents_version"),
        UniqueConstraint("public_verification_id", name="uq_registered_documents_public_id"),
        UniqueConstraint("storage_key", name="uq_registered_documents_storage_key"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_verification_id = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False, index=True)
    issuer_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=True)
    recipient_identifier = Column(String(255), nullable=True)
    recipient_email = Column(String(255), nullable=True)
    issuer_notes = Column(Text, nullable=True)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(36), nullable=False)
    content_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    signature_algorithm = Column(String(50), nullable=False)
    signature_value = Column(Text, nullable=False)
    signing_key_id = Column(String(100), nullable=False)
    signing_public_key = Column(Text, nullable=False)
    signed_manifest = Column(Text, nullable=False)
    status = Column(String(16), nullable=False, default="ACTIVE", index=True)
    issue_date = Column(Date, nullable=False)
    issued_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(Text, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    previous_version_id = Column(String(36), ForeignKey("registered_documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="registry_documents")
    issuer = relationship("User", back_populates="registered_documents", foreign_keys=[issuer_user_id])
    previous_version = relationship("RegisteredDocument", remote_side=[id], foreign_keys=[previous_version_id])
