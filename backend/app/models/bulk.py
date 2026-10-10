"""
SQLAlchemy models for Bulk Operations / Bulk Processing in VeriProof.
Supports bulk document registration (Issuer) and bulk document verification (Verifier).
"""

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class BatchType(str, enum.Enum):
    REGISTRATION = "REGISTRATION"
    VERIFICATION = "VERIFICATION"


class BatchStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class ItemStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    RETRY_ELIGIBLE = "RETRY_ELIGIBLE"
    CANCELLED = "CANCELLED"


class BulkBatch(Base):
    __tablename__ = "bulk_batches"
    __table_args__ = (
        CheckConstraint(
            "batch_type IN ('REGISTRATION', 'VERIFICATION')",
            name="ck_bulk_batches_type",
        ),
        CheckConstraint(
            "status IN ('QUEUED', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'CANCELLED')",
            name="ck_bulk_batches_status",
        ),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    batch_type = Column(SQLEnum(BatchType), nullable=False, index=True)
    status = Column(
        SQLEnum(BatchStatus), nullable=False, default=BatchStatus.QUEUED, index=True
    )

    total_items = Column(Integer, nullable=False, default=0)
    processed_items = Column(Integer, nullable=False, default=0)
    successful_items = Column(Integer, nullable=False, default=0)
    failed_items = Column(Integer, nullable=False, default=0)

    archive_filename = Column(String(255), nullable=True)
    archive_storage_key = Column(String(64), nullable=True)
    error_summary = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    items = relationship(
        "BulkBatchItem",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="BulkBatchItem.item_index",
    )
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", foreign_keys=[organization_id])


class BulkBatchItem(Base):
    __tablename__ = "bulk_batch_items"
    __table_args__ = (
        UniqueConstraint("batch_id", "item_index", name="uq_bulk_batch_items_index"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(
        String(36), ForeignKey("bulk_batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_index = Column(Integer, nullable=False)

    original_filename = Column(String(255), nullable=False)
    temp_storage_path = Column(String(512), nullable=True)

    # Metadata fields (for Registration)
    document_title = Column(String(255), nullable=True)
    document_type = Column(String(100), nullable=True)
    recipient_name = Column(String(255), nullable=True)
    recipient_identifier = Column(String(255), nullable=True)
    recipient_email = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)

    # Cryptographic & Verification fields
    sha256_hash = Column(String(64), nullable=True, index=True)
    status = Column(
        SQLEnum(ItemStatus), nullable=False, default=ItemStatus.PENDING, index=True
    )
    verification_outcome = Column(String(20), nullable=True)  # VERIFIED, TAMPERED, UNVERIFIED, REVOKED, EXPIRED

    registered_document_id = Column(String(36), nullable=True, index=True)
    public_verification_id = Column(String(64), nullable=True, index=True)

    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)

    # ML Signals JSON
    ml_signals = Column(Text, nullable=True)  # JSON formatted tamper_score, anomaly_score, features
    processing_time_ms = Column(Float, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    batch = relationship("BulkBatch", back_populates="items")
