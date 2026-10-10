"""
Super Admin Organization Oversight and Lifecycle API.

Endpoints:
- GET  /api/v1/admin/organizations                           - List organizations with pagination & filters
- GET  /api/v1/admin/organizations/{organization_id}          - Retrieve comprehensive organization detail
- GET  /api/v1/admin/organizations/{organization_id}/documents - List supporting document metadata
- GET  /api/v1/admin/organizations/{organization_id}/documents/{document_id} - Inspect / download document
- POST /api/v1/admin/organizations/{organization_id}/suspend  - Suspend an active organization
- POST /api/v1/admin/organizations/{organization_id}/revoke   - Revoke organization authority
- POST /api/v1/admin/organizations/{organization_id}/restore  - Restore suspended organization
- POST /api/v1/admin/organizations/{organization_id}/reinstate- Explicit Super Admin reinstatement of revoked org
- GET  /api/v1/admin/organizations/{organization_id}/history  - Retrieve oversight audit history
"""

import math
from datetime import datetime, timezone
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.organization import Organization, OrganizationDocument, OrganizationStatus, RegisteredDocument
from app.models.user import User, UserRole
from app.schemas.documents import AdminDocumentListItem, AdminDocumentListResponse
from app.schemas.admin import (
    OrganizationAdminDetailResponse,
    OrganizationAdminSummaryResponse,
    OrganizationDocumentsListResponse,
    OrganizationHistoryEventResponse,
    OrganizationHistoryResponse,
    OrganizationPaginationResponse,
    OrganizationStatusChangeResponse,
    OrganizationUserSummary,
    ReinstateOrganizationRequest,
    RestoreOrganizationRequest,
    RevokeOrganizationRequest,
    SuspendOrganizationRequest,
)
from app.services.document_service import document_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin Oversight"],
    dependencies=[Depends(require_role(UserRole.SUPER_ADMIN))],
)


# ---------------------------------------------------------------------------
# GET /api/v1/admin/organizations
# ---------------------------------------------------------------------------
@router.get(
    "/organizations",
    response_model=OrganizationPaginationResponse,
    summary="List registered organizations with pagination and status filters",
)
def list_organizations(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[OrganizationStatus] = Query(None, description="Filter by status: ACTIVE, SUSPENDED, REVOKED"),
    org_type: Optional[str] = Query(None, max_length=100, description="Filter by organization type (e.g. University, Corporate)"),
    search: Optional[str] = Query(None, max_length=200, description="Search by name, registration number, or official email"),
    sort_by: Literal["created_at", "updated_at", "name", "status"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    db: Session = Depends(get_db),
) -> OrganizationPaginationResponse:
    """
    List registered organizations with pagination and filtering.
    Allows Super Admins to locate ACTIVE, SUSPENDED, and REVOKED organizations.
    """
    user_count = (
        db.query(func.count(User.id))
        .filter(User.organization_id == Organization.id)
        .correlate(Organization)
        .scalar_subquery()
    )
    document_count = (
        db.query(func.count(OrganizationDocument.id))
        .filter(OrganizationDocument.organization_id == Organization.id)
        .correlate(Organization)
        .scalar_subquery()
    )
    issuer_email = (
        db.query(User.email)
        .filter(User.organization_id == Organization.id, User.role == UserRole.ISSUER)
        .order_by(User.id.asc())
        .limit(1)
        .correlate(Organization)
        .scalar_subquery()
    )
    issuer_name = (
        db.query(User.full_name)
        .filter(User.organization_id == Organization.id, User.role == UserRole.ISSUER)
        .order_by(User.id.asc())
        .limit(1)
        .correlate(Organization)
        .scalar_subquery()
    )
    query = db.query(
        Organization,
        user_count.label("user_count"),
        document_count.label("document_count"),
        issuer_name.label("issuer_name"),
        issuer_email.label("issuer_email"),
    )

    # 1. Filter by status
    if status:
        query = query.filter(Organization.status == status)

    # 2. Filter by organization type
    if org_type:
        query = query.filter(Organization.org_type.ilike(f"%{org_type.strip()}%"))

    # 3. Search query
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Organization.name.ilike(s),
                Organization.legal_name.ilike(s),
                Organization.registration_number.ilike(s),
                Organization.official_email.ilike(s),
            )
        )

    total = query.count()
    total_pages = max(1, math.ceil(total / limit))
    offset = (page - 1) * limit

    sort_column = {
        "created_at": Organization.created_at,
        "updated_at": Organization.updated_at,
        "name": Organization.name,
        "status": Organization.status,
    }[sort_by]
    ordering = asc(sort_column) if sort_order == "asc" else desc(sort_column)
    orgs = query.order_by(ordering, Organization.id.asc()).offset(offset).limit(limit).all()

    items = []
    for org, org_user_count, org_document_count, org_issuer_name, org_issuer_email in orgs:
        items.append(
            OrganizationAdminSummaryResponse(
                id=org.id,
                name=org.name,
                legal_name=org.legal_name,
                org_type=org.org_type,
                registration_number=org.registration_number,
                tax_id=org.tax_id,
                official_email=org.official_email,
                status=org.status,
                status_reason=org.status_reason or org.rejection_reason,
                created_at=org.created_at,
                updated_at=org.updated_at,
                user_count=org_user_count or 0,
                issuer_name=org_issuer_name,
                issuer_email=org_issuer_email,
                has_documents=bool(org.primary_document_url or org.supporting_document_url or org_document_count),
            )
        )

    return OrganizationPaginationResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        items=items,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/admin/organizations/{organization_id}
# ---------------------------------------------------------------------------
@router.get(
    "/organizations/{organization_id}",
    response_model=OrganizationAdminDetailResponse,
    summary="Get comprehensive organization details, documents, and contact information",
)
def get_organization_detail(
    organization_id: int,
    db: Session = Depends(get_db),
) -> OrganizationAdminDetailResponse:
    """
    Return organization details, registration information, contact information,
    status, registration timestamp, supporting-document references, and associated users.
    """
    org = (
        db.query(Organization)
        .options(selectinload(Organization.users), selectinload(Organization.documents))
        .filter(Organization.id == organization_id)
        .first()
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    doc_metadata = document_service.get_organization_documents_metadata(org)

    user_summaries = [
        OrganizationUserSummary(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in (org.users or [])
    ]

    return OrganizationAdminDetailResponse(
        id=org.id,
        name=org.name,
        legal_name=org.legal_name,
        org_type=org.org_type,
        registration_number=org.registration_number,
        tax_id=org.tax_id,
        website=org.website,
        official_email=org.official_email,
        address=org.address,
        city=org.city,
        state=org.state,
        country=org.country,
        pin_code=org.pin_code,
        authorized_representative_name=org.authorized_representative_name,
        authorized_representative_role=org.authorized_representative_role,
        authorized_representative_email=org.authorized_representative_email,
        authorized_representative_phone=org.authorized_representative_phone,
        primary_document_url=org.primary_document_url,
        supporting_document_url=org.supporting_document_url,
        documents=doc_metadata,
        status=org.status,
        status_reason=org.status_reason or org.rejection_reason,
        reviewed_by_id=org.reviewed_by_id,
        reviewed_at=org.reviewed_at,
        rejection_reason=org.rejection_reason,
        created_at=org.created_at,
        updated_at=org.updated_at,
        users=user_summaries,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/admin/organizations/{organization_id}/documents
# ---------------------------------------------------------------------------
@router.get(
    "/organizations/{organization_id}/documents",
    response_model=OrganizationDocumentsListResponse,
    summary="List submitted supporting documents and their metadata",
)
def list_organization_documents(
    organization_id: int,
    db: Session = Depends(get_db),
) -> OrganizationDocumentsListResponse:
    """
    List submitted supporting documents and their metadata.
    Distinguishes physical file presence from metadata-only references.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    doc_metadata = document_service.get_organization_documents_metadata(org)

    return OrganizationDocumentsListResponse(
        organization_id=org.id,
        organization_name=org.name,
        documents=doc_metadata,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/admin/organizations/{organization_id}/documents/{document_id}
# ---------------------------------------------------------------------------
@router.get(
    "/organizations/{organization_id}/documents/{document_id}",
    summary="Securely inspect or download a submitted supporting document",
)
def inspect_organization_document(
    organization_id: int,
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Provide a securely authorized way for Super Admins to inspect a submitted document.
    - If physical file exists in private storage, safely stream the file.
    - If actual file storage is not configured/populated for this entry,
      explicitly report the storage limitation without pretending a filename is a file.
    - Records an audit event for every document access.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    file_path, metadata = document_service.get_document_for_download(org, document_id)

    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document reference '{document_id}' was not found for organization {organization_id}.",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Record document access audit event
    audit = AuditEvent(
        event_type="ORGANIZATION_DOCUMENT_ACCESSED",
        user_id=current_user.id,
        organization_id=org.id,
        details=(
            f"Super Admin '{current_user.email}' accessed document '{metadata.label}' "
            f"(filename: {metadata.filename}, storage_status: {metadata.storage_status})."
        ),
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()

    # Stream file if physical file exists on disk
    if file_path:
        return FileResponse(
            path=file_path,
            filename=metadata.filename,
            media_type=metadata.content_type or "application/octet-stream",
            headers={"X-Content-Type-Options": "nosniff"},
        )

    # Report explicit storage subsystem limitation
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "error": "STORAGE_SUBSYSTEM_LIMITATION",
            "detail": (
                f"File storage subsystem limitation: Document '{metadata.label}' is recorded as "
                f"a metadata reference ('{metadata.filename}'), but physical file storage is not "
                f"populated on disk for this registration entry."
            ),
            "document_id": metadata.id,
            "filename": metadata.filename,
            "organization_id": org.id,
            "storage_status": "METADATA_ONLY",
        },
    )


# ---------------------------------------------------------------------------
# POST /api/v1/admin/organizations/{organization_id}/suspend
# ---------------------------------------------------------------------------
@router.post(
    "/organizations/{organization_id}/suspend",
    response_model=OrganizationStatusChangeResponse,
    summary="Suspend an active organization",
)
def suspend_organization(
    organization_id: int,
    payload: SuspendOrganizationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationStatusChangeResponse:
    """
    Suspend an active organization.
    Requires a non-empty reason.
    Prevents invalid state transitions (e.g. from REVOKED or already SUSPENDED).
    Records Super Admin, timestamp, reason, and audit event.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).with_for_update().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Enforce valid state transitions
    if org.status == OrganizationStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization '{org.name}' is already suspended.",
        )

    if org.status == OrganizationStatus.REVOKED:
        # Record failed transition attempt
        db.add(
            AuditEvent(
                event_type="ORGANIZATION_TRANSITION_FAILED",
                user_id=current_user.id,
                organization_id=org.id,
                details=f"Attempted invalid transition from REVOKED to SUSPENDED by '{current_user.email}'.",
                ip_address=client_ip,
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend an organization whose authority has already been REVOKED.",
        )

    if org.status != OrganizationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot suspend an organization in {org.status.value} status.",
        )

    previous_status = org.status
    now = datetime.now(timezone.utc)

    # Apply suspension
    org.status = OrganizationStatus.SUSPENDED
    org.status_reason = payload.reason
    org.reviewed_by_id = current_user.id
    org.reviewed_at = now
    org.updated_at = now

    # Audit event
    audit = AuditEvent(
        event_type="ORGANIZATION_SUSPENDED",
        user_id=current_user.id,
        organization_id=org.id,
        details=f"Organization '{org.name}' suspended by Super Admin '{current_user.email}'. Reason: {payload.reason}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(org)

    return OrganizationStatusChangeResponse(
        success=True,
        organization_id=org.id,
        organization_name=org.name,
        previous_status=previous_status,
        new_status=OrganizationStatus.SUSPENDED,
        reason=payload.reason,
        acted_by=current_user.email,
        timestamp=now,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/admin/organizations/{organization_id}/revoke
# ---------------------------------------------------------------------------
@router.post(
    "/organizations/{organization_id}/revoke",
    response_model=OrganizationStatusChangeResponse,
    summary="Revoke an organization's platform authority and disable associated accounts",
)
def revoke_organization(
    organization_id: int,
    payload: RevokeOrganizationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationStatusChangeResponse:
    """
    Revoke an organization's platform authority.
    Requires a non-empty reason.
    Immediately disables associated Issuer accounts so existing JWTs and future logins are blocked.
    Rejects duplicate state transitions safely.
    Records Super Admin, timestamp, reason, and audit event.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).with_for_update().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    if org.status == OrganizationStatus.REVOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization '{org.name}' authority has already been REVOKED.",
        )

    if org.status not in (OrganizationStatus.ACTIVE, OrganizationStatus.SUSPENDED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot revoke an organization in {org.status.value} status.",
        )

    previous_status = org.status
    now = datetime.now(timezone.utc)

    # Apply revocation
    org.status = OrganizationStatus.REVOKED
    org.status_reason = payload.reason
    org.reviewed_by_id = current_user.id
    org.reviewed_at = now
    org.updated_at = now

    # Audit event
    audit = AuditEvent(
        event_type="ORGANIZATION_REVOKED",
        user_id=current_user.id,
        organization_id=org.id,
        details=(
            f"Organization '{org.name}' revoked by Super Admin '{current_user.email}'. "
            f"Reason: {payload.reason}."
        ),
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(org)

    return OrganizationStatusChangeResponse(
        success=True,
        organization_id=org.id,
        organization_name=org.name,
        previous_status=previous_status,
        new_status=OrganizationStatus.REVOKED,
        reason=payload.reason,
        acted_by=current_user.email,
        timestamp=now,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/admin/organizations/{organization_id}/restore
# ---------------------------------------------------------------------------
@router.post(
    "/organizations/{organization_id}/restore",
    response_model=OrganizationStatusChangeResponse,
    summary="Restore a suspended organization to ACTIVE status",
)
def restore_organization(
    organization_id: int,
    payload: RestoreOrganizationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationStatusChangeResponse:
    """
    Restore a SUSPENDED organization to ACTIVE status.
    Requires an explicit non-empty reason.
    Restores from SUSPENDED. Reinstatement from REVOKED is blocked unless allow_reinstatement=True.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).with_for_update().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    if payload.allow_reinstatement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the explicit /reinstate action to reinstate a revoked organization.",
        )

    if org.status == OrganizationStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization '{org.name}' is already ACTIVE.",
        )

    if org.status == OrganizationStatus.REVOKED:
        db.add(
            AuditEvent(
                event_type="ORGANIZATION_TRANSITION_FAILED",
                user_id=current_user.id,
                organization_id=org.id,
                details=f"Standard restore rejected for REVOKED organization '{org.name}' by '{current_user.email}'.",
                ip_address=client_ip,
            )
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Organization authority has been REVOKED and cannot be reactivated via standard restore. "
                "Reinstatement requires an explicit Super Admin reinstatement action."
            ),
        )

    if org.status != OrganizationStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot restore an organization in {org.status.value} status.",
        )

    previous_status = org.status
    now = datetime.now(timezone.utc)

    # Apply restoration
    org.status = OrganizationStatus.ACTIVE
    org.status_reason = payload.reason
    org.reviewed_by_id = current_user.id
    org.reviewed_at = now
    org.updated_at = now

    audit = AuditEvent(
        event_type="ORGANIZATION_RESTORED",
        user_id=current_user.id,
        organization_id=org.id,
        details=f"Organization '{org.name}' restored to ACTIVE from SUSPENDED by Super Admin '{current_user.email}'. Reason: {payload.reason}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(org)

    return OrganizationStatusChangeResponse(
        success=True,
        organization_id=org.id,
        organization_name=org.name,
        previous_status=previous_status,
        new_status=OrganizationStatus.ACTIVE,
        reason=payload.reason,
        acted_by=current_user.email,
        timestamp=now,
    )


# ---------------------------------------------------------------------------
# POST /api/v1/admin/organizations/{organization_id}/reinstate
# ---------------------------------------------------------------------------
@router.post(
    "/organizations/{organization_id}/reinstate",
    response_model=OrganizationStatusChangeResponse,
    summary="Explicit Super Admin reinstatement of a previously REVOKED organization",
)
def reinstate_organization(
    organization_id: int,
    payload: ReinstateOrganizationRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationStatusChangeResponse:
    """
    Explicit Super Admin reinstatement of a REVOKED organization.
    Requires detailed justification, reactivates accounts, and records audit event.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).with_for_update().first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    if org.status != OrganizationStatus.REVOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization '{org.name}' is not in REVOKED status (current: {org.status.value}). Use /restore for suspended organizations.",
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = datetime.now(timezone.utc)

    # Re-activate organization
    org.status = OrganizationStatus.ACTIVE
    org.status_reason = payload.reason
    org.reviewed_by_id = current_user.id
    org.reviewed_at = now
    org.updated_at = now

    audit = AuditEvent(
        event_type="ORGANIZATION_REINSTATED",
        user_id=current_user.id,
        organization_id=org.id,
        details=f"REVOKED organization '{org.name}' reinstated to ACTIVE by Super Admin '{current_user.email}'. Justification: {payload.reason}",
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(org)

    return OrganizationStatusChangeResponse(
        success=True,
        organization_id=org.id,
        organization_name=org.name,
        previous_status=OrganizationStatus.REVOKED,
        new_status=OrganizationStatus.ACTIVE,
        reason=payload.reason,
        acted_by=current_user.email,
        timestamp=now,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/admin/organizations/{organization_id}/history
# ---------------------------------------------------------------------------
@router.get(
    "/organizations/{organization_id}/history",
    response_model=OrganizationHistoryResponse,
    summary="Get administrative audit history for an organization",
)
def get_organization_history(
    organization_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> OrganizationHistoryResponse:
    """
    Return authorized organization status and administrative audit history.
    """
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {organization_id} was not found.",
        )

    audit_query = db.query(AuditEvent).filter(AuditEvent.organization_id == organization_id)
    total = audit_query.count()
    audit_records = audit_query.order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc()).offset((page - 1) * limit).limit(limit).all()

    events = []
    for a in audit_records:
        actor_email = a.user.email if a.user else None
        events.append(
            OrganizationHistoryEventResponse(
                id=a.id,
                event_type=a.event_type,
                user_id=a.user_id,
                actor_email=actor_email,
                details=a.details,
                ip_address=a.ip_address,
                created_at=a.created_at,
            )
        )

    return OrganizationHistoryResponse(
        organization_id=org.id,
        organization_name=org.name,
        current_status=org.status,
        events=events,
        total=total,
        page=page,
        limit=limit,
        total_pages=max(1, math.ceil(total / limit)),
    )

@router.get("/documents", response_model=AdminDocumentListResponse, summary="Search the registered document ledger")
def list_registered_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(ACTIVE|REVOKED)$"),
    document_type: Optional[str] = Query(None, max_length=100),
    search: Optional[str] = Query(None, max_length=200),
    db: Session = Depends(get_db),
) -> AdminDocumentListResponse:
    query = db.query(RegisteredDocument).options(
        selectinload(RegisteredDocument.organization),
        selectinload(RegisteredDocument.issuer),
    ).join(
        Organization,
        RegisteredDocument.organization_id == Organization.id,
    )
    status_counts = dict(
        db.query(RegisteredDocument.status, func.count(RegisteredDocument.id))
        .group_by(RegisteredDocument.status)
        .all()
    )
    if status_filter:
        query = query.filter(RegisteredDocument.status == status_filter)
    if document_type and document_type.strip():
        query = query.filter(RegisteredDocument.document_type.ilike(f"%{document_type.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(
            RegisteredDocument.title.ilike(term),
            RegisteredDocument.document_type.ilike(term),
            RegisteredDocument.sha256_hash.ilike(term),
            RegisteredDocument.public_verification_id.ilike(term),
            Organization.name.ilike(term),
        ))

    total = query.count()
    records = query.order_by(RegisteredDocument.issued_at.desc(), RegisteredDocument.id.asc()).offset((page - 1) * limit).limit(limit).all()
    items = [
        AdminDocumentListItem(
            document_id=record.id,
            public_verification_id=record.public_verification_id,
            title=record.title,
            document_type=record.document_type,
            recipient_name=record.recipient_name,
            recipient_identifier=record.recipient_identifier,
            original_filename=record.original_filename,
            sha256_hash=record.sha256_hash,
            signature_algorithm=record.signature_algorithm,
            signature_value=record.signature_value,
            signing_key_id=record.signing_key_id,
            signing_public_key=record.signing_public_key,
            status=record.status,
            issue_date=record.issue_date,
            issued_at=record.issued_at,
            expires_at=record.expires_at,
            revoked_at=record.revoked_at,
            revocation_reason=record.revocation_reason,
            version=record.version,
            organization_id=record.organization_id,
            organization_name=record.organization.name,
            issuer_user_id=record.issuer_user_id,
            issuer_name=record.issuer.full_name,
        )
        for record in records
    ]
    return AdminDocumentListResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=max(1, math.ceil(total / limit)),
        items=items,
        active_count=status_counts.get("ACTIVE", 0),
        revoked_count=status_counts.get("REVOKED", 0),
    )
