"""
Core security utilities for VeriProof.
Handles Argon2id password hashing and JWT token operations.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import JWTError, jwt

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password Hashing (Argon2id)
# ---------------------------------------------------------------------------
# OWASP 2023 recommended parameters: m=64MB, t=3, p=4
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(plain_password: str) -> str:
    """Return an Argon2id hash of the given plain-text password."""
    return _ph.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against an Argon2id hash.
    Returns False on any mismatch or error — never raises to callers.
    """
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


# ---------------------------------------------------------------------------
# JWT Tokens
# ---------------------------------------------------------------------------
def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.
    'subject' is typically the user's email or user ID as a string.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and validate a JWT access token.
    Returns the 'sub' (subject/email) on success, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],  # explicitly restrict algorithm
        )
        subject: Optional[str] = payload.get("sub")
        return subject
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Email Verification Tokens (Bound to Email and Workflow)
# ---------------------------------------------------------------------------
def create_email_verification_token(email: str, workflow: str) -> str:
    """
    Create a signed token proving that the email address was verified via OTP.
    Has a 15-minute expiration and cannot be repurposed for another email/workflow.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {
        "sub": email.lower().strip(),
        "workflow": workflow,
        "purpose": "email_otp_verified",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_email_verification_token(token: str, email: str, workflow: str) -> bool:
    """
    Validate that the verification token is valid, unexpired, and matches
    the exact email address and workflow requested.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        if payload.get("purpose") != "email_otp_verified":
            return False
        if payload.get("sub") != email.lower().strip():
            return False
        if payload.get("workflow") != workflow:
            return False
        return True
    except JWTError:
        return False


# ---------------------------------------------------------------------------
# Field-Level Encryption (AES-256-GCM)
# ---------------------------------------------------------------------------
import base64
import hashlib
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_encryption_key() -> bytes:
    """
    Derive or decode a 32-byte key for AES-256-GCM from settings.
    Stored outside the database.
    """
    raw_key = getattr(settings, "FIELD_ENCRYPTION_KEY", None)
    if raw_key:
        try:
            if len(raw_key) == 64:
                return bytes.fromhex(raw_key)
            return raw_key.encode("utf-8")[:32].ljust(32, b"0")
        except Exception:
            pass
    # Fallback to key derived from SECRET_KEY via SHA-256
    return hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt sensitive string field using AES-256-GCM.
    Returns URL-safe base64 string formatted as: nonce (12 bytes) + ciphertext + tag.
    """
    if not plaintext:
        return ""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_field(encrypted_str: str) -> str:
    """
    Decrypt an AES-256-GCM encrypted field.
    Gracefully returns plaintext if the string was unencrypted or corrupted.
    """
    if not encrypted_str:
        return ""
    try:
        raw = base64.b64decode(encrypted_str)
        if len(raw) < 28:  # 12-byte nonce + 16-byte tag minimum
            return encrypted_str
        nonce = raw[:12]
        ciphertext = raw[12:]
        key = _get_encryption_key()
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")
    except Exception:
        return encrypted_str

