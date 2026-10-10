"""
FastAPI Router for VeriProof Bulk Operations (Registration & Verification).
"""

import io
import csv
from datetime import datetime, timezone
from math import ceil
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Path,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_active_issuer
from app.db.session import get_db
from app.models.bulk import BatchStatus, BatchType, BulkBatch, BulkBatchItem, ItemStatus
from app.models.user import User, UserRole
from app.schemas.bulk import (
    BulkBatchCreateResponse,
    BulkBatchItemDetail,
    BulkBatchItemListResponse,
    BulkBatchListItem,
    BulkBatchListResponse,
    BulkBatchStatusResponse,
    BulkCancelResponse,
    BulkRetryResponse,
    BulkValidationPreviewResponse,
)
from app.services.bulk_service import bulk_processing_service, sanitize_formula_injection

router = APIRouter(prefix="/bulk", tags=["Bulk Operations"])


class StartBatchRequest(BaseModel):
    session_token: str


@router.post(
    "/validate-registration",
    response_model=BulkValidationPreviewResponse,
    status_code=status.HTTP_200_OK,
)
async def validate_bulk_registration(
    archive: UploadFile = File(...),
    metadata: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkValidationPreviewResponse:
    """Validate ZIP archive and metadata CSV before bulk registration."""
    require_active_issuer(current_user=current_user, db=db)

    archive_bytes = await archive.read()
    metadata_bytes = await metadata.read()

    if not archive_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded ZIP archive file is empty.",
        )
    if not metadata_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded metadata CSV file is empty.",
        )

    return bulk_processing_service.validate_registration_batch(
        archive_bytes=archive_bytes,
        csv_bytes=metadata_bytes,
        archive_filename=archive.filename or "bulk_upload.zip",
    )


@router.post(
    "/register",
    response_model=BulkBatchCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_bulk_registration(
    req: StartBatchRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkBatchCreateResponse:
    """Commit validated batch to queue and launch background registration worker."""
    require_active_issuer(current_user=current_user, db=db)

    batch = bulk_processing_service.start_registration_batch(
        session_token=req.session_token,
        current_user=current_user,
        db=db,
    )

    # Dispatch to background task runner
    background_tasks.add_task(
        bulk_processing_service.execute_registration_batch_job,
        batch.id,
    )

    return BulkBatchCreateResponse(
        batch_id=batch.id,
        batch_type=batch.batch_type.value,
        status=batch.status.value,
        total_items=batch.total_items,
        message=f"Bulk registration batch {batch.id} initialized with {batch.total_items} items.",
        created_at=batch.created_at.isoformat(),
    )


@router.post(
    "/verify",
    response_model=BulkBatchCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_bulk_verification(
    background_tasks: BackgroundTasks,
    archive: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkBatchCreateResponse:
    """Upload documents in bulk and launch asynchronous multi-signal verification."""
    archive_bytes = await archive.read()
    if not archive_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded verification archive is empty.",
        )

    batch = bulk_processing_service.start_verification_batch(
        archive_bytes=archive_bytes,
        archive_filename=archive.filename or "verification_batch.zip",
        current_user=current_user,
        db=db,
    )

    background_tasks.add_task(
        bulk_processing_service.execute_verification_batch_job,
        batch.id,
    )

    return BulkBatchCreateResponse(
        batch_id=batch.id,
        batch_type=batch.batch_type.value,
        status=batch.status.value,
        total_items=batch.total_items,
        message=f"Bulk verification batch {batch.id} started with {batch.total_items} documents.",
        created_at=batch.created_at.isoformat(),
    )


@router.get("/batches", response_model=BulkBatchListResponse)
def list_bulk_batches(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    batch_type: Optional[str] = Query(None, pattern="^(REGISTRATION|VERIFICATION)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkBatchListResponse:
    """List batches belonging to the current user's organization with pagination."""
    query = db.query(BulkBatch)
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id:
            query = query.filter(BulkBatch.organization_id == current_user.organization_id)
        else:
            query = query.filter(BulkBatch.user_id == current_user.id)

    if batch_type:
        query = query.filter(BulkBatch.batch_type == batch_type)

    total = query.count()
    records = (
        query.order_by(BulkBatch.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [
        BulkBatchListItem(
            batch_id=b.id,
            batch_type=b.batch_type.value if hasattr(b.batch_type, 'value') else str(b.batch_type),
            status=b.status.value if hasattr(b.status, 'value') else str(b.status),
            total_items=b.total_items,
            processed_items=b.processed_items,
            successful_items=b.successful_items,
            failed_items=b.failed_items,
            archive_filename=b.archive_filename,
            created_at=b.created_at.isoformat(),
            completed_at=b.completed_at.isoformat() if b.completed_at else None,
        )
        for b in records
    ]

    return BulkBatchListResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=max(1, ceil(total / limit)),
        items=items,
    )


@router.get("/batches/{batch_id}", response_model=BulkBatchStatusResponse)
def get_bulk_batch_status(
    batch_id: str = Path(..., min_length=36, max_length=36),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkBatchStatusResponse:
    """Get batch progress counters, execution state, and timestamps."""
    batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk batch not found.",
        )

    # Authorization
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id and batch.organization_id != current_user.organization_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this batch.")
        elif not current_user.organization_id and batch.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this batch.")

    progress = 0.0
    if batch.total_items > 0:
        progress = round((batch.processed_items / batch.total_items) * 100.0, 1)

    duration = None
    if batch.completed_at:
        duration = (batch.completed_at - batch.created_at).total_seconds()
    elif batch.status == BatchStatus.PROCESSING:
        duration = (datetime.now(timezone.utc) - batch.created_at).total_seconds()

    return BulkBatchStatusResponse(
        batch_id=batch.id,
        batch_type=batch.batch_type.value if hasattr(batch.batch_type, 'value') else str(batch.batch_type),
        status=batch.status.value if hasattr(batch.status, 'value') else str(batch.status),
        total_items=batch.total_items,
        processed_items=batch.processed_items,
        successful_items=batch.successful_items,
        failed_items=batch.failed_items,
        progress_percent=progress,
        archive_filename=batch.archive_filename,
        error_summary=batch.error_summary,
        created_at=batch.created_at.isoformat(),
        updated_at=batch.updated_at.isoformat(),
        completed_at=batch.completed_at.isoformat() if batch.completed_at else None,
        duration_seconds=duration,
    )


@router.get("/batches/{batch_id}/items", response_model=BulkBatchItemListResponse)
def list_bulk_batch_items(
    batch_id: str = Path(..., min_length=1, max_length=64),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkBatchItemListResponse:
    """Retrieve paginated individual document items in a batch."""
    batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk batch not found.",
        )

    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id and batch.organization_id != current_user.organization_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        elif not current_user.organization_id and batch.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    query = db.query(BulkBatchItem).filter(BulkBatchItem.batch_id == batch_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                BulkBatchItem.original_filename.ilike(s),
                BulkBatchItem.recipient_name.ilike(s),
                BulkBatchItem.document_title.ilike(s),
                BulkBatchItem.recipient_identifier.ilike(s),
            )
        )

    if status_filter:
        query = query.filter(
            or_(
                BulkBatchItem.status == status_filter,
                BulkBatchItem.verification_outcome == status_filter,
            )
        )

    total = query.count()
    records = (
        query.order_by(BulkBatchItem.item_index.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for r in records:
        ml_dict = None
        if r.ml_signals:
            try:
                import json
                ml_dict = json.loads(r.ml_signals)
            except Exception:
                pass

        items.append(
            BulkBatchItemDetail(
                id=r.id,
                item_index=r.item_index,
                original_filename=r.original_filename,
                document_title=r.document_title,
                document_type=r.document_type,
                recipient_name=r.recipient_name,
                recipient_identifier=r.recipient_identifier,
                recipient_email=r.recipient_email,
                issue_date=r.issue_date.isoformat() if r.issue_date else None,
                expiry_date=r.expiry_date.isoformat() if r.expiry_date else None,
                sha256_hash=r.sha256_hash,
                status=r.status.value if hasattr(r.status, 'value') else str(r.status),
                verification_outcome=r.verification_outcome,
                registered_document_id=r.registered_document_id,
                public_verification_id=r.public_verification_id,
                error_message=r.error_message,
                error_code=r.error_code,
                retry_count=r.retry_count,
                ml_signals=ml_dict,
                processing_time_ms=r.processing_time_ms,
                created_at=r.created_at.isoformat(),
                updated_at=r.updated_at.isoformat(),
            )
        )

    return BulkBatchItemListResponse(
        batch_id=batch_id,
        total=total,
        page=page,
        limit=limit,
        total_pages=max(1, ceil(total / limit)),
        items=items,
    )


@router.post("/batches/{batch_id}/retry", response_model=BulkRetryResponse)
def retry_failed_items(
    batch_id: str = Path(..., min_length=1, max_length=64),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkRetryResponse:
    """Reset failed items and re-trigger background processing for this batch."""
    batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    failed_items = (
        db.query(BulkBatchItem)
        .filter(BulkBatchItem.batch_id == batch_id, BulkBatchItem.status == ItemStatus.FAILED)
        .all()
    )

    if not failed_items:
        return BulkRetryResponse(
            batch_id=batch_id,
            retried_items_count=0,
            status=batch.status.value if hasattr(batch.status, 'value') else str(batch.status),
            message="No failed items eligible for retry in this batch.",
        )

    for item in failed_items:
        item.status = ItemStatus.PENDING
        item.retry_count += 1
        item.error_message = None
        item.error_code = None

    batch.status = BatchStatus.QUEUED
    batch.failed_items = max(0, batch.failed_items - len(failed_items))
    batch.processed_items = max(0, batch.processed_items - len(failed_items))
    db.commit()

    if batch.batch_type == BatchType.REGISTRATION:
        background_tasks.add_task(bulk_processing_service.execute_registration_batch_job, batch_id)
    else:
        background_tasks.add_task(bulk_processing_service.execute_verification_batch_job, batch_id)

    return BulkRetryResponse(
        batch_id=batch_id,
        retried_items_count=len(failed_items),
        status="QUEUED",
        message=f"Queued retry for {len(failed_items)} failed items.",
    )


@router.post("/batches/{batch_id}/cancel", response_model=BulkCancelResponse)
def cancel_bulk_batch(
    batch_id: str = Path(..., min_length=1, max_length=64),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkCancelResponse:
    """Cancel processing for a queued or in-flight batch."""
    batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    if batch.status in (BatchStatus.COMPLETED, BatchStatus.COMPLETED_WITH_ERRORS, BatchStatus.CANCELLED):
        return BulkCancelResponse(
            batch_id=batch_id,
            status=batch.status.value if hasattr(batch.status, 'value') else str(batch.status),
            message=f"Batch is already in terminal status '{batch.status}'.",
        )

    batch.status = BatchStatus.CANCELLED
    db.commit()

    return BulkCancelResponse(
        batch_id=batch_id,
        status="CANCELLED",
        message="Batch cancellation requested successfully.",
    )


@router.get("/batches/{batch_id}/export")
def export_batch_csv(
    batch_id: str = Path(..., min_length=1, max_length=64),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export batch results as CSV with formula injection sanitization."""
    batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    items = (
        db.query(BulkBatchItem)
        .filter(BulkBatchItem.batch_id == batch_id)
        .order_by(BulkBatchItem.item_index.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    if batch.batch_type == BatchType.REGISTRATION:
        writer.writerow([
            "ItemIndex",
            "Filename",
            "DocumentTitle",
            "RecipientName",
            "RecipientIdentifier",
            "RecipientEmail",
            "Status",
            "DocumentID",
            "PublicVerificationID",
            "SHA256Hash",
            "ErrorMessage",
        ])
        for item in items:
            writer.writerow([
                item.item_index,
                sanitize_formula_injection(item.original_filename),
                sanitize_formula_injection(item.document_title),
                sanitize_formula_injection(item.recipient_name),
                sanitize_formula_injection(item.recipient_identifier),
                sanitize_formula_injection(item.recipient_email),
                item.status.value if hasattr(item.status, 'value') else str(item.status),
                sanitize_formula_injection(item.registered_document_id),
                sanitize_formula_injection(item.public_verification_id),
                sanitize_formula_injection(item.sha256_hash),
                sanitize_formula_injection(item.error_message),
            ])
    else:
        writer.writerow([
            "ItemIndex",
            "Filename",
            "Outcome",
            "Status",
            "SHA256Hash",
            "DocumentTitle",
            "RecipientName",
            "ErrorMessage",
        ])
        for item in items:
            writer.writerow([
                item.item_index,
                sanitize_formula_injection(item.original_filename),
                sanitize_formula_injection(item.verification_outcome),
                item.status.value if hasattr(item.status, 'value') else str(item.status),
                sanitize_formula_injection(item.sha256_hash),
                sanitize_formula_injection(item.document_title),
                sanitize_formula_injection(item.recipient_name),
                sanitize_formula_injection(item.error_message),
            ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=veriproof_batch_{batch_id[:8]}_export.csv",
            "X-Content-Type-Options": "nosniff",
        },
    )
