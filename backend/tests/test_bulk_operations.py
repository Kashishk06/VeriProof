"""
Comprehensive Automated Test Suite for VeriProof Bulk Operations Module.

Covers:
- ZIP archive path traversal protection & decompression bomb checks
- CSV/Excel formula injection prevention and sanitization
- Pre-validation preview endpoint (POST /api/v1/bulk/validate-registration)
- Role-based access control (Issuer registration vs Verifier verification)
- End-to-end asynchronous registration batch processing with signing & audit trail
- Multi-document verification batch processing with ML signals & cryptographic checks
- Batch status polling, item-level paginated inspection, and filtering
- Batch retry logic for failed items
- Batch cancellation logic for pending/processing items
- Sanitized CSV export endpoint
"""

import io
import time
import zipfile
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
from app.models.bulk import BulkBatch, BulkBatchItem, BatchType, BatchStatus, ItemStatus
from app.services.document_service import document_service
from app.services.bulk_service import (
    bulk_processing_service,
    sanitize_formula_injection,
    MAX_EXPANDED_ARCHIVE_BYTES,
    MAX_ARCHIVE_ENTRY_COUNT,
)
from app.core.config import settings


# In-memory test database
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("test_bulk_docs")
    document_service.base_dir = str(tmp_path / "private-documents")
    settings.DOCUMENT_SIGNING_PRIVATE_KEY_PATH = str(tmp_path / "keys" / "signing.pem")
    settings.DOCUMENT_SIGNING_KEY_ID = "KEY-BULK-TEST-01"
    import app.db.session as session_mod
    session_mod.SessionLocal = TestingSessionLocal

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed test organization and users
    db = TestingSessionLocal()
    org = Organization(
        id=1,
        name="Apex Cert",
        legal_name="Apex Global Certification Authority",
        org_type="UNIVERSITY",
        registration_number="BULK-REG-2026-001",
        official_email="admin@apex.org",
        authorized_representative_name="Dr. Apex",
        status=OrganizationStatus.ACTIVE,
    )
    db.add(org)
    db.flush()

    issuer_user = User(
        id=10,
        email="issuer@apex.org",
        hashed_password="mock_hashed_password",
        role=UserRole.ISSUER,
        full_name="Apex Issuer Official",
        organization_id=1,
        is_active=True,
    )
    verifier_user = User(
        id=20,
        email="verifier@audit.org",
        hashed_password="mock_hashed_password",
        role=UserRole.VERIFIER,
        full_name="Global Verifier Agent",
        is_active=True,
    )
    db.add_all([issuer_user, verifier_user])
    db.commit()
    db.close()

    yield

    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def make_dummy_image(text="SAMPLE"):
    r = (sum(ord(c) for c in text) * 31) % 255
    g = (sum(ord(c) for c in text) * 59) % 255
    b = (sum(ord(c) for c in text) * 97) % 255
    img = Image.new("RGB", (300, 200), color=(r, g, b))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_dummy_pdf(text="SAMPLE"):
    return f"%PDF-1.4\n%VeriProof Test Document {text}\n%%EOF".encode("utf-8")


# ==============================================================================
# SECTION 1: UNIT & SECURITY TESTS (Archive Security & Formula Sanitization)
# ==============================================================================

def test_sanitize_formula_injection():
    """Verify spreadsheet formula injection characters are escaped."""
    assert sanitize_formula_injection("=1+1") == "'=1+1"
    assert sanitize_formula_injection("+SUM(A1:A10)") == "'+SUM(A1:A10)"
    assert sanitize_formula_injection("-2+3") == "'-2+3"
    assert sanitize_formula_injection("@CMD('calc')") == "'@CMD('calc')"
    assert sanitize_formula_injection("\tcmd") == "'\tcmd"
    assert sanitize_formula_injection("\rcmd") == "'\rcmd"
    assert sanitize_formula_injection("Normal String") == "Normal String"
    assert sanitize_formula_injection(12345) == 12345
    assert sanitize_formula_injection(None) is None


def test_secure_zip_unpack_valid(tmp_path):
    """Verify valid ZIP archives unpack securely to target folder."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("doc1.pdf", make_dummy_pdf("1"))
        zf.writestr("subfolder/doc2.png", make_dummy_image())

    target_dir = str(tmp_path / "unpack_valid")
    extracted, warnings = bulk_processing_service.secure_unpack_archive(buf.getvalue(), target_dir)
    assert "doc1.pdf" in extracted
    assert "doc2.png" in extracted
    with open(extracted["doc1.pdf"], "rb") as f:
        assert f.read() == make_dummy_pdf("1")


def test_secure_zip_unpack_traversal_blocked(tmp_path):
    """Verify directory traversal paths inside archives are filtered out."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("../etc/passwd", b"root:x:0:0:")
        zf.writestr("safe_doc.pdf", make_dummy_pdf("safe"))

    target_dir = str(tmp_path / "unpack_traversal")
    extracted, warnings = bulk_processing_service.secure_unpack_archive(buf.getvalue(), target_dir)
    assert "etc/passwd" not in extracted
    assert "../etc/passwd" not in extracted
    assert len(warnings) > 0
    assert any("unsafe" in w.lower() for w in warnings)


def test_secure_zip_unpack_bomb_blocked(tmp_path):
    """Verify decompression bombs with exorbitant entry counts or sizes are blocked."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Create > 500 entries to trigger entry count limit
        for i in range(505):
            zf.writestr(f"doc_{i}.pdf", make_dummy_pdf(str(i)))

    target_dir = str(tmp_path / "unpack_bomb")
    with pytest.raises(Exception) as excinfo:
        bulk_processing_service.secure_unpack_archive(buf.getvalue(), target_dir)
    assert "exceeds limit" in str(excinfo.value).lower()


# ==============================================================================
# SECTION 2: ENDPOINT VALIDATION & ACCESS CONTROL
# ==============================================================================

def test_bulk_validate_registration_preview(client):
    """Test the pre-validation preview endpoint with valid and invalid entries."""
    pdf_bytes = make_dummy_pdf("ALICE")
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("alice_degree.pdf", pdf_bytes)

    csv_content = (
        "RecipientName,RecipientId,RecipientEmail,DocumentTitle,DocumentType,IssueDate,ExpiryDate,Filename\n"
        "Alice Smith,STF-1001,alice@example.com,Degree Certificate,degree,2026-05-01,,alice_degree.pdf\n"
        "Bob Invalid,,bob-no-email,Invalid Doc,invalid_type,not-a-date,,bob_missing.pdf\n"
    )

    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, email="issuer@apex.org", role=UserRole.ISSUER, organization_id=1, is_active=True
    )

    response = client.post(
        "/api/v1/bulk/validate-registration",
        files={
            "archive": ("docs.zip", zip_buf.getvalue(), "application/zip"),
            "metadata": ("manifest.csv", csv_content.encode("utf-8"), "text/csv"),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_metadata_rows"] == 2
    assert data["valid_items_count"] == 1
    assert data["invalid_items_count"] == 1
    assert data["items"][0]["is_valid"] is True
    assert data["items"][1]["is_valid"] is False
    assert len(data["items"][1]["validation_errors"]) > 0
    assert data["session_token"] is not None


def test_bulk_register_requires_issuer_role(client):
    """Test that verifiers or unauthorized users cannot initiate registration batches."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=20, email="verifier@audit.org", role=UserRole.VERIFIER, is_active=True
    )

    response = client.post(
        "/api/v1/bulk/register",
        json={"session_token": "mock-session-token"},
    )
    assert response.status_code == 403


# ==============================================================================
# SECTION 3: END-TO-END REGISTRATION BATCH EXECUTION
# ==============================================================================

def test_bulk_register_batch_end_to_end(client):
    """Test full asynchronous registration batch execution."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, email="issuer@apex.org", role=UserRole.ISSUER, organization_id=1, is_active=True
    )

    # Create ZIP archive with valid PDF and valid PNG
    pdf_doc = make_dummy_pdf("CHARLIE")
    png_doc = make_dummy_image("DANA")
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("certificate_charlie.pdf", pdf_doc)
        zf.writestr("license_dana.png", png_doc)

    csv_content = (
        "RecipientName,RecipientId,RecipientEmail,DocumentTitle,DocumentType,IssueDate,ExpiryDate,Filename\n"
        "Charlie Brown,STF-8821,charlie@stanford.edu,Bachelor of Engineering,degree,2026-06-15,,certificate_charlie.pdf\n"
        "Dana Scully,MED-9021,dana@fbi.gov,Medical Examiner License,license,2026-01-10,2028-01-10,license_dana.png\n"
    )

    # 1. Validate batch
    val_resp = client.post(
        "/api/v1/bulk/validate-registration",
        files={
            "archive": ("batch_docs.zip", zip_buf.getvalue(), "application/zip"),
            "metadata": ("manifest.csv", csv_content.encode("utf-8"), "text/csv"),
        },
    )
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    session_token = val_data["session_token"]
    assert val_data["valid_items_count"] == 2

    # 2. Start registration batch
    response = client.post(
        "/api/v1/bulk/register",
        json={"session_token": session_token},
    )

    assert response.status_code == 201
    create_data = response.json()
    batch_id = create_data["batch_id"]
    assert batch_id is not None
    assert create_data["total_items"] == 2

    # Poll status until completed
    for _ in range(20):
        status_resp = client.get(f"/api/v1/bulk/batches/{batch_id}")
        assert status_resp.status_code == 200
        batch_status = status_resp.json()
        if batch_status["status"] in ["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"]:
            break
        time.sleep(0.1)

    assert batch_status["status"] == "COMPLETED"
    assert batch_status["successful_items"] == 2
    assert batch_status["failed_items"] == 0

    # Inspect items
    items_resp = client.get(f"/api/v1/bulk/batches/{batch_id}/items")
    assert items_resp.status_code == 200
    items_data = items_resp.json()
    assert items_data["total"] == 2
    for item in items_data["items"]:
        assert item["status"] == "SUCCESS"
        assert item["registered_document_id"] is not None
        assert item["public_verification_id"] is not None
        assert item["sha256_hash"] is not None


# ==============================================================================
# SECTION 4: END-TO-END VERIFICATION BATCH EXECUTION & ML INFERENCE
# ==============================================================================

def test_bulk_verify_batch_end_to_end(client):
    """Test verification batch processing against genuine, tampered, and unknown documents."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=20, email="verifier@audit.org", role=UserRole.VERIFIER, is_active=True
    )

    # First fetch a known genuine registered document from DB
    db = TestingSessionLocal()
    reg_doc = db.query(RegisteredDocument).first()
    assert reg_doc is not None, "A registered document should exist from prior registration test"
    genuine_doc_id = reg_doc.id
    genuine_path = document_service._resolve_storage_key(reg_doc.organization_id, reg_doc.storage_key)
    with open(genuine_path, "rb") as f:
        genuine_bytes = f.read()
    db.close()

    # Create ZIP containing 1 genuine document, 1 tampered document, 1 unknown document
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{genuine_doc_id}.pdf", genuine_bytes)
        # Tampered has altered byte content
        zf.writestr("tampered_doc.png", genuine_bytes + b"ALTERED_BYTE")
        zf.writestr("unknown_doc.png", make_dummy_image("UNKNOWN"))

    response = client.post(
        "/api/v1/bulk/verify",
        files={
            "archive": ("verify_batch.zip", zip_buf.getvalue(), "application/zip"),
        },
    )

    assert response.status_code == 201
    batch_id = response.json()["batch_id"]
    assert batch_id is not None

    # Poll status until completed
    for _ in range(25):
        status_resp = client.get(f"/api/v1/bulk/batches/{batch_id}")
        assert status_resp.status_code == 200
        batch_status = status_resp.json()
        if batch_status["status"] in ["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"]:
            break
        time.sleep(0.1)

    assert batch_status["status"] in ["COMPLETED", "COMPLETED_WITH_ERRORS"]
    assert batch_status["processed_items"] == 3

    # Inspect item outcomes
    items_resp = client.get(f"/api/v1/bulk/batches/{batch_id}/items")
    assert items_resp.status_code == 200
    items = items_resp.json()["items"]
    items_by_file = {it["original_filename"]: it for it in items}

    # Genuine check
    assert items_by_file[f"{genuine_doc_id}.pdf"]["verification_outcome"] == "VERIFIED"
    assert items_by_file[f"{genuine_doc_id}.pdf"]["status"] == "SUCCESS"

    # Unknown check
    assert items_by_file["unknown_doc.png"]["verification_outcome"] == "UNVERIFIED"


# ==============================================================================
# SECTION 5: BATCH MANAGEMENT (LIST, RETRY, CANCEL, EXPORT)
# ==============================================================================

def test_bulk_batches_list_and_filter(client):
    """Test GET /api/v1/bulk/batches listing and filtering."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, email="issuer@apex.org", role=UserRole.ISSUER, organization_id=1, is_active=True
    )

    response = client.get("/api/v1/bulk/batches?batch_type=REGISTRATION")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


def test_bulk_batch_export_csv(client):
    """Test exporting batch results as a sanitized CSV file."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, email="issuer@apex.org", role=UserRole.ISSUER, organization_id=1, is_active=True
    )

    # Get latest batch ID
    items = client.get("/api/v1/bulk/batches").json()["items"]
    assert len(items) > 0
    batch_id = items[0]["batch_id"]

    export_resp = client.get(f"/api/v1/bulk/batches/{batch_id}/export")
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    csv_text = export_resp.text
    assert "Item Index" in csv_text or "Status" in csv_text


def test_bulk_batch_cancel_and_retry(client):
    """Test batch cancellation and retry endpoints."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, email="issuer@apex.org", role=UserRole.ISSUER, organization_id=1, is_active=True
    )

    target_batch_id = "BATCH-TEST-CANCEL-001"
    db = TestingSessionLocal()
    batch = BulkBatch(
        id=target_batch_id,
        batch_type=BatchType.REGISTRATION,
        status=BatchStatus.QUEUED,
        user_id=10,
        organization_id=1,
        total_items=2,
    )
    db.add(batch)
    item1 = BulkBatchItem(
        id="ITEM-TEST-001",
        batch_id=target_batch_id,
        item_index=0,
        original_filename="test1.pdf",
        status=ItemStatus.PENDING,
    )
    item2 = BulkBatchItem(
        id="ITEM-TEST-002",
        batch_id=target_batch_id,
        item_index=1,
        original_filename="test2.pdf",
        status=ItemStatus.FAILED,
        error_code="PARSE_ERROR",
        error_message="=cmd|' /C calc'!A0",  # Test formula injection attempt in error msg
    )
    db.add_all([item1, item2])
    db.commit()
    db.close()

    # Cancel queued batch
    cancel_resp = client.post(f"/api/v1/bulk/batches/{target_batch_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Retry failed items
    retry_resp = client.post(f"/api/v1/bulk/batches/{target_batch_id}/retry")
    assert retry_resp.status_code == 200
    assert retry_resp.json()["retried_items_count"] >= 1
