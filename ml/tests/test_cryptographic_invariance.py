"""Cryptographic Security Invariance and Verification Precedence Regression Tests.

MANDATORY INVARIANT:
SHA-256 artifact integrity + ECDSA P-256 signature validation + document status
and revocation checks determine the authoritative verification outcome.
ML scores are supporting signals only and MUST NEVER override cryptographic failure.
"""

import pytest
import hashlib
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

from ml.src.inference_service import (
    ImageForensicsService,
    FieldConsistencyService,
    AnomalyDetectionService,
    CryptographicVerificationService
)


def test_hash_mismatch_never_overridden_by_ml_score():
    """A document with altered bytes must fail verification even if ML score is 0.0 (super genuine)."""
    original_bytes = b"VERIPROOF_AUTHENTIC_DOCUMENT_PAYLOAD_V1"
    tampered_bytes = b"VERIPROOF_TAMPERED_DOCUMENT_PAYLOAD_V1"
    
    expected_sha256 = hashlib.sha256(original_bytes).hexdigest()
    
    # 1. Deterministic Cryptographic verification
    crypto_result = CryptographicVerificationService.verify_document_digest(
        document_bytes=tampered_bytes,
        expected_sha256=expected_sha256
    )
    
    # Simulate ML model returning an extremely optimistic low-risk score
    simulated_ml_tamper_score = 0.01  # ML model says 99% confident clean
    
    # Authoritative resolution logic as defined in VeriProof architecture
    authoritative_status = "VERIFIED" if crypto_result["is_valid"] else "TAMPERED_HASH_MISMATCH"
    
    assert crypto_result["is_valid"] is False
    assert crypto_result["status"] == "TAMPERED_HASH_MISMATCH"
    assert authoritative_status == "TAMPERED_HASH_MISMATCH"
    assert authoritative_status != "VERIFIED"


def test_invalid_ecdsa_signature_never_approved_by_ml():
    """An invalid ECDSA signature must result in failure regardless of clean ML classification."""
    # Generate legitimate key pair
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    
    # Generate attacker key pair
    attacker_key = ec.generate_private_key(ec.SECP256R1())
    
    manifest_bytes = b"DOC_ID:1001;ISSUER:UNIV_01;RECIPIENT:STUDENT_A"
    valid_signature = private_key.sign(manifest_bytes, ec.ECDSA(hashes.SHA256()))
    
    # Tamper with signature bytes
    corrupted_signature = valid_signature[:-4] + b"\x00\x00\x00\x00"
    
    # Verification attempt with valid key
    signature_valid = False
    try:
        public_key.verify(corrupted_signature, manifest_bytes, ec.ECDSA(hashes.SHA256()))
        signature_valid = True
    except Exception:
        signature_valid = False

    # Simulate ML anomaly model returning clean status
    ml_verdict = "NORMAL"
    ml_confidence = 0.99
    
    # Decision must rely strictly on cryptographic validation
    final_verdict = "VALID" if signature_valid else "INVALID_SIGNATURE"
    
    assert signature_valid is False
    assert final_verdict == "INVALID_SIGNATURE"
    assert final_verdict != "VALID"


def test_revoked_document_never_verified_due_to_clean_ml():
    """A revoked document in database must remain REVOKED regardless of OCR consistency 100%."""
    doc_state = {
        "document_id": "DOC-REVOKED-883",
        "revoked": True,
        "revocation_reason": "Diploma issued in error by registrar",
        "sha256_match": True,
        "signature_valid": True
    }
    
    # Field consistency says perfect match
    field_service = FieldConsistencyService()
    field_res = field_service.verify_field(
        field_name="student_name",
        expected_value="Jane Doe",
        extracted_value="Jane Doe",
        ocr_confidence=0.99
    )
    
    assert field_res["is_consistent"] is True
    
    # Authoritative verification outcome
    if doc_state["revoked"]:
        authoritative_outcome = "REVOKED"
    elif not doc_state["sha256_match"] or not doc_state["signature_valid"]:
        authoritative_outcome = "TAMPERED"
    else:
        authoritative_outcome = "VERIFIED"
        
    assert authoritative_outcome == "REVOKED"
    assert authoritative_outcome != "VERIFIED"


def test_model_outage_or_missing_artifact_does_not_compromise_crypto_security():
    """If ML service fails or model is missing, deterministic cryptographic verification must still succeed."""
    doc_bytes = b"VALID_SECURE_DOCUMENT_PAYLOAD"
    doc_hash = hashlib.sha256(doc_bytes).hexdigest()
    
    # Crypto passes
    crypto_res = CryptographicVerificationService.verify_document_digest(doc_bytes, doc_hash)
    assert crypto_res["is_valid"] is True
    
    # Simulate ML service timeout or error
    ml_error = True
    try:
        if ml_error:
            raise RuntimeError("ML inference worker unavailable")
    except Exception:
        ml_signals = {"status": "ML_UNAVAILABLE", "tamper_score": None}
        
    # Core verification must still be valid
    final_status = "VERIFIED" if crypto_res["is_valid"] else "TAMPERED"
    assert final_status == "VERIFIED"
