"""Unit tests for feature extractors, model registry, and inference services."""

import io
import pytest
import numpy as np
from PIL import Image
from pathlib import Path

from ml.src.features.image_forensics import ImageForensicsExtractor
from ml.src.features.ocr_features import OCRConsistencyEngine
from ml.src.features.anomaly_features import AnomalyFeatureExtractor
from ml.src.model_registry import ModelRegistry
from ml.src.inference_service import (
    ImageForensicsService,
    FieldConsistencyService,
    AnomalyDetectionService,
    CryptographicVerificationService
)

def test_image_forensics_feature_extraction():
    extractor = ImageForensicsExtractor()
    # Create test synthetic image in memory
    img = Image.new("RGB", (400, 300), color=(240, 240, 240))
    feats = extractor.extract_features(img)
    
    assert "ela_mean_diff" in feats
    assert "blur_laplacian_var" in feats
    assert "noise_snr_db" in feats
    assert feats["aspect_ratio"] == pytest.approx(1.3333, abs=0.01)

def test_ocr_consistency_rules():
    engine = OCRConsistencyEngine()
    
    # 1. Exact match
    res1 = engine.evaluate_consistency("student_name", "Aarav Sharma", "Aarav Sharma")
    assert res1["classification"] == "CONSISTENT"
    assert res1["is_consistent"] is True

    # 2. Benign scan noise
    res2 = engine.evaluate_consistency("student_name", "Aarav Sharma", "Aarav Sharna")
    assert res2["classification"] == "BENIGN_OCR_NOISE"

    # 3. Deliberate change with high confidence
    res3 = engine.evaluate_consistency("student_name", "Aarav Sharma", "Vikram Patel", ocr_confidence=0.98)
    assert res3["classification"] == "INCONSISTENT_SUSPECT_TAMPERING"

    # 4. Chronological date inconsistency
    ok, msg = engine.validate_date_chronology(passing_year=2024, issue_date_str="15-06-2020")
    assert ok is False
    assert "Logical inconsistency" in msg

def test_anomaly_feature_extractor():
    extractor = AnomalyFeatureExtractor()
    evt = {
        "verification_requests_last_hour": 150.0,
        "consecutive_failed_checks": 6,
        "burst_request_rate_per_sec": 12.5,
        "issuer_revocation_status": "revoked"
    }
    vec = extractor.extract_event_features(evt)
    assert len(vec) == 5
    heuristics = extractor.evaluate_rule_heuristics(evt)
    assert heuristics["has_rule_flags"] is True
    assert heuristics["severity"] == "HIGH"

def test_model_registry_integrity_and_checksum():
    root = Path(__file__).resolve().parents[2]
    registry = ModelRegistry(registry_dir=root / "ml" / "artifacts" / "models")
    models = registry.list_models()
    assert len(models) >= 3

    forensic_model = registry.get_latest_model("image_forensics")
    assert forensic_model is not None
    assert "sha256_checksum" in forensic_model

    # Load and verify checksum matches
    loaded_model, meta = registry.load_model(forensic_model["model_id"])
    assert loaded_model is not None
    assert meta["model_id"] == forensic_model["model_id"]

def test_cryptographic_verification_service():
    service = CryptographicVerificationService()
    test_bytes = b"VERIPROOF_SECURE_DOCUMENT_PAYLOAD"
    import hashlib
    expected_hash = hashlib.sha256(test_bytes).hexdigest()

    # Valid digest
    res_valid = service.verify_document_digest(test_bytes, expected_hash)
    assert res_valid["is_valid"] is True
    assert res_valid["status"] == "VERIFIED"

    # Tampered digest
    res_tampered = service.verify_document_digest(b"ALTERED_PAYLOAD", expected_hash)
    assert res_tampered["is_valid"] is False
    assert res_tampered["status"] == "TAMPERED_HASH_MISMATCH"
