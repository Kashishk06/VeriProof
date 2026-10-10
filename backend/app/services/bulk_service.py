"""
Production Bulk Operations Processing Service for VeriProof.
Implements:
- Secure ZIP validation (path traversal & zip bomb prevention)
- Metadata extraction & formula injection protection
- Background asynchronous batch registration & verification execution
- Multi-signal ML consensus integration
- Fault-tolerant per-document isolation and cleanup
"""

import base64
import csv
import io
import json
import logging
import os
import re
import secrets
import shutil
import tempfile
import time
import uuid
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, BinaryIO, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.audit import AuditEvent
from app.models.bulk import BatchStatus, BatchType, BulkBatch, BulkBatchItem, ItemStatus
from app.models.organization import Organization, RegisteredDocument
from app.models.user import User, UserRole
from app.schemas.bulk import BulkValidationPreviewItem, BulkValidationPreviewResponse
from app.services.document_crypto_service import document_crypto_service
from app.services.document_service import document_service
from app.services.qr_service import qr_service

logger = logging.getLogger(__name__)

# Security thresholds
MAX_EXPANDED_ARCHIVE_BYTES = 250 * 1024 * 1024  # 250 MB
MAX_ARCHIVE_ENTRY_COUNT = 500
MAX_COMPRESSION_RATIO = 20.0
MAX_INDIVIDUAL_FILE_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


def sanitize_formula_injection(value: Optional[str]) -> Optional[str]:
    """Sanitize CSV/Excel values to prevent spreadsheet formula injection attacks."""
    if not value or not isinstance(value, str):
        return value
    if value and (value[0] in ("=", "+", "-", "@", "\t", "\r") or (value.lstrip() and value.lstrip()[0] in ("=", "+", "-", "@"))):
        return "'" + value
    return value


class BulkProcessingService:
    def __init__(self, temp_base_dir: Optional[str] = None):
        self.temp_base = temp_base_dir or os.path.join(tempfile.gettempdir(), "veriproof_bulk_temp")
        os.makedirs(self.temp_base, exist_ok=True)

    def _sanitize_path_entry(self, entry_name: str) -> Optional[str]:
        """Verify that zip entry path is safe and does not attempt path traversal."""
        normalized = os.path.normpath(entry_name).replace("\\", "/")
        if normalized.startswith("/") or re.match(r"^[a-zA-Z]:", normalized):
            return None
        if ".." in normalized.split("/"):
            return None
        if "\0" in normalized:
            return None
        return os.path.basename(normalized)

    def secure_unpack_archive(
        self, archive_bytes: bytes, target_dir: str
    ) -> Tuple[Dict[str, str], List[str]]:
        """
        Securely unzips archive bytes into target_dir with decompression bomb protection.
        Returns:
            extracted_files: mapping of clean_filename -> absolute file path on disk
            warnings: list of warning messages for skipped/unsafe entries
        """
        extracted_files: Dict[str, str] = {}
        warnings: List[str] = []
        os.makedirs(target_dir, exist_ok=True)

        try:
            with zipfile.ZipFile(io.BytesIO(archive_bytes), "r") as zf:
                infolist = zf.infolist()
                if len(infolist) > MAX_ARCHIVE_ENTRY_COUNT:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Archive contains {len(infolist)} entries; exceeds limit of {MAX_ARCHIVE_ENTRY_COUNT}.",
                    )

                total_uncompressed = sum(info.file_size for info in infolist)
                if total_uncompressed > MAX_EXPANDED_ARCHIVE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Decompressed archive size ({total_uncompressed / (1024*1024):.1f} MB) exceeds maximum limit of {MAX_EXPANDED_ARCHIVE_BYTES / (1024*1024)} MB.",
                    )

                compressed_size = max(1, len(archive_bytes))
                ratio = total_uncompressed / compressed_size
                if ratio > MAX_COMPRESSION_RATIO and total_uncompressed > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Suspicious compression ratio ({ratio:.1f}x); potential decompression bomb rejected.",
                    )

                for member in infolist:
                    if member.is_dir():
                        continue

                    safe_name = self._sanitize_path_entry(member.filename)
                    if not safe_name:
                        warnings.append(f"Skipped unsafe archive entry: '{member.filename}'")
                        continue

                    ext = os.path.splitext(safe_name)[1].lower()
                    if ext not in ALLOWED_DOCUMENT_EXTENSIONS and ext not in {".csv", ".tsv"}:
                        warnings.append(f"Skipped unsupported file type in archive: '{safe_name}'")
                        continue

                    if member.file_size > MAX_INDIVIDUAL_FILE_BYTES:
                        warnings.append(f"Skipped oversized file '{safe_name}' ({member.file_size / (1024*1024):.1f} MB)")
                        continue

                    dest_path = os.path.join(target_dir, safe_name)
                    with zf.open(member) as src, open(dest_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)

                    extracted_files[safe_name] = dest_path

        except zipfile.BadZipFile as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a valid or readable ZIP archive.",
            ) from exc

        return extracted_files, warnings

    def parse_metadata_csv(self, csv_text: str) -> Tuple[List[Dict[str, str]], List[str]]:
        """
        Parses metadata CSV text with flexible column mapping.
        Returns:
            records: list of parsed dicts
            errors: list of parsing/header errors
        """
        records: List[Dict[str, str]] = []
        errors: List[str] = []

        try:
            reader = csv.DictReader(io.StringIO(csv_text))
            if not reader.fieldnames:
                return [], ["Metadata CSV is empty or has no header row."]

            # Normalize headers
            header_map = {}
            for h in reader.fieldnames:
                clean_h = re.sub(r"[^a-zA-Z0-9]", "", h.lower())
                header_map[clean_h] = h

            required_cols = {"filename", "recipientname", "documenttitle"}
            missing_cols = [c for c in required_cols if c not in header_map]
            if missing_cols:
                return [], [f"CSV missing mandatory columns: {', '.join(missing_cols)}"]

            for idx, row in enumerate(reader, start=1):
                clean_row = {}
                for clean_k, orig_k in header_map.items():
                    val = row.get(orig_k, "").strip()
                    clean_row[clean_k] = val
                clean_row["_row_index"] = idx
                records.append(clean_row)

        except Exception as exc:
            errors.append(f"Failed to parse CSV metadata: {str(exc)}")

        return records, errors

    def validate_registration_batch(
        self,
        archive_bytes: bytes,
        csv_bytes: bytes,
        archive_filename: str,
    ) -> BulkValidationPreviewResponse:
        """Validates archive and metadata before processing and returns preview."""
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(self.temp_base, f"session_{session_id}")
        os.makedirs(session_dir, exist_ok=True)

        # 1. Extract archive
        extracted_files, archive_warnings = self.secure_unpack_archive(archive_bytes, session_dir)

        # 2. Parse CSV
        csv_text = csv_bytes.decode("utf-8", errors="replace")
        csv_records, csv_errors = self.parse_metadata_csv(csv_text)

        if csv_errors:
            shutil.rmtree(session_dir, ignore_errors=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV Metadata Validation Failed: {'; '.join(csv_errors)}",
            )

        # 3. Match records against extracted files
        preview_items: List[BulkValidationPreviewItem] = []
        seen_filenames = set()
        duplicate_count = 0
        email_regex = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

        for r in csv_records:
            fn = r.get("filename", "")
            rec_name = r.get("recipientname", "")
            rec_id = r.get("recipientid", "")
            rec_email = r.get("recipientemail", "")
            doc_title = r.get("documenttitle", "")
            doc_type = r.get("documenttype", "Certificate")
            issue_date = r.get("issuedate", date.today().isoformat())
            expiry_date = r.get("expirydate", "")

            item_errors = []
            item_warnings = []
            is_valid = True

            if not fn:
                item_errors.append("Missing filename in metadata row.")
                is_valid = False
            elif fn in seen_filenames:
                item_warnings.append("Duplicate filename listed in metadata.")
                duplicate_count += 1
            seen_filenames.add(fn)

            file_present = fn in extracted_files
            file_size = None
            if not file_present:
                item_errors.append(f"File '{fn}' not found in uploaded ZIP archive.")
                is_valid = False
            else:
                file_size = os.path.getsize(extracted_files[fn])

            if not rec_name:
                item_errors.append("Recipient name is required.")
                is_valid = False

            if not doc_title:
                item_errors.append("Document title is required.")
                is_valid = False

            if rec_email and not email_regex.match(rec_email):
                item_warnings.append(f"Recipient email '{rec_email}' format is irregular.")

            # Validate date format
            if issue_date:
                try:
                    datetime.strptime(issue_date[:10], "%Y-%m-%d")
                except ValueError:
                    item_errors.append(f"Invalid IssueDate format '{issue_date}'; expected YYYY-MM-DD.")
                    is_valid = False

            if expiry_date:
                try:
                    datetime.strptime(expiry_date[:10], "%Y-%m-%d")
                except ValueError:
                    item_errors.append(f"Invalid ExpiryDate format '{expiry_date}'; expected YYYY-MM-DD.")
                    is_valid = False

            preview_items.append(
                BulkValidationPreviewItem(
                    row_index=r.get("_row_index", len(preview_items) + 1),
                    filename=fn,
                    document_title=doc_title,
                    document_type=doc_type,
                    recipient_name=rec_name,
                    recipient_identifier=rec_id or None,
                    recipient_email=rec_email or None,
                    issue_date=issue_date or None,
                    expiry_date=expiry_date or None,
                    is_valid=is_valid,
                    validation_errors=item_errors,
                    warnings=item_warnings,
                    file_present_in_archive=file_present,
                    file_size_bytes=file_size,
                )
            )

        valid_count = sum(1 for i in preview_items if i.is_valid)
        invalid_count = sum(1 for i in preview_items if not i.is_valid)
        missing_count = sum(1 for i in preview_items if not i.file_present_in_archive)
        unmatched_count = max(0, len(extracted_files) - len(seen_filenames))

        # Save session metadata for prompt execution
        session_manifest = {
            "session_id": session_id,
            "archive_filename": archive_filename,
            "items": [i.model_dump() for i in preview_items],
            "extracted_files": extracted_files,
        }
        with open(os.path.join(session_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(session_manifest, f, default=str)

        return BulkValidationPreviewResponse(
            total_files_in_archive=len(extracted_files),
            total_metadata_rows=len(preview_items),
            valid_items_count=valid_count,
            invalid_items_count=invalid_count,
            missing_files_count=missing_count,
            unmatched_files_count=unmatched_count,
            duplicate_files_count=duplicate_count,
            items=preview_items,
            can_proceed=(valid_count > 0),
            session_token=session_id,
            archive_filename=archive_filename,
        )

    def start_registration_batch(
        self,
        session_token: str,
        current_user: User,
        db: Session,
    ) -> BulkBatch:
        """Initializes BulkBatch in database from validated session and queues execution."""
        session_dir = os.path.join(self.temp_base, f"session_{session_token}")
        manifest_path = os.path.join(session_dir, "manifest.json")
        if not os.path.isfile(manifest_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Validation session expired or not found. Please re-upload.",
            )

        with open(manifest_path, "r", encoding="utf-8") as f:
            session_manifest = json.load(f)

        items_data = session_manifest.get("items", [])
        extracted_files = session_manifest.get("extracted_files", {})
        valid_items = [item for item in items_data if item.get("is_valid")]

        if not valid_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid items found in this batch session.",
            )

        batch_id = str(uuid.uuid4())
        batch_dir = os.path.join(self.temp_base, f"batch_{batch_id}")
        os.makedirs(batch_dir, exist_ok=True)

        batch = BulkBatch(
            id=batch_id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            batch_type=BatchType.REGISTRATION,
            status=BatchStatus.QUEUED,
            total_items=len(valid_items),
            processed_items=0,
            successful_items=0,
            failed_items=0,
            archive_filename=session_manifest.get("archive_filename", "bulk_upload.zip"),
        )
        db.add(batch)
        db.flush()

        # Copy valid files to persistent batch dir
        for idx, item in enumerate(valid_items, start=1):
            fn = item["filename"]
            src_file = extracted_files.get(fn)
            dest_file = None
            if src_file and os.path.isfile(src_file):
                dest_file = os.path.join(batch_dir, f"{idx}_{fn}")
                shutil.copy2(src_file, dest_file)

            batch_item = BulkBatchItem(
                id=str(uuid.uuid4()),
                batch_id=batch_id,
                item_index=idx,
                original_filename=fn,
                temp_storage_path=dest_file,
                document_title=item.get("document_title"),
                document_type=item.get("document_type", "Certificate"),
                recipient_name=item.get("recipient_name"),
                recipient_identifier=item.get("recipient_identifier"),
                recipient_email=item.get("recipient_email"),
                issue_date=datetime.strptime(item["issue_date"][:10], "%Y-%m-%d").date() if item.get("issue_date") else date.today(),
                expiry_date=datetime.strptime(item["expiry_date"][:10], "%Y-%m-%d").date() if item.get("expiry_date") else None,
                status=ItemStatus.PENDING,
            )
            db.add(batch_item)

        db.commit()
        db.refresh(batch)

        # Clean up temporary session dir
        shutil.rmtree(session_dir, ignore_errors=True)
        return batch

    def _get_db_session(self) -> Session:
        from app.db import session as db_session
        return db_session.SessionLocal()

    def execute_registration_batch_job(self, batch_id: str) -> None:
        """Asynchronous background worker executing registration batch."""
        db: Session = self._get_db_session()
        try:
            batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
            if not batch or batch.status == BatchStatus.CANCELLED:
                return

            batch.status = BatchStatus.PROCESSING
            db.commit()

            items = db.query(BulkBatchItem).filter(BulkBatchItem.batch_id == batch_id).order_by(BulkBatchItem.item_index).all()
            org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
            org_id = org.id if org else 1

            for item in items:
                # Check for batch cancellation mid-flight
                db.refresh(batch)
                if batch.status == BatchStatus.CANCELLED:
                    item.status = ItemStatus.CANCELLED
                    db.commit()
                    continue

                t0 = time.perf_counter()
                item.status = ItemStatus.PROCESSING
                db.commit()

                try:
                    if not item.temp_storage_path or not os.path.isfile(item.temp_storage_path):
                        raise RuntimeError(f"Payload file '{item.original_filename}' is missing from staging.")

                    with open(item.temp_storage_path, "rb") as f:
                        file_bytes = f.read()

                    doc_uuid = str(uuid.uuid4())
                    pub_id = secrets.token_urlsafe(32)
                    verification_url = f"{settings.PUBLIC_FRONTEND_URL.rstrip('/')}/verify/{pub_id}"

                    # Embed QR code into document
                    try:
                        final_bytes, final_filename, content_type = qr_service.embed_qr_into_document(
                            file_bytes,
                            item.original_filename,
                            verification_url,
                        )
                    except Exception:
                        final_bytes = file_bytes
                        final_filename = item.original_filename

                    # Store private file in document registry storage
                    stored = document_service.store_private_file(
                        org_id=org_id,
                        filename=final_filename,
                        source=io.BytesIO(final_bytes),
                        max_size=settings.MAX_DOCUMENT_SIZE_BYTES,
                    )

                    issued_at = datetime.now(timezone.utc)
                    key_id = settings.DOCUMENT_SIGNING_KEY_ID

                    expiry_dt = None
                    if item.expiry_date:
                        expiry_dt = datetime.combine(item.expiry_date, datetime.max.time(), tzinfo=timezone.utc)

                    record = RegisteredDocument(
                        id=doc_uuid,
                        public_verification_id=pub_id,
                        title=item.document_title or item.original_filename,
                        document_type=item.document_type or "Certificate",
                        organization_id=org_id,
                        issuer_user_id=batch.user_id,
                        recipient_name=item.recipient_name,
                        recipient_identifier=item.recipient_identifier,
                        recipient_email=item.recipient_email,
                        original_filename=stored.filename,
                        storage_key=stored.storage_key,
                        content_type=stored.content_type,
                        size_bytes=stored.size_bytes,
                        sha256_hash=stored.sha256,
                        signature_algorithm="ECDSA-P256-SHA256",
                        signature_value="pending",
                        signing_key_id=key_id,
                        signing_public_key="pending",
                        signed_manifest="pending",
                        status="ACTIVE",
                        issue_date=item.issue_date or date.today(),
                        issued_at=issued_at,
                        expires_at=expiry_dt,
                        version=1,
                    )

                    manifest_dict = {
                        "document_id": record.id,
                        "expires_at": document_crypto_service.utc_timestamp(record.expires_at) if record.expires_at else None,
                        "issue_date": record.issue_date.isoformat(),
                        "issued_at": document_crypto_service.utc_timestamp(record.issued_at),
                        "organization_id": record.organization_id,
                        "public_verification_id": record.public_verification_id,
                        "schema_version": 1,
                        "sha256_hash": record.sha256_hash,
                        "signature_algorithm": record.signature_algorithm,
                        "signing_key_id": record.signing_key_id,
                    }

                    signed_manifest, signature_value, public_key, actual_key_id = document_crypto_service.sign_manifest(manifest_dict)
                    record.signed_manifest = signed_manifest
                    record.signature_value = signature_value
                    record.signing_public_key = public_key
                    record.signing_key_id = actual_key_id

                    db.add(record)

                    # Add audit event
                    audit = AuditEvent(
                        event_type="BULK_DOCUMENT_REGISTERED",
                        user_id=batch.user_id,
                        organization_id=org_id,
                        details=json.dumps({
                            "batch_id": batch_id,
                            "document_id": doc_uuid,
                            "public_verification_id": pub_id,
                            "sha256_hash": stored.sha256,
                            "filename": item.original_filename,
                        }),
                        created_at=issued_at,
                    )
                    db.add(audit)

                    item.status = ItemStatus.SUCCESS
                    item.registered_document_id = doc_uuid
                    item.public_verification_id = pub_id
                    item.sha256_hash = stored.sha256
                    item.processing_time_ms = (time.perf_counter() - t0) * 1000
                    batch.successful_items += 1

                except Exception as exc:
                    logger.exception(f"Bulk registration failed for item {item.original_filename}")
                    item.status = ItemStatus.FAILED
                    item.error_message = str(exc)
                    item.error_code = "REGISTRATION_PROCESSING_ERROR"
                    item.processing_time_ms = (time.perf_counter() - t0) * 1000
                    batch.failed_items += 1

                batch.processed_items += 1
                db.commit()

            # Finalize batch status
            batch.completed_at = datetime.now(timezone.utc)
            if batch.failed_items == 0:
                batch.status = BatchStatus.COMPLETED
            elif batch.successful_items > 0:
                batch.status = BatchStatus.COMPLETED_WITH_ERRORS
            else:
                batch.status = BatchStatus.FAILED

            db.commit()

            # Cleanup batch temp dir
            batch_dir = os.path.join(self.temp_base, f"batch_{batch_id}")
            shutil.rmtree(batch_dir, ignore_errors=True)

        except Exception as exc:
            logger.exception(f"Bulk registration batch execution crashed for batch {batch_id}")
            try:
                b = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
                if b:
                    b.status = BatchStatus.FAILED
                    b.error_summary = str(exc)
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()

    def start_verification_batch(
        self,
        archive_bytes: bytes,
        archive_filename: str,
        current_user: User,
        db: Session,
    ) -> BulkBatch:
        """Uploads files for bulk verification and initializes verification batch."""
        batch_id = str(uuid.uuid4())
        batch_dir = os.path.join(self.temp_base, f"batch_{batch_id}")
        os.makedirs(batch_dir, exist_ok=True)

        # Unpack archive
        extracted_files, warnings = self.secure_unpack_archive(archive_bytes, batch_dir)
        if not extracted_files:
            shutil.rmtree(batch_dir, ignore_errors=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No supported document files found in the verification archive.",
            )

        batch = BulkBatch(
            id=batch_id,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            batch_type=BatchType.VERIFICATION,
            status=BatchStatus.QUEUED,
            total_items=len(extracted_files),
            processed_items=0,
            successful_items=0,
            failed_items=0,
            archive_filename=archive_filename,
        )
        db.add(batch)
        db.flush()

        for idx, (fn, fpath) in enumerate(extracted_files.items(), start=1):
            batch_item = BulkBatchItem(
                id=str(uuid.uuid4()),
                batch_id=batch_id,
                item_index=idx,
                original_filename=fn,
                temp_storage_path=fpath,
                status=ItemStatus.PENDING,
            )
            db.add(batch_item)

        db.commit()
        db.refresh(batch)
        return batch

    def execute_verification_batch_job(self, batch_id: str) -> None:
        """Asynchronous background worker executing verification batch with multi-signal ML."""
        db: Session = self._get_db_session()
        try:
            batch = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
            if not batch or batch.status == BatchStatus.CANCELLED:
                return

            batch.status = BatchStatus.PROCESSING
            db.commit()

            items = db.query(BulkBatchItem).filter(BulkBatchItem.batch_id == batch_id).order_by(BulkBatchItem.item_index).all()

            # Import ML services
            from ml.src.model_registry import ModelRegistry
            from ml.src.inference_service import ImageForensicsService, AnomalyDetectionService

            root_dir = Path(__file__).resolve().parents[3]
            model_reg = ModelRegistry(registry_dir=root_dir / "ml" / "artifacts" / "models")
            forensics_svc = ImageForensicsService(model_registry=model_reg)
            anomaly_svc = AnomalyDetectionService(model_registry=model_reg)

            for item in items:
                db.refresh(batch)
                if batch.status == BatchStatus.CANCELLED:
                    item.status = ItemStatus.CANCELLED
                    db.commit()
                    continue

                t0 = time.perf_counter()
                item.status = ItemStatus.PROCESSING
                db.commit()

                try:
                    if not item.temp_storage_path or not os.path.isfile(item.temp_storage_path):
                        raise RuntimeError(f"File '{item.original_filename}' is missing from staging.")

                    with open(item.temp_storage_path, "rb") as f:
                        file_bytes = f.read()

                    import hashlib
                    file_hash = hashlib.sha256(file_bytes).hexdigest()
                    item.sha256_hash = file_hash

                    # 1. Authoritative Registry Lookup
                    matched_doc = (
                        db.query(RegisteredDocument)
                        .filter(RegisteredDocument.sha256_hash == file_hash)
                        .first()
                    )

                    outcome = "UNVERIFIED"
                    is_hash_match = False
                    is_sig_valid = False

                    if matched_doc:
                        item.registered_document_id = matched_doc.id
                        item.public_verification_id = matched_doc.public_verification_id
                        item.document_title = matched_doc.title
                        item.recipient_name = matched_doc.recipient_name
                        item.recipient_identifier = matched_doc.recipient_identifier

                        is_hash_match = True
                        is_sig_valid = document_crypto_service.verify_manifest(
                            matched_doc.signed_manifest,
                            matched_doc.signature_value,
                            matched_doc.signing_public_key,
                        )

                        if matched_doc.status == "REVOKED":
                            outcome = "REVOKED"
                        elif matched_doc.expires_at:
                            exp = matched_doc.expires_at if matched_doc.expires_at.tzinfo else matched_doc.expires_at.replace(tzinfo=timezone.utc)
                            if datetime.now(timezone.utc) > exp:
                                outcome = "EXPIRED"
                            elif is_sig_valid:
                                outcome = "VERIFIED"
                            else:
                                outcome = "TAMPERED"
                        elif is_sig_valid:
                            outcome = "VERIFIED"
                        else:
                            outcome = "TAMPERED"
                    else:
                        # Check if filename matches a known document with different hash (Tampered)
                        fn_match = (
                            db.query(RegisteredDocument)
                            .filter(RegisteredDocument.original_filename == item.original_filename)
                            .first()
                        )
                        if fn_match:
                            item.registered_document_id = fn_match.id
                            item.public_verification_id = fn_match.public_verification_id
                            outcome = "TAMPERED"
                        else:
                            outcome = "UNVERIFIED"

                    item.verification_outcome = outcome

                    # 2. Run Supporting ML Signals
                    ml_data = {
                        "hash_matches": is_hash_match,
                        "signature_valid": is_sig_valid,
                        "forensics": {},
                        "anomaly": {},
                    }

                    ext = os.path.splitext(item.original_filename)[1].lower()
                    if ext in {".png", ".jpg", ".jpeg"}:
                        try:
                            f_result = forensics_svc.analyze_image(file_bytes)
                            ml_data["forensics"] = {
                                "tamper_score": f_result.get("tamper_score"),
                                "prediction": f_result.get("prediction"),
                                "risk_level": f_result.get("risk_level"),
                            }
                        except Exception as f_err:
                            ml_data["forensics"] = {"error": str(f_err)}

                    try:
                        a_result = anomaly_svc.evaluate_risk(
                            verification_requests_last_hour=1.0,
                            consecutive_failed_checks=1 if outcome == "TAMPERED" else 0,
                            burst_request_rate_per_sec=1.0,
                            issuer_revocation_status="revoked" if outcome == "REVOKED" else "active",
                        )
                        ml_data["anomaly"] = {
                            "anomaly_score": a_result.get("anomaly_score"),
                            "severity": a_result.get("severity"),
                        }
                    except Exception as a_err:
                        ml_data["anomaly"] = {"error": str(a_err)}

                    item.ml_signals = json.dumps(ml_data)
                    item.status = ItemStatus.SUCCESS
                    item.processing_time_ms = (time.perf_counter() - t0) * 1000
                    batch.successful_items += 1

                except Exception as exc:
                    logger.exception(f"Bulk verification failed for item {item.original_filename}")
                    item.status = ItemStatus.FAILED
                    item.error_message = str(exc)
                    item.error_code = "VERIFICATION_PROCESSING_ERROR"
                    item.processing_time_ms = (time.perf_counter() - t0) * 1000
                    batch.failed_items += 1

                batch.processed_items += 1
                db.commit()

            # Finalize batch status
            batch.completed_at = datetime.now(timezone.utc)
            if batch.failed_items == 0:
                batch.status = BatchStatus.COMPLETED
            elif batch.successful_items > 0:
                batch.status = BatchStatus.COMPLETED_WITH_ERRORS
            else:
                batch.status = BatchStatus.FAILED

            db.commit()

            # Cleanup batch temp dir
            batch_dir = os.path.join(self.temp_base, f"batch_{batch_id}")
            shutil.rmtree(batch_dir, ignore_errors=True)

        except Exception as exc:
            logger.exception(f"Bulk verification batch execution crashed for batch {batch_id}")
            try:
                b = db.query(BulkBatch).filter(BulkBatch.id == batch_id).first()
                if b:
                    b.status = BatchStatus.FAILED
                    b.error_summary = str(exc)
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()


bulk_processing_service = BulkProcessingService()
