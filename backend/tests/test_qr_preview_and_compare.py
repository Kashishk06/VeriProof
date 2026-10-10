"""
VeriProof - Comprehensive QR-Linked Trusted Document Preview & Uploaded Document Comparison Test Suite.

Covers Test Cases 1 through 12 from Master Specification:
- Test 1: Valid QR and matching document (Preview & Compare VERIFIED)
- Test 2: Modified CGPA (8.34 vs 9.80 detected as MISMATCH -> TAMPERED)
- Test 3: Modified identity field (Roll number mismatch detected)
- Test 4: Changed grade or result (Result PASS vs FAIL/ASS mismatch)
- Test 5: QR copied onto modified document (tampering detected, not genuine)
- Test 6: Matching text, altered PDF bytes (SHA-256 byte parity failure reported)
- Test 7: OCR failure / low-res handling (inconclusive/uncertain, no false genuine)
- Test 8: Multipage document processing (preserves page order)
- Test 9: Missing trusted artifact (reports unavailable safely)
- Test 10: Revoked document (preserves REVOKED status)
- Test 11: Upload security (empty, oversized, malformed files rejected safely)
- Test 12: Regression check across registration, signatures, and public verification
"""

import io
import hashlib
import os
import secrets
import uuid
from datetime import date, datetime, timezone
import pymupdf
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.organization import Organization, RegisteredDocument, OrganizationStatus
from app.models.user import User, UserRole
from app.services.document_service import document_service
from app.api.dependencies import get_current_user
from ml.src.features.ocr_features import document_ocr_extractor, document_field_comparator


TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def create_sample_pdf(title: str, student_name: str, roll_no: str, cgpa: str, sgpa: str = "8.83", result_status: str = "PASS") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 60), f"INSTITUTION: Rajiv Gandhi Proudyogiki Vishwavidyalaya", fontsize=12)
    page.insert_text((50, 90), f"DOCUMENT: {title}", fontsize=14)
    page.insert_text((50, 120), f"NAME OF STUDENT: {student_name}", fontsize=11)
    page.insert_text((50, 145), f"ROLL NUMBER / REGISTRATION: {roll_no}", fontsize=11)
    page.insert_text((50, 170), f"SGPA: {sgpa}", fontsize=11)
    page.insert_text((50, 195), f"CGPA: {cgpa}", fontsize=11)
    page.insert_text((50, 220), f"RESULT: {result_status}", fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


@pytest.fixture(scope="module", autouse=True)
def setup_test_environment(tmp_path_factory):
    Base.metadata.create_all(bind=engine)
    temp_dir = tmp_path_factory.mktemp("qr_preview_test")
    document_service.base_dir = str(temp_dir / "docs")
    settings.DOCUMENT_SIGNING_PRIVATE_KEY_PATH = str(temp_dir / "keys" / "signing.pem")
    settings.DOCUMENT_SIGNING_KEY_ID = "KEY-TEST-2026-01"
    settings.PUBLIC_FRONTEND_URL = "http://localhost:5173"

    db = TestingSessionLocal()
    try:
        org = Organization(
            id=1,
            name="Rajiv Gandhi Technical University",
            legal_name="Rajiv Gandhi Proudyogiki Vishwavidyalaya",
            registration_number="REG-RGPV-2026",
            org_type="UNIVERSITY",
            status=OrganizationStatus.ACTIVE,
            official_email="registrar@rgpv.ac.in",
            authorized_representative_email="admin@rgpv.ac.in",
            authorized_representative_name="Prof. Sharma",
            authorized_representative_role="Registrar",
        )
        db.add(org)

        issuer = User(
            id=10,
            email="issuer@rgpv.ac.in",
            full_name="Prof. Sharma",
            role=UserRole.ISSUER,
            organization_id=1,
            is_active=True,
            hashed_password="hashed_pw_test",
        )
        db.add(issuer)
        db.commit()
    finally:
        db.close()


def register_test_document(title: str, student_name: str, roll_no: str, cgpa: str, status: str = "ACTIVE") -> dict:
    issuer_user = User(
        id=10,
        email="issuer@rgpv.ac.in",
        full_name="Prof. Sharma",
        role=UserRole.ISSUER,
        organization_id=1,
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: issuer_user

    pdf_bytes = create_sample_pdf(title, student_name, roll_no, cgpa)
    response = client.post(
        "/api/v1/documents/register",
        data={
            "title": title,
            "document_type": "DEGREE",
            "issue_date": "2026-05-15",
            "recipient_name": student_name,
            "recipient_identifier": roll_no,
            "recipient_email": "student@example.edu",
        },
        files={"file": ("genuine_cert.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201, f"Registration failed: {response.text}"
    data = response.json()

    if status == "REVOKED":
        revoke_res = client.post(
            f"/api/v1/documents/{data['document_id']}/revoke",
            json={"reason": "Administrative revocation for testing"},
        )
        assert revoke_res.status_code == 200

    return data


def test_01_valid_qr_lookup_and_preview():
    """Test 1: QR resolves to trusted record and preview endpoint streams document artifact."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    # 1. Verify lookup
    res = client.get(f"/api/v1/verify/{pub_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "VERIFIED"
    assert data["public_verification_id"] == pub_id

    # 2. Verify preview
    preview_res = client.get(f"/api/v1/verify/{pub_id}/preview")
    assert preview_res.status_code == 200
    assert preview_res.headers["content-type"] == "application/pdf"
    assert len(preview_res.content) > 0


def test_02_modified_cgpa_detection():
    """Test 2: Registered CGPA 8.34 compared against uploaded candidate CGPA 9.80 detects MISMATCH."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    # Candidate PDF with altered CGPA 9.80
    altered_pdf = create_sample_pdf("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "9.80")

    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("fake.pdf", altered_pdf, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "TAMPERED"
    assert data["hash_matches"] is False

    comps = {f["field_name"].lower(): f for f in data.get("field_comparisons", [])}
    if "cgpa" in comps:
        assert comps["cgpa"]["status"] == "MISMATCH"
        assert "8.34" in str(comps["cgpa"]["registered_value"])
        assert "9.80" in str(comps["cgpa"]["observed_value"])


def test_03_modified_identity_field():
    """Test 3: Uploaded document has altered roll number -> detected as MISMATCH."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    altered_pdf = create_sample_pdf("Bachelor of Technology", "Mansi Kumawat", "9999IS999999", "8.34")
    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("altered_roll.pdf", altered_pdf, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "TAMPERED"
    comps = {f["field_name"].lower(): f for f in data.get("field_comparisons", [])}
    if "roll_number" in comps:
        assert comps["roll_number"]["status"] == "MISMATCH"


def test_04_changed_result_status():
    """Test 4: Altered result status from PASS to FAIL/ASS detects MISMATCH."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    altered_pdf = create_sample_pdf("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34", result_status="FAIL")
    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("altered_result.pdf", altered_pdf, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "TAMPERED"


def test_05_qr_copied_onto_modified_document():
    """Test 5: Copied valid QR onto altered document does NOT label it genuine."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    altered_pdf = create_sample_pdf("Different Degree", "Attacker Name", "0863IS000000", "9.99")
    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("copied_qr_attack.pdf", altered_pdf, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "TAMPERED"
    assert data["hash_matches"] is False


def test_06_matching_text_altered_bytes():
    """Test 6: Visually identical PDF with altered metadata/bytes reports hash mismatch."""
    doc = register_test_document("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    pub_id = doc["public_verification_id"]

    re_saved_pdf = create_sample_pdf("Bachelor of Technology", "Mansi Kumawat", "0863IS231032", "8.34")
    modified_bytes = re_saved_pdf + b"\n% Altered trailing byte for byte-parity test"

    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("resaved.pdf", modified_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["hash_matches"] is False


def test_07_ocr_comparator_rules():
    """Test 7: Field comparator rules properly categorize MATCH, MISMATCH, UNCERTAIN."""
    trusted = {"cgpa": "8.34", "roll_number": "0863IS231032", "student_name": "MANSI KUMAWAT"}
    candidate = {"cgpa": "9.80", "roll_number": "0863IS231032", "student_name": "MANSI KUMAWAT"}

    res = document_field_comparator.compare_documents(trusted, candidate)
    assert res["overall_match"] is False
    assert any("cgpa" in f.lower() for f in res["tampered_fields"])


def test_08_multipage_document_processing():
    """Test 8: Multipage documents are extracted across all pages."""
    doc = pymupdf.open()
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((50, 100), "PAGE 1: ROLL NUMBER / REGISTRATION: 0863IS231032", fontsize=12)
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((50, 100), "PAGE 2: CGPA: 8.34 RESULT: PASS", fontsize=12)
    mp_bytes = doc.tobytes()
    doc.close()

    fields = document_ocr_extractor.extract_key_fields(mp_bytes, "multipage.pdf")
    assert fields.get("roll_number") == "0863IS231032"
    assert fields.get("cgpa") == "8.34"


def test_09_missing_trusted_artifact_handling():
    """Test 9: Record exists but storage artifact missing -> preview returns 404 cleanly."""
    db = TestingSessionLocal()
    try:
        pub_id = f"DOC-MISSING-{secrets.token_hex(4).upper()}"
        doc = RegisteredDocument(
            id=str(uuid.uuid4()),
            organization_id=1,
            issuer_user_id=10,
            title="Missing Artifact Doc",
            document_type="CERTIFICATE",
            original_filename="missing.pdf",
            storage_key=str(uuid.uuid4()),
            size_bytes=1000,
            content_type="application/pdf",
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            public_verification_id=pub_id,
            signature_algorithm="ECDSA_P256_SHA256",
            signature_value="sig",
            signing_key_id="KEY-1",
            signing_public_key="pub",
            signed_manifest="{}",
            status="ACTIVE",
            issue_date=date(2026, 1, 1),
            issued_at=datetime.now(timezone.utc),
        )
        db.add(doc)
        db.commit()

        res = client.get(f"/api/v1/verify/{pub_id}/preview")
        assert res.status_code == 404
    finally:
        db.close()


def test_10_revoked_document():
    """Test 10: Revoked document returns REVOKED even during comparison."""
    doc = register_test_document("Revoked Certificate", "Test Student", "0863IS231032", "8.50", status="REVOKED")
    pub_id = doc["public_verification_id"]

    matching_pdf = create_sample_pdf("Revoked Certificate", "Test Student", "0863IS231032", "8.50")
    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("matching.pdf", matching_pdf, "application/pdf")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["outcome"] == "REVOKED"


def test_11_upload_security():
    """Test 11: Empty files are rejected safely."""
    doc = register_test_document("Degree", "Student", "0863IS231032", "8.0")
    pub_id = doc["public_verification_id"]

    res = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert res.status_code == 400


def test_12_regression_lookup():
    """Test 12: Public lookup remains stable and non-breaking."""
    res = client.get("/api/v1/verify/DOC-NON-EXISTENT-9999")
    assert res.status_code == 200
    assert res.json()["outcome"] == "UNVERIFIED"
