"""
Authentication API tests for VeriProof.

All tests use an in-memory SQLite database so they never touch the real
'veriproof' PostgreSQL database, and they apply the full SQLAlchemy schema
on each test session via Base.metadata.create_all().

Note: Signup tests simulate the full OTP flow by using TESTING=True mode,
which allows the OTP service to generate and return codes without a real SMTP
gateway. The test suite drives the complete send → verify → signup lifecycle.
"""

import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

# ---------------------------------------------------------------------------
# Test DB setup — isolated SQLite, never touches the real PostgreSQL DB
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite:///./test_veriproof.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def create_tables():
    """Create all tables at the start of the test module and drop them at the end."""
    Base.metadata.create_all(bind=engine)
    yield
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


@pytest.fixture(scope="module", autouse=True)
def enable_test_mode():
    """Enable TESTING mode so OTP service bypasses real SMTP and stores the code in memory."""
    original = settings.TESTING
    settings.TESTING = True
    yield
    settings.TESTING = original


# ---------------------------------------------------------------------------
# Helper: Full OTP-verified signup flow (used by multiple tests)
# ---------------------------------------------------------------------------
VALID_USER = {
    "full_name": "Test User",
    "email": "testuser@veriproof.com",
    "password": "SecurePass123!",
    "role": "VERIFIER",
}

VALID_ISSUER = {
    "full_name": "Issuer Rep",
    "email": "issuer@veriproof.com",
    "password": "SecureIssuer99!",
    "role": "ISSUER",
}

VALID_ORG = {
    "name": "Test University",
    "org_type": "Educational Institution",
    "registration_number": "REG-123456",
    "authorized_representative_name": "Test Rep",
}


def _obtain_verification_token(client, email: str, workflow: str = "registration") -> str:
    """
    Drive the full send-OTP → verify-OTP lifecycle in TESTING mode.
    Returns the signed verification_token returned by /verify-otp.
    """
    from app.services.otp_service import otp_service
    from app.core.config import settings
    settings.TESTING = True

    # Send OTP (TESTING=True so it won't hit SMTP)
    send_res = client.post(
        "/api/v1/auth/send-otp",
        json={"email": email, "workflow": workflow},
    )
    assert send_res.status_code == 200, f"OTP send failed: {send_res.json()}"

    # Retrieve the generated OTP from the in-memory store (test-mode only)
    key = (email.strip().lower(), workflow)
    record = otp_service._store.get(key)
    assert record is not None, "OTP record not found in service store"
    test_code = record.get("_test_code")
    assert test_code is not None, "No _test_code in store (TESTING mode not active?)"

    # Verify the OTP
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "otp": test_code, "workflow": workflow},
    )
    assert verify_res.status_code == 200, f"OTP verify failed: {verify_res.json()}"
    token = verify_res.json().get("verification_token")
    assert token, "No verification_token in response"
    return token


# ---------------------------------------------------------------------------
# Password utility tests
# ---------------------------------------------------------------------------
class TestPasswordSecurity:
    def test_hash_is_not_plaintext(self):
        h = hash_password("mypassword")
        assert h != "mypassword"

    def test_correct_password_verifies(self):
        h = hash_password("mypassword")
        assert verify_password("mypassword", h) is True

    def test_wrong_password_fails(self):
        h = hash_password("mypassword")
        assert verify_password("wrongpassword", h) is False

    def test_empty_password_fails(self):
        h = hash_password("mypassword")
        assert verify_password("", h) is False


# ---------------------------------------------------------------------------
# JWT utility tests
# ---------------------------------------------------------------------------
class TestJWTTokens:
    def test_valid_token_decodes(self):
        from app.core.security import decode_access_token
        token = create_access_token("user@example.com")
        subject = decode_access_token(token)
        assert subject == "user@example.com"

    def test_expired_token_returns_none(self):
        from app.core.security import decode_access_token
        token = create_access_token("user@example.com", expires_delta=timedelta(seconds=-1))
        subject = decode_access_token(token)
        assert subject is None

    def test_tampered_token_returns_none(self):
        from app.core.security import decode_access_token
        token = create_access_token("user@example.com")
        tampered = token[:-5] + "XXXXX"
        subject = decode_access_token(tampered)
        assert subject is None


# ---------------------------------------------------------------------------
# Signup tests (full OTP-gated flow)
# ---------------------------------------------------------------------------
class TestSignup:
    def test_successful_signup(self, client):
        """VERIFIER signup: send OTP → verify OTP → signup with verification_token."""
        token = _obtain_verification_token(client, VALID_USER["email"])
        response = client.post(
            "/api/v1/auth/signup",
            json={**VALID_USER, "verification_token": token},
        )
        assert response.status_code == 201, response.json()
        data = response.json()
        assert data["email"] == VALID_USER["email"]
        assert data["role"] == "VERIFIER"
        assert "hashed_password" not in data
        assert "password" not in data

    def test_email_normalised_to_lowercase(self, client):
        """Email is normalised to lowercase on signup."""
        mixed_email = "UPPER2@VERIPROOF.COM"
        norm_email = mixed_email.lower()
        token = _obtain_verification_token(client, norm_email)
        payload = {**VALID_USER, "email": mixed_email, "verification_token": token}
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 201, response.json()
        assert response.json()["email"] == norm_email

    def test_duplicate_email_returns_409(self, client):
        """Registering the same email a second time returns HTTP 409."""
        # Create a valid verification token directly (avoids OTP cooldown hit)
        from app.core.security import create_email_verification_token
        token = create_email_verification_token(VALID_USER["email"], "registration")
        # Also ensure OTP service store has a consumed-verified record for this email
        from app.services.otp_service import otp_service
        import time
        key = (VALID_USER["email"].lower(), "registration")
        otp_service._store[key] = {
            "otp_hash": "dummy",
            "expires_at": time.time() + 600,
            "attempts_remaining": 5,
            "last_sent_at": time.time() - 120,  # outside cooldown window
            "is_verified": True,
            "_test_code": None,
        }
        response = client.post(
            "/api/v1/auth/signup",
            json={**VALID_USER, "verification_token": token},
        )
        # 409 Conflict — email already registered
        assert response.status_code == 409, response.json()

    def test_short_password_rejected(self, client):
        """Passwords shorter than 8 characters are rejected at schema level (422)."""
        payload = {**VALID_USER, "email": "short@veriproof.com", "password": "abc"}
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 422

    def test_super_admin_signup_blocked(self, client):
        """Attempting to sign up as SUPER_ADMIN is blocked at schema level (422)."""
        payload = {**VALID_USER, "email": "admin@veriproof.com", "role": "SUPER_ADMIN"}
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 422

    def test_issuer_signup_requires_organization(self, client):
        """Issuer signup without organization profile is rejected (422)."""
        payload = {**VALID_ISSUER, "verification_token": "dummy"}
        # No organization field — schema model_validator should reject
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 422

    def test_issuer_signup_allowed(self, client):
        """Full Issuer signup with OTP verification and organization profile."""
        token = _obtain_verification_token(client, VALID_ISSUER["email"])
        response = client.post(
            "/api/v1/auth/signup",
            json={
                **VALID_ISSUER,
                "verification_token": token,
                "organization": VALID_ORG,
            },
        )
        assert response.status_code == 201, response.json()
        assert response.json()["role"] == "ISSUER"

    def test_signup_without_otp_verification_returns_400(self, client):
        """Signup with no verification_token and no OTP record must return HTTP 400."""
        # Use a brand-new email that has never been through the OTP flow
        response = client.post(
            "/api/v1/auth/signup",
            json={**VALID_USER, "email": "unverified_new@veriproof.com"},
        )
        assert response.status_code == 400
        assert "verified" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------
class TestLogin:
    def test_successful_login(self, client):
        """Registered user can log in with correct credentials."""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
        )
        assert response.status_code == 200, response.json()
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_wrong_password_returns_401(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": VALID_USER["email"], "password": "WrongPassword!"},
        )
        assert response.status_code == 401

    def test_unknown_email_returns_401(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@veriproof.com", "password": "anything"},
        )
        assert response.status_code == 401

    def test_wrong_and_unknown_return_same_message(self, client):
        """Prevent user-enumeration by returning identical error messages."""
        r1 = client.post(
            "/api/v1/auth/login",
            json={"email": VALID_USER["email"], "password": "WrongPassword!"},
        )
        r2 = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@veriproof.com", "password": "anything"},
        )
        assert r1.json()["detail"] == r2.json()["detail"]


# ---------------------------------------------------------------------------
# /auth/me tests
# ---------------------------------------------------------------------------
class TestGetMe:
    def _get_token(self, client) -> str:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
        )
        assert response.status_code == 200, f"Login failed: {response.json()}"
        return response.json()["access_token"]

    def test_me_with_valid_token(self, client):
        token = self._get_token(client)
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == VALID_USER["email"]
        assert "hashed_password" not in data

    def test_me_without_token_returns_403(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code in (401, 403)

    def test_me_with_invalid_token_returns_401_or_403(self, client):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer not.a.valid.token"},
        )
        assert response.status_code in (401, 403)

    def test_me_with_expired_token_returns_401_or_403(self, client):
        expired_token = create_access_token(
            VALID_USER["email"], expires_delta=timedelta(seconds=-1)
        )
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# /auth/send-otp and /auth/verify-otp tests
# ---------------------------------------------------------------------------
class TestOTPFlow:
    def test_send_otp_invalid_email(self, client):
        response = client.post(
            "/api/v1/auth/send-otp",
            json={"email": "not-an-email"},
        )
        assert response.status_code == 422

    def test_send_otp_in_testing_mode_succeeds(self, client):
        """In TESTING mode the OTP is dispatched without real SMTP (200 OK)."""
        response = client.post(
            "/api/v1/auth/send-otp",
            json={"email": "otp_test@university.edu"},
        )
        # TESTING=True so it must succeed (200)
        assert response.status_code == 200
        assert "cooldown_seconds" in response.json()

    def test_verify_otp_without_active_otp_returns_400(self, client):
        response = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": "unknown_otp@university.edu", "otp": "123456"},
        )
        assert response.status_code == 400
        # Message contains "no active" or similar
        detail = response.json()["detail"].lower()
        assert "no active" in detail or "verification request" in detail or "request" in detail

    def test_verify_otp_invalid_format_returns_422(self, client):
        response = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": "admin@university.edu", "otp": "abc"},
        )
        assert response.status_code == 422

    def test_full_otp_flow_in_test_mode(self, client):
        """End-to-end: send OTP → retrieve code from store → verify → get token."""
        from app.services.otp_service import otp_service

        email = "flow_test@example.com"
        workflow = "registration"

        send_res = client.post(
            "/api/v1/auth/send-otp",
            json={"email": email, "workflow": workflow},
        )
        assert send_res.status_code == 200

        key = (email, workflow)
        record = otp_service._store.get(key)
        assert record is not None
        code = record["_test_code"]
        assert code is not None and len(code) == 6

        verify_res = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": email, "otp": code, "workflow": workflow},
        )
        assert verify_res.status_code == 200
        data = verify_res.json()
        assert data["verified"] is True
        assert data["verification_token"] is not None

    def test_otp_incorrect_code_returns_400(self, client):
        """Sending a wrong OTP returns HTTP 400 with remaining attempts info."""
        from app.services.otp_service import otp_service

        email = "wrong_otp@example.com"

        send_res = client.post(
            "/api/v1/auth/send-otp",
            json={"email": email},
        )
        assert send_res.status_code == 200

        verify_res = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": email, "otp": "000000"},
        )
        assert verify_res.status_code == 400
        assert "incorrect" in verify_res.json()["detail"].lower()

    def test_otp_cooldown_enforced(self, client):
        """Requesting a second OTP within the 60-second cooldown window returns 429."""
        email = "cooldown_test@example.com"

        # First request — must succeed
        r1 = client.post("/api/v1/auth/send-otp", json={"email": email})
        assert r1.status_code == 200

        # Immediate second request — must be rate-limited (429)
        r2 = client.post("/api/v1/auth/send-otp", json={"email": email})
        assert r2.status_code == 429
        assert "wait" in r2.json()["detail"].lower()
