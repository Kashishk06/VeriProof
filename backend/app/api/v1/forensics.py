"""Authenticated forensic analysis for documents in the signed registry."""

import json
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_active_issuer
from app.db.session import get_db
from app.forensics.engine import analyze_registered_document
from app.models.audit import AuditEvent
from app.models.forensic_analysis import ForensicAnalysis
from app.models.organization import RegisteredDocument
from app.models.user import User, UserRole
from app.schemas.forensics import ForensicAnalysisHistoryResponse, ForensicAnalysisResponse
from app.api.v1.documents import _verify_record_file
from app.forensics.registry import model_registry


router = APIRouter(prefix="/documents", tags=["Document Forensics"])
model_router = APIRouter(prefix="/forensics", tags=["Forensic Models"])


def _authorized_record(document_id: str, current_user: User, db: Session) -> RegisteredDocument:
    record = db.query(RegisteredDocument).filter(RegisteredDocument.id == document_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document registry record not found.")
    if current_user.role in {UserRole.SUPER_ADMIN, UserRole.VERIFIER}:
        return record
    if current_user.role != UserRole.ISSUER or current_user.organization_id != record.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot access this document.")
    require_active_issuer(current_user=current_user, db=db)
    return record


@router.post(
    "/{document_id}/forensic-analysis",
    response_model=ForensicAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_forensic_analysis(
    document_id: str = Path(..., min_length=36, max_length=36),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ForensicAnalysisResponse:
    record = _authorized_record(document_id, current_user, db)
    path, hash_matches, signature_valid = _verify_record_file(record)
    if not path:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Protected document content is unavailable.")
    try:
        with open(path, "rb") as protected_file:
            content = protected_file.read()
    except OSError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Protected document content is unavailable.") from exc
    hash_matches = hashlib.sha256(content).hexdigest() == record.sha256_hash

    analysis = analyze_registered_document(db, record, content, hash_matches, signature_valid)
    analysis.analyzed_by_user_id = current_user.id
    db.add(analysis)
    db.flush()
    db.add(
        AuditEvent(
            event_type="DOCUMENT_FORENSIC_ANALYSIS_COMPLETED",
            user_id=current_user.id,
            organization_id=record.organization_id,
            details=json.dumps(
                {
                    "analysis_id": analysis.id,
                    "document_id": record.id,
                    "model_version": analysis.model_version,
                    "risk_level": analysis.risk_level,
                },
                sort_keys=True,
            ),
        )
    )
    db.commit()
    db.refresh(analysis)
    return ForensicAnalysisResponse.model_validate(analysis)


@router.get(
    "/{document_id}/forensic-analysis",
    response_model=ForensicAnalysisHistoryResponse,
)
def get_forensic_analysis_history(
    document_id: str = Path(..., min_length=36, max_length=36),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ForensicAnalysisHistoryResponse:
    record = _authorized_record(document_id, current_user, db)
    analyses = (
        db.query(ForensicAnalysis)
        .filter(ForensicAnalysis.document_id == record.id)
        .order_by(ForensicAnalysis.created_at.desc(), ForensicAnalysis.id.desc())
        .limit(100)
        .all()
    )
    return ForensicAnalysisHistoryResponse(
        document_id=record.id,
        total=len(analyses),
        items=[ForensicAnalysisResponse.model_validate(analysis) for analysis in analyses],
    )


@model_router.get("/models")
def list_forensic_models(
    current_user: User = Depends(get_current_user),
) -> dict:
    models = model_registry.list_models()
    return {
        "models": [
            {
                "model_id": item["model_id"],
                "algorithm": item["algorithm"],
                "version": item["version"],
                "feature_names": item["feature_names"],
                "metrics": item["metrics"],
                "created_at": item["created_at"],
            }
            for item in models
        ],
        "active_model_ids": {
            algorithm: next(
                (item["model_id"] for item in reversed(models) if item.get("algorithm") == algorithm),
                None,
            )
            for algorithm in ("xgboost_classifier", "isolation_forest")
        },
    }