from app.main import app
from fastapi.testclient import TestClient


def test_forensic_analysis_requires_authentication():
    with TestClient(app) as client:
        response = client.post("/api/v1/documents/00000000-0000-0000-0000-000000000000/forensic-analysis")

    assert response.status_code == 401


def test_forensic_model_registry_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/v1/forensics/models")

    assert response.status_code == 401