"""
VeriProof - Complete QR Code Issuance, Physical Scan Calibration, Multi-Signal Verification, and Email Dispatch Test Suite.
"""

import io
import json
import os
import secrets
import tempfile
from datetime import date, datetime, timezone

import cv2
import numpy as np
import pymupdf
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.audit import AuditEvent
from app.models.organization import Organization, RegisteredDocument
from app.models.user import User, UserRole
from app.services.document_crypto_service import document_crypto_service
from app.services.email_dispatch_service import email_dispatch_service
from app.services.qr_service import qr_service


# Test SQLite in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
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


def make_dummy_pdf(title: str = "Test Certificate") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)  # A4
    page.insert_text((50, 100), f"VeriProof Official Document: {title}", fontsize=16)
    page.insert_text((50, 140), "Authorized Digital Credential for Antigravity Verification Testing", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def make_dummy_png() -> bytes:
    img = Image.new("RGB", (600, 800), color=(245, 245, 250))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    settings.TESTING = True

    # Seed test organization and users
    db = TestingSessionLocal()
    org = Organization(
        name="Global Tech University",
        legal_name="Global Tech University Inc",
        org_type="UNIVERSITY",
        registration_number=f"REG-ORG-{secrets.token_hex(4)}",
        official_email="contact@globaltech.edu",
        authorized_representative_name="Dr. Alan Turing",
        status="ACTIVE",
    )
    db.add(org)
    db.flush()

    issuer_user = User(
        email="issuer.qr@globaltech.edu",
        full_name="Dr. Alan Turing",
        hashed_password=hash_password("IssuerPass123!"),
        role=UserRole.ISSUER,
        organization_id=org.id,
        is_active=True,
    )
    verifier_user = User(
        email="verifier.qr@auditcorp.com",
        full_name="Agent Smith",
        hashed_password=hash_password("VerifierPass123!"),
        role=UserRole.VERIFIER,
        is_active=True,
    )
    db.add(issuer_user)
    db.add(verifier_user)
    db.commit()
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_token(email: str, role: str = "", org_id: int | None = None) -> str:
    return create_access_token(email)


def test_qr_generation_canonical_url():
    """Verify QR code generation from deterministic canonical verification URLs."""
    url = qr_service.canonical_verification_url("TEST-PUBLIC-ID-12345")
    assert "/verify/TEST-PUBLIC-ID-12345" in url

    png_bytes = qr_service.generate_qr_png_bytes(url)
    assert len(png_bytes) > 100
    assert png_bytes.startswith(b"\x89PNG")

    svg_data = qr_service.generate_qr_svg_data_url(url)
    assert svg_data.startswith("data:image/svg+xml;base64,")


def test_qr_embed_in_pdf():
    """Verify QR code is properly embedded in bottom-right corner of multi-page PDF."""
    pdf_bytes = make_dummy_pdf("Master Diploma")
    url = qr_service.canonical_verification_url("VP-2026-TEST-DIPLOMA")

    embedded_pdf = qr_service.embed_qr_in_pdf(pdf_bytes, url)
    assert len(embedded_pdf) > len(pdf_bytes)
    assert embedded_pdf.startswith(b"%PDF-")

    # Decode QR from embedded PDF
    decode_result = qr_service.decode_qr_from_bytes(embedded_pdf, filename="diploma.pdf")
    assert decode_result.success is True
    assert decode_result.raw_text == url
    assert decode_result.public_verification_id == "VP-2026-TEST-DIPLOMA"
    assert decode_result.is_trusted_domain is True


def test_qr_embed_in_image():
    """Verify QR code is embedded into raster PNG image."""
    png_bytes = make_dummy_png()
    url = qr_service.canonical_verification_url("VP-2026-IMAGE-CERT")

    embedded_png = qr_service.embed_qr_in_image(png_bytes, url, format_ext="PNG")
    assert embedded_png.startswith(b"\x89PNG")

    decode_result = qr_service.decode_qr_from_bytes(embedded_png, filename="cert.png")
    assert decode_result.success is True
    assert decode_result.public_verification_id == "VP-2026-IMAGE-CERT"


def test_physical_scan_calibration_protocol():
    """Execute 12-stage simulated scan degradation matrix and verify recovery resilience."""
    res = qr_service.run_physical_scan_calibration_protocol()
    assert res["total_scenarios"] == 12
    assert res["passed_scenarios"] >= 10
    assert res["recovery_rate_percent"] >= 80.0
    assert res["status"] == "PASS"


def test_issuer_registration_with_embedded_qr():
    """Full lifecycle: Register document -> PDF contains embedded QR -> SHA-256 covers QR-bearing bytes."""
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    token = get_token("issuer.qr@globaltech.edu", "ISSUER", org.id)
    db.close()

    pdf_bytes = make_dummy_pdf("Stanford Engineering Degree")
    files = {"file": ("degree.pdf", pdf_bytes, "application/pdf")}
    data = {
        "title": "Stanford Engineering Degree",
        "document_type": "Degree",
        "issue_date": str(date.today()),
        "recipient_name": "Alexandra Chen",
        "recipient_identifier": "STF-9921",
        "recipient_email": "alex.chen@stanford.edu",
    }

    response = client.post(
        "/api/v1/documents/register",
        headers={"Authorization": f"Bearer {token}"},
        data=data,
        files=files,
    )
    assert response.status_code == 201
    resp_data = response.json()
    doc_id = resp_data["document_id"]
    pub_id = resp_data["public_verification_id"]
    registered_sha = resp_data["sha256_hash"]

    # 1. Download registered file
    dl_resp = client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert dl_resp.status_code == 200
    downloaded_bytes = dl_resp.content

    # 2. Verify downloaded bytes hash matches registered hash
    import hashlib
    computed_sha = hashlib.sha256(downloaded_bytes).hexdigest()
    assert computed_sha == registered_sha

    # 3. Decode QR from downloaded bytes
    decode_res = qr_service.decode_qr_from_bytes(downloaded_bytes, filename="downloaded.pdf")
    assert decode_res.success is True
    assert decode_res.public_verification_id == pub_id

    # 4. Public Verification endpoint check
    pub_resp = client.get(f"/api/v1/verify/{pub_id}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()
    assert pub_data["outcome"] == "VERIFIED"
    assert pub_data["sha256_hash"] == registered_sha

    # 5. Multi-signal compare endpoint with genuine downloaded artifact
    compare_resp = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("verified.pdf", downloaded_bytes, "application/pdf")},
    )
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    assert comp_data["outcome"] == "VERIFIED"
    assert comp_data["hash_matches"] is True


def test_verify_tampered_document_mismatch():
    """Verify altered document bytes produce TAMPERED status on comparison endpoint."""
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    token = get_token("issuer.qr@globaltech.edu", "ISSUER", org.id)
    db.close()

    pdf_bytes = make_dummy_pdf("Original Medical License")
    files = {"file": ("med_license.pdf", pdf_bytes, "application/pdf")}
    data = {
        "title": "Medical License",
        "document_type": "License",
        "issue_date": str(date.today()),
        "recipient_name": "Dr. Marcus Vance",
        "recipient_identifier": "MED-90924",
        "recipient_email": "m.vance@health.org",
    }

    reg_resp = client.post(
        "/api/v1/documents/register",
        headers={"Authorization": f"Bearer {token}"},
        data=data,
        files=files,
    )
    assert reg_resp.status_code == 201
    pub_id = reg_resp.json()["public_verification_id"]

    # Download genuine artifact
    dl_resp = client.get(
        f"/api/v1/documents/{reg_resp.json()['document_id']}/download",
        headers={"Authorization": f"Bearer {token}"},
    )
    genuine_bytes = dl_resp.content

    # Tamper with document content (modify text / bytes)
    tampered_bytes = bytearray(genuine_bytes)
    tampered_bytes[len(tampered_bytes) // 2] = (tampered_bytes[len(tampered_bytes) // 2] + 1) % 256

    compare_resp = client.post(
        f"/api/v1/verify/{pub_id}/compare",
        files={"file": ("tampered.pdf", bytes(tampered_bytes), "application/pdf")},
    )
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    assert comp_data["outcome"] == "TAMPERED"
    assert comp_data["hash_matches"] is False


def test_copied_qr_code_tamper_detection():
    """Verify copying a genuine QR onto another unverified document fails cryptographic check."""
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    token = get_token("issuer.qr@globaltech.edu", "ISSUER", org.id)
    db.close()

    # Issue genuine document A
    pdf_a = make_dummy_pdf("Diploma A")
    resp_a = client.post(
        "/api/v1/documents/register",
        headers={"Authorization": f"Bearer {token}"},
        data={"title": "Diploma A", "document_type": "Degree", "issue_date": str(date.today()), "recipient_name": "Alice"},
        files={"file": ("diploma_a.pdf", pdf_a, "application/pdf")},
    )
    pub_id_a = resp_a.json()["public_verification_id"]

    # Create counterfeit document B but embed document A's QR code
    pdf_b = make_dummy_pdf("Forged Counterfeit Document")
    counterfeit_pdf = qr_service.embed_qr_in_pdf(pdf_b, qr_service.canonical_verification_url(pub_id_a))

    # Test compare against document A's public verification ID
    compare_resp = client.post(
        f"/api/v1/verify/{pub_id_a}/compare",
        files={"file": ("forged.pdf", counterfeit_pdf, "application/pdf")},
    )
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    # Even though QR code decoded matches document A's URL, the hash of counterfeit_pdf != registered hash of document A
    assert comp_data["outcome"] == "TAMPERED"
    assert comp_data["hash_matches"] is False


def test_email_dispatch_endpoint_rbac_and_dispatch():
    """Verify POST /documents/{id}/send-email dispatches email with QR-bearing attachment."""
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    issuer_token = get_token("issuer.qr@globaltech.edu", "ISSUER", org.id)
    verifier_token = get_token("verifier.qr@auditcorp.com", "VERIFIER")
    db.close()

    # Register document
    pdf_bytes = make_dummy_pdf("Employment Offer Letter")
    reg_resp = client.post(
        "/api/v1/documents/register",
        headers={"Authorization": f"Bearer {issuer_token}"},
        data={
            "title": "Employment Offer Letter",
            "document_type": "OfferLetter",
            "issue_date": str(date.today()),
            "recipient_name": "Samantha Reed",
            "recipient_email": "samantha.reed@cloudtech.io",
        },
        files={"file": ("offer.pdf", pdf_bytes, "application/pdf")},
    )
    doc_id = reg_resp.json()["document_id"]

    # 1. Non-issuer role is blocked (403 Forbidden)
    forbidden_resp = client.post(
        f"/api/v1/documents/{doc_id}/send-email",
        headers={"Authorization": f"Bearer {verifier_token}"},
        json={"recipient_email": "samantha.reed@cloudtech.io"},
    )
    assert forbidden_resp.status_code == 403

    # 2. Issuer dispatches email (in testing mode -> DELIVERED)
    send_resp = client.post(
        f"/api/v1/documents/{doc_id}/send-email",
        headers={"Authorization": f"Bearer {issuer_token}"},
        json={"recipient_email": "samantha.reed@cloudtech.io", "custom_message": "Welcome to our engineering team!"},
    )
    assert send_resp.status_code == 200
    send_data = send_resp.json()
    assert send_data["status"] in ("DELIVERED", "PROVIDER_ACCEPTED")
    assert send_data["recipient_email"] == "samantha.reed@cloudtech.io"
    assert "provider_message_id" in send_data


def test_email_dispatch_blocked_for_revoked_doc():
    """Verify attempting to send email for a revoked document returns 400 Bad Request."""
    db = TestingSessionLocal()
    org = db.query(Organization).first()
    token = get_token("issuer.qr@globaltech.edu", "ISSUER", org.id)
    db.close()

    # Register and revoke document
    pdf_bytes = make_dummy_pdf("Temporary Certificate")
    reg_resp = client.post(
        "/api/v1/documents/register",
        headers={"Authorization": f"Bearer {token}"},
        data={"title": "Temporary Certificate", "document_type": "Certificate", "issue_date": str(date.today()), "recipient_email": "john@test.com"},
        files={"file": ("temp.pdf", pdf_bytes, "application/pdf")},
    )
    doc_id = reg_resp.json()["document_id"]

    client.post(
        f"/api/v1/documents/{doc_id}/revoke",
        headers={"Authorization": f"Bearer {token}"},
        json={"reason": "Security credential deprecated and replaced."},
    )

    # Attempt to send email on revoked doc
    send_resp = client.post(
        f"/api/v1/documents/{doc_id}/send-email",
        headers={"Authorization": f"Bearer {token}"},
        json={"recipient_email": "john@test.com"},
    )
    assert send_resp.status_code == 400
    assert "revoked" in send_resp.json()["detail"].lower()


def test_qr_decode_endpoint():
    """Test POST /api/v1/documents/decode-qr endpoint."""
    pdf_bytes = make_dummy_pdf("Test Document for QR Decode")
    url = qr_service.canonical_verification_url("TEST-DECODE-ENDPOINT-ID-99")
    final_pdf = qr_service.embed_qr_in_pdf(pdf_bytes, url)

    response = client.post(
        "/api/v1/documents/decode-qr",
        files={"file": ("test.pdf", final_pdf, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["public_verification_id"] == "TEST-DECODE-ENDPOINT-ID-99"
    assert data["is_trusted_domain"] is True
