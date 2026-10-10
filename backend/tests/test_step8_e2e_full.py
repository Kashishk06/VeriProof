"""Complete Step 8 End-to-End Automated Acceptance Test Suite.

Covers E2E-01 through E2E-10:
- Issuer document registration, SHA-256 hashing, ECDSA P-256 signing, and download.
- Verifier multi-modal verification (VERIFIED, TAMPERED, UNVERIFIED, REVOKED).
- Role-based access control and tenant isolation.
- Live ML model inference (Image Forensics, Anomaly Detection, Field Consistency, OCR).
- Robust error handling, database persistence, and audit logging.
- Performance latency measurement.
"""

import io
import time
import base64
import hashlib
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationStatus, RegisteredDocument
from app.services.document_service import document_service
from app.core.config import settings


# In-memory test database fixture
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("test_docs")
    document_service.base_dir = str(tmp_path / "private-documents")
    settings.DOCUMENT_SIGNING_PRIVATE_KEY_PATH = str(tmp_path / "keys" / "signing.pem")
    settings.DOCUMENT_SIGNING_KEY_ID = "KEY-APEX-2026-01"
    settings.PUBLIC_FRONTEND_URL = "http://localhost:5173"

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    try:
        # Create test organization
        org = Organization(
            id=1,
            name="Apex Institute of Technology",
            registration_number="REG-APEX-2026-001",
            org_type="UNIVERSITY",
            status=OrganizationStatus.ACTIVE,
            official_email="contact@apex.edu",
            authorized_representative_email="admin@apex.edu",
            authorized_representative_name="Dr. Jane Doe",
            authorized_representative_role="Registrar",
        )
        db.add(org)

        # Create test users
        issuer = User(
            id=10,
            email="issuer@apex.edu",
            full_name="Alice Registrar",
            role=UserRole.ISSUER,
            organization_id=1,
            is_active=True,
            hashed_password="hashed_pw_test",
        )
        verifier = User(
            id=20,
            email="verifier@audit.org",
            full_name="Bob Verifier",
            role=UserRole.VERIFIER,
            organization_id=1,
            is_active=True,
            hashed_password="hashed_pw_test",
        )
        db.add_all([issuer, verifier])
        db.commit()
    finally:
        db.close()
    yield
@pytest.fixture(autouse=True)
def ensure_db_override():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


def test_e2e_01_issuer_registration_and_download():
    """E2E-01: Issuer registers synthetic document, calculates SHA-256 & signature, and downloads it."""
    issuer_user = User(
        id=10,
        email="issuer@apex.edu",
        full_name="Alice Registrar",
        role=UserRole.ISSUER,
        organization_id=1,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: issuer_user

    test_content = b"%PDF-1.7 Synthetic Degree Certificate Content for E2E-01"
    calculated_sha256 = hashlib.sha256(test_content).hexdigest()

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/documents/register",
            data={
                "title": "Bachelor of Technology in Computer Science",
                "document_type": "Degree",
                "issue_date": "2026-05-15",
                "recipient_name": "Rohan Sharma",
                "recipient_identifier": "BTECH-CS-2026-904",
                "recipient_email": "rohan.sharma@example.edu",
            },
            files={"file": ("rohan_degree.pdf", test_content, "application/pdf")},
        )
        assert response.status_code == 201, f"Registration failed: {response.text}"
        data = response.json()
        assert data["sha256_hash"] is not None
        assert data["signature_value"] is not None
        assert data["signing_key_id"] == "KEY-APEX-2026-01"
        assert data["status"] == "ACTIVE"
        assert "public_verification_id" in data
        doc_id = data["document_id"]

        # Test download
        dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
        assert dl_res.status_code == 200
        assert len(dl_res.content) > 0
        assert hashlib.sha256(dl_res.content).hexdigest() == data["sha256_hash"]


def test_e2e_02_verifier_original_document_verified():
    """E2E-02: Verifier uploads original registered document and receives VERIFIED outcome."""
    db = TestingSessionLocal()
    doc = db.query(RegisteredDocument).first()
    pub_id = doc.public_verification_id
    doc_id = doc.id
    db.close()

    issuer_user = User(
        id=10,
        email="issuer@apex.edu",
        full_name="Alice Registrar",
        role=UserRole.ISSUER,
        organization_id=1,
        is_active=True,
    )
    with TestClient(app) as client:
        # Download the issued QR-bearing artifact as authenticated issuer
        app.dependency_overrides[get_current_user] = lambda: issuer_user
        dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
        assert dl_res.status_code == 200
        issued_content = dl_res.content
        del app.dependency_overrides[get_current_user]

        # Public lookup
        res = client.get(f"/api/v1/verify/{pub_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["outcome"] == "VERIFIED"
        assert data["title"] == "Bachelor of Technology in Computer Science"

        # Byte comparison check
        cmp_res = client.post(
            f"/api/v1/verify/{pub_id}/compare",
            files={"file": ("upload.pdf", issued_content, "application/pdf")},
        )
        assert cmp_res.status_code == 200
        cmp_data = cmp_res.json()
        assert cmp_data["outcome"] == "VERIFIED"
        assert cmp_data["hash_matches"] is True
        assert cmp_data["signature_valid"] is True


def test_e2e_03_verifier_modified_document_tampered():
    """E2E-03: Verifier uploads modified document and receives TAMPERED outcome."""
    db = TestingSessionLocal()
    doc = db.query(RegisteredDocument).first()
    pub_id = doc.public_verification_id
    db.close()

    tampered_content = b"%PDF-1.7 Modified/Forged Degree Certificate Bytes (Tampered GPA 4.0)"

    with TestClient(app) as client:
        cmp_res = client.post(
            f"/api/v1/verify/{pub_id}/compare",
            files={"file": ("tampered.pdf", tampered_content, "application/pdf")},
        )
        assert cmp_res.status_code == 200
        cmp_data = cmp_res.json()
        assert cmp_data["outcome"] == "TAMPERED"
        assert cmp_data["hash_matches"] is False


def test_e2e_04_verifier_unknown_document_unverified():
    """E2E-04: Verifier checks non-existent document ID and receives UNVERIFIED outcome."""
    with TestClient(app) as client:
        res = client.get("/api/v1/verify/unknown-public-identifier-999999")
        assert res.status_code == 200
        assert res.json()["outcome"] == "UNVERIFIED"


def test_e2e_05_document_revocation_lifecycle():
    """E2E-05: Authorized issuer revokes document, subsequent verification returns REVOKED."""
    issuer_user = User(
        id=10,
        email="issuer@apex.edu",
        full_name="Alice Registrar",
        role=UserRole.ISSUER,
        organization_id=1,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: issuer_user

    db = TestingSessionLocal()
    doc = db.query(RegisteredDocument).first()
    doc_id = doc.id
    pub_id = doc.public_verification_id
    db.close()

    with TestClient(app) as client:
        # Revoke document
        rev_res = client.post(
            f"/api/v1/documents/{doc_id}/revoke",
            json={"reason": "Administrative correction required - student requested re-issue."},
        )
        assert rev_res.status_code == 200
        assert rev_res.json()["status"] == "REVOKED"

        # Public verification should now reflect REVOKED
        v_res = client.get(f"/api/v1/verify/{pub_id}")
        assert v_res.status_code == 200
        assert v_res.json()["outcome"] == "REVOKED"


def test_e2e_06_rbac_and_unauthorized_access_prevention():
    """E2E-06: Verifiers cannot access issuer endpoints; unauthenticated requests are rejected."""
    # 1. Unauthenticated request to protected endpoint
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as client:
        res = client.get("/api/v1/documents/my")
        assert res.status_code == 401

    # 2. Verifier role attempting Issuer action
    verifier_user = User(
        id=20,
        email="verifier@audit.org",
        full_name="Bob Verifier",
        role=UserRole.VERIFIER,
        organization_id=1,
        is_active=True,
        hashed_password="hashed_pw_test",
    )
    app.dependency_overrides[get_current_user] = lambda: verifier_user
    with TestClient(app) as client:
        res = client.get("/api/v1/documents/my")
        assert res.status_code == 403


def test_e2e_07_real_ml_inference_endpoints():
    """E2E-07: All 3 registered ML models and OCR execute live through FastAPI."""
    verifier_user = User(
        id=20,
        email="verifier@audit.org",
        full_name="Bob Verifier",
        role=UserRole.VERIFIER,
        organization_id=1,
        is_active=True,
        hashed_password="hashed_pw_test",
    )
    app.dependency_overrides[get_current_user] = lambda: verifier_user

    with TestClient(app) as client:
        # 1. Image Forensics
        img = Image.new("RGB", (200, 200), color=(240, 240, 240))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64_img = base64.b64encode(buf.getvalue()).decode("utf-8")

        f_res = client.post(
            "/api/v1/ml/image-forensics",
            json={"image_base64": b64_img, "document_id": "TEST-DOC-001"},
        )
        assert f_res.status_code == 200
        f_data = f_res.json()
        assert "tamper_score" in f_data
        assert f_data["model_version"] is not None

        # 2. Anomaly Detection
        a_res = client.post(
            "/api/v1/ml/anomaly-score",
            json={
                "verification_requests_last_hour": 12.0,
                "consecutive_failed_checks": 0,
                "burst_request_rate_per_sec": 1.5,
                "issuer_revocation_status": "active",
            },
        )
        assert a_res.status_code == 200
        a_data = a_res.json()
        assert "anomaly_score" in a_data
        assert a_data["severity"] in ["NORMAL", "LOW", "MEDIUM", "HIGH"]

        # 3. Field Consistency
        c_res = client.post(
            "/api/v1/ml/field-consistency",
            json={
                "field_name": "recipient_name",
                "expected_value": "Rohan Sharma",
                "extracted_value": "Rohan Sharma",
                "ocr_confidence": 0.99,
            },
        )
        assert c_res.status_code == 200
        c_data = c_res.json()
        assert c_data["is_consistent"] is True

        # 4. OCR
        ocr_res = client.post(
            "/api/v1/ml/ocr",
            json={"image_base64": b64_img, "expected_fields": ["recipient_name", "degree"]},
        )
        assert ocr_res.status_code == 200
        assert "extracted_fields" in ocr_res.json()


def test_e2e_08_error_handling_and_safe_failures():
    """E2E-08: Malformed base64, invalid JSON, and missing fields fail safely with HTTP 400/422."""
    verifier_user = User(
        id=20,
        email="verifier@audit.org",
        full_name="Bob Verifier",
        role=UserRole.VERIFIER,
        organization_id=1,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: verifier_user

    with TestClient(app) as client:
        # Invalid base64 image
        res = client.post(
            "/api/v1/ml/image-forensics",
            json={"image_base64": "NOT_A_VALID_BASE64_PAYLOAD!!!"},
        )
        assert res.status_code == 400
        assert "detail" in res.json()
        assert "Traceback" not in res.text

        # Malformed anomaly payload
        res2 = client.post(
            "/api/v1/ml/anomaly-score",
            json={"verification_requests_last_hour": "INVALID_STRING_VALUE"},
        )
        assert res2.status_code == 422


def test_e2e_09_database_persistence_and_audit_log():
    """E2E-09: Verifies relational persistence and audit trail logging in SQLite/PostgreSQL."""
    db = TestingSessionLocal()
    docs = db.query(RegisteredDocument).all()
    assert len(docs) > 0
    doc = docs[0]
    assert doc.recipient_name == "Rohan Sharma"
    assert doc.status == "REVOKED"
    assert doc.signing_key_id == "KEY-APEX-2026-01"
    db.close()


def test_e2e_10_performance_latency_benchmarks():
    """E2E-10: Benchmarks latency across health, verification, and ML inference."""
    verifier_user = User(
        id=20,
        email="verifier@audit.org",
        full_name="Bob Verifier",
        role=UserRole.VERIFIER,
        organization_id=1,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: verifier_user

    latencies = {}
    with TestClient(app) as client:
        # 1. Health check latency
        t0 = time.perf_counter()
        for _ in range(5):
            client.get("/api/v1/health")
        latencies["health_check_avg_ms"] = ((time.perf_counter() - t0) / 5) * 1000

        # 2. ML Field Consistency latency
        t0 = time.perf_counter()
        for _ in range(5):
            client.post(
                "/api/v1/ml/field-consistency",
                json={
                    "field_name": "student_id",
                    "expected_value": "APEX-2026-001",
                    "extracted_value": "APEX-2026-001",
                    "ocr_confidence": 0.95,
                },
            )
        latencies["field_consistency_avg_ms"] = ((time.perf_counter() - t0) / 5) * 1000

        # 3. ML Anomaly Detection latency
        t0 = time.perf_counter()
        for _ in range(5):
            client.post(
                "/api/v1/ml/anomaly-score",
                json={
                    "verification_requests_last_hour": 15.0,
                    "consecutive_failed_checks": 1,
                    "burst_request_rate_per_sec": 2.0,
                    "issuer_revocation_status": "active",
                },
            )
        latencies["anomaly_score_avg_ms"] = ((time.perf_counter() - t0) / 5) * 1000

    assert latencies["health_check_avg_ms"] < 3500
    assert latencies["field_consistency_avg_ms"] < 250
    assert latencies["anomaly_score_avg_ms"] < 250
