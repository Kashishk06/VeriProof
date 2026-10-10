"""Explainable baseline analysis; scores are rule-based, not probabilities."""

from sqlalchemy.orm import Session

from app.forensics.features import extract_document_features
from app.forensics.inference import infer_registered_models
from app.models.forensic_analysis import ForensicAnalysis
from app.models.organization import RegisteredDocument


RULESET_VERSION = "rules-1.0.0"


def analyze_registered_document(
    db: Session,
    record: RegisteredDocument,
    content: bytes,
    hash_matches: bool | None,
    signature_valid: bool | None,
    registry=None,
) -> ForensicAnalysis:
    features = extract_document_features(record.original_filename, content)
    duplicate_count = (
        db.query(RegisteredDocument)
        .filter(
            RegisteredDocument.sha256_hash == record.sha256_hash,
            RegisteredDocument.id != record.id,
        )
        .count()
    )
    features.update(
        {
            "sha256_matches_registry": hash_matches,
            "ecdsa_signature_valid": signature_valid,
            "duplicate_registry_matches": duplicate_count,
        }
    )
    ml_signals = infer_registered_models(features, registry=registry)

    reason_codes: list[str] = []
    score = 0
    if hash_matches is False:
        reason_codes.append("REGISTERED_CONTENT_HASH_MISMATCH")
        score += 90
    if signature_valid is False:
        reason_codes.append("ECDSA_SIGNATURE_INVALID")
        score += 90
    elif signature_valid is None:
        reason_codes.append("SIGNING_KEY_UNAVAILABLE")
        score += 10
    if not features["signature_matches_extension"]:
        reason_codes.append("FILE_SIGNATURE_MISMATCH")
        score += 60
    if features["pdf_header_present"] and not features["pdf_eof_marker_present"]:
        reason_codes.append("PDF_EOF_MARKER_MISSING")
        score += 20
    if features.get("pdf_parseable") is False:
        reason_codes.append("PDF_STRUCTURE_UNREADABLE")
        score += 15
    if duplicate_count:
        reason_codes.append("REGISTERED_HASH_REUSE")
        score += min(30, duplicate_count * 10)

    score = min(score, 100)
    risk_level = "LOW" if score < 25 else "MEDIUM" if score < 50 else "HIGH" if score < 80 else "CRITICAL"
    return ForensicAnalysis(
        document_id=record.id,
        organization_id=record.organization_id,
        model_version=RULESET_VERSION,
        risk_score=float(score),
        risk_level=risk_level,
        features=features,
        reason_codes=reason_codes,
        ml_signals=ml_signals,
        hash_matches=hash_matches,
        signature_valid=signature_valid,
    )