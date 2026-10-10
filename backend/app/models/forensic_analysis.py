from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String

from app.db.session import Base


class ForensicAnalysis(Base):
    __tablename__ = "forensic_analyses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        String(36), ForeignKey("registered_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    analyzed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    model_version = Column(String(64), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    features = Column(JSON, nullable=False)
    reason_codes = Column(JSON, nullable=False)
    ml_signals = Column(JSON, nullable=False, default=dict)
    hash_matches = Column(Boolean, nullable=True)
    signature_valid = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)