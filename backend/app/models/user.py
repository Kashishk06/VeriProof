from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ISSUER = "ISSUER"
    VERIFIER = "VERIFIER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(SQLEnum(UserRole), default=UserRole.VERIFIER, nullable=False)
    is_active = Column(Boolean(), default=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="users", foreign_keys=[organization_id])
    registered_documents = relationship("RegisteredDocument", back_populates="issuer", foreign_keys="RegisteredDocument.issuer_user_id")

