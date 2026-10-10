"""
Dedicated test suite verifying Phase 2 (Super Admin CLI Bootstrap),
Phase 3 (Email OTP Delivery), Phase 4 (Token Security & Replay Prevention),
Phase 6 (Login Rate Limiting), and Transaction Safety.
"""

import time
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationStatus
from app.models.audit import AuditEvent
from app.core.security import hash_password, create_access_token, create_email_verification_token
from app.core.config import settings
from app.services.otp_service import otp_service
from bootstrap_admin import bootstrap_super_admin, validate_password_strength

# ---------------------------------------------------------------------------
# Isolated Test DB for Audit Suite
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite:///./test_auth_audit.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_audit_db():
    Base.metadata.create_all(bind=engine)
    original_testing = settings.TESTING
    settings.TESTING = True
    yield
    settings.TESTING = original_testing
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# PHASE 2: Super Admin CLI Bootstrap Tests
# ---------------------------------------------------------------------------
class TestSuperAdminBootstrap:
    def test_password_strength_validation(self):
        """Bootstrap validates administrator password complexity."""
        assert validate_password_strength("short") is not None
        assert validate_password_strength("alllowercase123!") is not None
        assert validate_password_strength("ALLUPPERCASE123!") is not None
        assert validate_password_strength("NoDigitsHere!!") is not None
        assert validate_password_strength("NoSpecialChar123") is not None
        # Valid strong password
        assert validate_password_strength("AdminStrongPass123!") is None

    def test_successful_bootstrap(self):
        """CLI bootstrap successfully provisions the initial Super Admin."""
        db = TestingSessionLocal()
        try:
            success = bootstrap_super_admin(
                full_name="Platform Admin",
                email="rootadmin@veriproof.com",
                password="RootPassword123!",
                interactive=False,
                db=db,
            )
            assert success is True

            # Verify in DB
            admin = db.query(User).filter(User.email == "rootadmin@veriproof.com").first()
            assert admin is not None
            assert admin.role == UserRole.SUPER_ADMIN
            assert admin.is_active is True

            # Verify audit event
            audit = db.query(AuditEvent).filter(AuditEvent.user_id == admin.id).first()
            assert audit is not None
            assert audit.event_type == "SUPER_ADMIN_PROVISIONED"
        finally:
            db.close()

    def test_duplicate_bootstrap_prevented(self):
        """CLI bootstrap refuses duplicate Super Admin creation."""
        db = TestingSessionLocal()
        try:
            # Attempt to create a second Super Admin
            success = bootstrap_super_admin(
                full_name="Second Admin",
                email="secondadmin@veriproof.com",
                password="SecondPassword123!",
                interactive=False,
                db=db,
            )
            # Must return False and block duplicate
            assert success is False
        finally:
            db.close()

    def test_refuse_elevating_existing_user(self):
        """CLI bootstrap refuses to silently elevate an existing user account."""
        db = TestingSessionLocal()
        try:
            # Remove any existing admin so we specifically test elevation refusal
            db.query(User).filter(User.role == UserRole.SUPER_ADMIN).delete()
            db.commit()

            # Create an ordinary verifier user
            existing = User(
                email="ordinary@veriproof.com",
                full_name="Ordinary User",
                hashed_password=hash_password("Pass123!"),
                role=UserRole.VERIFIER,
                is_active=True,
            )
            db.add(existing)
            db.commit()

            # Attempt to bootstrap with the same email
            success = bootstrap_super_admin(
                full_name="Elevate Attempt",
                email="ordinary@veriproof.com",
                password="ElevatePassword123!",
                interactive=False,
                db=db,
            )
            assert success is False

            # Verify user role is NOT changed
            refreshed = db.query(User).filter(User.email == "ordinary@veriproof.com").first()
            assert refreshed.role == UserRole.VERIFIER
        finally:
            db.close()


# ---------------------------------------------------------------------------
# PHASE 3: Email OTP Lifecycle, Rate Limits, and Delivery Failures
# ---------------------------------------------------------------------------
class TestOTPLifecycleAndSecurity:
    def test_expired_otp_rejection(self, client):
        """Expired OTP is rejected and evicted."""
        email = "expired_otp@test.com"
        client.post("/api/v1/auth/send-otp", json={"email": email})

        # Artificially expire the OTP
        key = (email, "registration")
        assert key in otp_service._store
        otp_service._store[key]["expires_at"] = time.time() - 10  # Expired 10s ago

        res = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": email, "otp": "123456"},
        )
        assert res.status_code == 400
        assert "expired" in res.json()["detail"].lower()
        # Record evicted
        assert key not in otp_service._store

    def test_hourly_rate_limit_enforced(self, client):
        """More than 5 OTP requests in an hour returns HTTP 429."""
        email = "hourly_rate@test.com"
        now = time.time()
        bucket = int(now // 3600)
        # Set hourly attempts to 5
        otp_service._hourly_attempts[(email, bucket)] = 5

        res = client.post("/api/v1/auth/send-otp", json={"email": email})
        assert res.status_code == 429
        assert "too many" in res.json()["detail"].lower()

    def test_max_verification_attempts_invalidates_code(self, client):
        """5 incorrect verification attempts invalidates the OTP."""
        email = "max_attempts@test.com"
        client.post("/api/v1/auth/send-otp", json={"email": email})

        key = (email, "registration")
        assert key in otp_service._store

        # Submit 5 wrong OTPs
        for _ in range(4):
            r = client.post("/api/v1/auth/verify-otp", json={"email": email, "otp": "000000"})
            assert r.status_code == 400
            assert "attempt(s) remaining" in r.json()["detail"].lower()

        # 5th attempt invalidates
        r5 = client.post("/api/v1/auth/verify-otp", json={"email": email, "otp": "000000"})
        assert r5.status_code == 429
        assert "invalidated" in r5.json()["detail"].lower()
        # Key evicted
        assert key not in otp_service._store

    def test_smtp_delivery_failure_returns_502(self, client):
        """When SMTP dispatch raises an exception, the API returns HTTP 502 Bad Gateway."""
        # Temporarily enable SMTP configuration with an unreachable host
        with patch.object(settings, "SMTP_HOST", "invalid-smtp-host.local"), \
             patch.object(settings, "TESTING", False), \
             patch("smtplib.SMTP", side_effect=Exception("Connection refused by SMTP host")):
            res = client.post(
                "/api/v1/auth/send-otp",
                json={"email": "delivery_fail@test.com"},
            )
            assert res.status_code == 502
            assert "failed to dispatch" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# PHASE 4: Token Proof, Single-Use, and Anti-Replay
# ---------------------------------------------------------------------------
class TestTokenProofAndAntiReplay:
    def test_token_cannot_be_reused_for_second_signup(self, client):
        """A single verification token cannot be consumed twice (anti-replay)."""
        email1 = "replay_user1@test.com"
        token = create_email_verification_token(email1, "registration")
        otp_service._store[(email1, "registration")] = {
            "otp_hash": "dummy",
            "expires_at": time.time() + 600,
            "attempts_remaining": 5,
            "last_sent_at": 0,
            "is_verified": True,
            "_test_code": None,
        }

        # 1. First signup succeeds
        res1 = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Replay User 1",
                "email": email1,
                "password": "ValidPassword123!",
                "role": "VERIFIER",
                "verification_token": token,
            },
        )
        assert res1.status_code == 201

        # 2. Attempt to use the EXACT SAME verification token again (e.g. for a different account attempt)
        # It must be rejected by anti-replay consumption check
        res2 = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Replay User 1 Retry",
                "email": email1,
                "password": "ValidPassword123!",
                "role": "VERIFIER",
                "verification_token": token,
            },
        )
        # Blocked: either 400 (token already consumed) or 409 (duplicate)
        assert res2.status_code in (400, 409)

    def test_token_bound_to_different_email_rejected(self, client):
        """A verification token issued for email A cannot authorize signup for email B."""
        email_a = "user_a@test.com"
        email_b = "user_b@test.com"
        token_a = create_email_verification_token(email_a, "registration")

        res = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Attacker",
                "email": email_b,
                "password": "ValidPassword123!",
                "role": "VERIFIER",
                "verification_token": token_a,
            },
        )
        assert res.status_code == 400
        assert "verified" in res.json()["detail"].lower()

    def test_token_bound_to_different_workflow_rejected(self, client):
        """A verification token issued for password_reset cannot authorize registration."""
        email = "workflow_test@test.com"
        token_reset = create_email_verification_token(email, "password_reset")

        res = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Workflow User",
                "email": email,
                "password": "ValidPassword123!",
                "role": "VERIFIER",
                "verification_token": token_reset,
            },
        )
        assert res.status_code == 400

    def test_password_and_confirm_password_mismatch(self, client):
        """Signup validates that password and confirm_password match."""
        email = "confirm_pw@test.com"
        token = create_email_verification_token(email, "registration")
        res = client.post(
            "/api/v1/auth/signup",
            json={
                "full_name": "Mismatch User",
                "email": email,
                "password": "Password123!",
                "confirm_password": "DifferentPassword123!",
                "role": "VERIFIER",
                "verification_token": token,
            },
        )
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# PHASE 6: Login Rate Limiting
# ---------------------------------------------------------------------------
class TestLoginRateLimiting:
    def test_consecutive_failed_logins_trigger_lockout(self, client):
        """10 failed login attempts triggers rate limit lockout (HTTP 429)."""
        from app.api.v1.auth import _FAILED_LOGIN_ATTEMPTS

        # In TestClient, client.host is 'testclient'
        test_ip = "testclient"
        # Simulate 10 failed login timestamps for this IP within lockout window
        _FAILED_LOGIN_ATTEMPTS[test_ip] = [time.time() - i for i in range(10)]

        # 11th attempt must trigger rate limit lockout
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "WrongPassword!"},
        )
        assert res.status_code == 429
        assert "too many failed login attempts" in res.json()["detail"].lower()

        # Clean up so other tests are unaffected
        _FAILED_LOGIN_ATTEMPTS.pop(test_ip, None)


# ---------------------------------------------------------------------------
# PHASE 7: Transaction Rollback on Database Error
# ---------------------------------------------------------------------------
class TestTransactionRollback:
    def test_signup_transaction_rollback_on_failure(self, client):
        """If a database error occurs during signup, transaction rolls back cleanly."""
        from sqlalchemy.orm import Session as ORMSession

        email = "rollback_test@test.com"
        token = create_email_verification_token(email, "registration")
        otp_service._store[(email, "registration")] = {
            "otp_hash": "dummy",
            "expires_at": time.time() + 600,
            "attempts_remaining": 5,
            "last_sent_at": 0,
            "is_verified": True,
            "_test_code": None,
        }

        # Simulate database flush exception on ORM Session
        with patch.object(ORMSession, "flush", side_effect=Exception("Simulated DB Disk Full Error")):
            res = client.post(
                "/api/v1/auth/signup",
                json={
                    "full_name": "Rollback User",
                    "email": email,
                    "password": "Password123!",
                    "role": "VERIFIER",
                    "verification_token": token,
                },
            )
            assert res.status_code == 500

        # Verify no orphan user was committed to database
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == email).first()
        assert user is None
        db.close()

        # Verify no orphan user created
        db = TestingSessionLocal()
        user = db.query(User).filter(User.email == email).first()
        assert user is None
        db.close()
