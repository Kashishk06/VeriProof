"""Organization-owned profile and supporting-document endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, Path, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user, require_active_issuer, require_organization_access
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.admin import OrganizationDocumentMetadata, OrganizationDocumentsListResponse
from app.schemas.organization import (
    OrganizationDocumentUploadResponse,
    OrganizationProfileResponse,
    OrganizationProfileUpdate,
)
from app.services.document_service import document_service


router = APIRouter(prefix="/organizations", tags=["Organizations"])


def _get_accessible_organization(
    organization_id: int,
    current_user: User,
    db: Session,
    *,
    active_issuer_required: bool = False,
) -> Organization:
    require_organization_access(organization_id, current_user)
    if active_issuer_required and current_user.role == UserRole.ISSUER:
        require_active_issuer(current_user=current_user, db=db)

    organization = (
        db.query(Organization)
        .options(selectinload(Organization.documents))
        .filter(Organization.id == organization_id)
        .first()
    )
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
    return organization


@router.get("/{organization_id}", response_model=OrganizationProfileResponse)
def get_organization_profile(
    organization_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationProfileResponse:
    organization = _get_accessible_organization(organization_id, current_user, db)
    return OrganizationProfileResponse.model_validate(organization)


@router.patch("/{organization_id}", response_model=OrganizationProfileResponse)
def update_organization_profile(
    payload: OrganizationProfileUpdate,
    request: Request,
    organization_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationProfileResponse:
    organization = _get_accessible_organization(
        organization_id,
        current_user,
        db,
        active_issuer_required=True,
    )
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="At least one editable profile field is required.")
    for required_field in ("name", "org_type", "authorized_representative_name"):
        if required_field in updates and not updates[required_field]:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"{required_field} cannot be empty.")

    for field_name, value in updates.items():
        setattr(organization, field_name, value)
    now = datetime.now(timezone.utc)
    organization.updated_at = now
    db.add(
        AuditEvent(
            event_type="ORGANIZATION_PROFILE_UPDATED",
            user_id=current_user.id,
            organization_id=organization.id,
            details=f"Organization profile fields updated: {', '.join(sorted(updates))}.",
            ip_address=request.client.host if request.client else None,
            created_at=now,
        )
    )
    try:
        db.commit()
        db.refresh(organization)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Organization profile update could not be saved.") from exc
    return OrganizationProfileResponse.model_validate(organization)


@router.get("/{organization_id}/documents", response_model=OrganizationDocumentsListResponse)
def list_organization_documents(
    organization_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationDocumentsListResponse:
    organization = _get_accessible_organization(
        organization_id,
        current_user,
        db,
        active_issuer_required=True,
    )
    return OrganizationDocumentsListResponse(
        organization_id=organization.id,
        organization_name=organization.name,
        documents=document_service.get_organization_documents_metadata(organization),
    )


@router.post(
    "/{organization_id}/documents",
    response_model=OrganizationDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_organization_document(
    organization_id: int = Path(..., ge=1),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationDocumentUploadResponse:
    if current_user.role != UserRole.ISSUER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an Issuer can upload organization documents.")
    organization = _get_accessible_organization(
        organization_id,
        current_user,
        db,
        active_issuer_required=True,
    )
    normalized_type = document_type.strip().upper()
    document = document_service.store_uploaded_document(
        db=db,
        organization=organization,
        document_type=normalized_type,
        filename=file.filename or "",
        source=file.file,
    )
    return OrganizationDocumentUploadResponse(
        id=document.id,
        organization_id=document.organization_id,
        document_type=document.document_type,
        filename=document.filename,
        content_type=document.content_type,
        size_bytes=document.size_bytes,
        created_at=document.created_at,
    )


@router.get("/{organization_id}/documents/{document_id}")
def download_organization_document(
    organization_id: int = Path(..., ge=1),
    document_id: str = Path(..., min_length=1, max_length=64),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    organization = _get_accessible_organization(
        organization_id,
        current_user,
        db,
        active_issuer_required=True,
    )
    path, metadata = document_service.get_document_for_download(organization, document_id)
    if metadata is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization document not found.")
    if path is None:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={
                "error": "STORAGE_SUBSYSTEM_LIMITATION",
                "detail": "The organization document has metadata but its private file is unavailable.",
                "document_id": metadata.id,
                "storage_status": metadata.storage_status,
            },
        )

    now = datetime.now(timezone.utc)
    db.add(
        AuditEvent(
            event_type="ORGANIZATION_SUPPORTING_DOCUMENT_ACCESSED",
            user_id=current_user.id,
            organization_id=organization.id,
            details=f"Organization document accessed: {metadata.id} ({metadata.document_type}).",
            ip_address=None,
            created_at=now,
        )
    )
    db.commit()
    return FileResponse(
        path=path,
        filename=metadata.filename,
        media_type=metadata.content_type or "application/octet-stream",
        headers={"X-Content-Type-Options": "nosniff"},
    )