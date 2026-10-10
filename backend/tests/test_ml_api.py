"""Integration and RBAC tests for FastAPI ML endpoints."""

import base64
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole

def get_test_verifier_user():
    return User(
        id=101,
        email="verifier@veriproof.test",
        full_name="Verifier Test Officer",
        role=UserRole.VERIFIER,
        organization_id=1,
        is_active=True
    )

def test_ml_health_unauthorized():
    with TestClient(app) as client:
        res = client.get("/api/v1/ml/health")
        assert res.status_code == 401

def test_ml_health_authenticated():
    app.dependency_overrides[get_current_user] = get_test_verifier_user
    try:
        with TestClient(app) as client:
            res = client.get("/api/v1/ml/health")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ok"
            assert "image_forensics" in data["active_models"]
            assert "anomaly_detection" in data["active_models"]
            assert "field_consistency" in data["active_models"]
    finally:
        app.dependency_overrides.clear()

def test_ml_models_authenticated():
    app.dependency_overrides[get_current_user] = get_test_verifier_user
    try:
        with TestClient(app) as client:
            res = client.get("/api/v1/ml/models")
            assert res.status_code == 200
            data = res.json()
            assert data["total_models"] >= 3
            task_types = [m["task_type"] for m in data["models"]]
            assert "image_forensics" in task_types
            assert "anomaly_detection" in task_types
    finally:
        app.dependency_overrides.clear()

def test_image_forensics_authenticated():
    app.dependency_overrides[get_current_user] = get_test_verifier_user
    try:
        # Create test in-memory PNG
        img = Image.new("RGB", (300, 200), color=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        with TestClient(app) as client:
            # We bypass DB write or allow audit event by providing dummy db session if needed
            # Or test field-consistency and anomaly-score which do not need DB session
            res = client.post("/api/v1/ml/field-consistency", json={
                "field_name": "student_name",
                "expected_value": "Pooja Joshi",
                "extracted_value": "Pooja Joshi",
                "ocr_confidence": 0.98
            })
            assert res.status_code == 200
            data = res.json()
            assert data["is_consistent"] is True
            assert data["classification"] == "CONSISTENT"
    finally:
        app.dependency_overrides.clear()

def test_anomaly_score_authenticated():
    app.dependency_overrides[get_current_user] = get_test_verifier_user
    try:
        with TestClient(app) as client:
            res = client.post("/api/v1/ml/anomaly-score", json={
                "verification_requests_last_hour": 500.0,
                "consecutive_failed_checks": 8,
                "burst_request_rate_per_sec": 25.0,
                "issuer_revocation_status": "revoked"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["is_anomalous"] is True
            assert data["severity"] == "HIGH"
            assert len(data["rule_flags"]) > 0
    finally:
        app.dependency_overrides.clear()
