"""
Service for managing, inspecting, and securing organization supporting documents.

Implements secure private file storage path resolution, path-traversal prevention,
document metadata inspection, and explicit storage subsystem limitation reporting.
"""

import hashlib
import os
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import BinaryIO, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.organization import Organization, OrganizationDocument
from app.schemas.admin import OrganizationDocumentMetadata


_DEFAULT_STORAGE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "storage", "documents")
)
PRIVATE_STORAGE_BASE = os.path.abspath(settings.STORAGE_DIR or _DEFAULT_STORAGE_DIR)
_DOCUMENT_SIGNATURES = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
}


@dataclass(frozen=True)
class StoredPrivateObject:
    storage_key: str
    filename: str
    content_type: str
    size_bytes: int
    sha256: str


class DocumentService:
    """Manages secure access to organization supporting documents."""

    def __init__(self, base_storage_dir: str = PRIVATE_STORAGE_BASE):
        self.base_dir = os.path.realpath(base_storage_dir)
        workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        public_roots = (
            os.path.join(workspace_root, "public"),
            os.path.join(workspace_root, "src", "public"),
        )
        if any(self._is_within(self.base_dir, public_root) for public_root in public_roots):
            raise ValueError("Organization document storage must not be configured beneath a public frontend directory.")
        os.makedirs(self.base_dir, exist_ok=True)

    def _is_within(self, path: str, parent: str) -> bool:
        try:
            normalized_path = os.path.normcase(os.path.realpath(path))
            normalized_parent = os.path.normcase(os.path.realpath(parent))
            return os.path.commonpath((normalized_path, normalized_parent)) == normalized_parent
        except ValueError:
            return False

    def _resolve_storage_key(self, org_id: int, storage_key: str) -> Optional[str]:
        try:
            clean_key = str(uuid.UUID(storage_key))
        except (ValueError, TypeError, AttributeError):
            return None

        organization_path = os.path.join(self.base_dir, str(org_id))
        if os.path.islink(organization_path):
            return None
        organization_dir = os.path.realpath(organization_path)
        path = os.path.realpath(os.path.join(organization_dir, clean_key))
        if self._is_within(path, organization_dir) and os.path.isfile(path):
            return path
        return None

    def _resolve_safe_path(self, org_id: int, filename: str) -> Optional[str]:
        """Resolve legacy filename references only within their organization's directory."""
        if not filename:
            return None
        clean_filename = os.path.basename(filename.replace("\\", "/"))
        organization_path = os.path.join(self.base_dir, str(org_id))
        if os.path.islink(organization_path):
            return None
        organization_dir = os.path.realpath(organization_path)
        path = os.path.realpath(os.path.join(organization_dir, clean_filename))
        if self._is_within(path, organization_dir) and os.path.isfile(path):
            return path
        return None

    def store_private_file(
        self,
        org_id: int,
        filename: str,
        source: BinaryIO,
        max_size: int,
    ) -> StoredPrivateObject:
        """Stream and validate a document into its organization-private directory."""
        safe_name = os.path.basename((filename or "").replace("\\", "/"))
        safe_name = "".join(character for character in safe_name if character.isprintable() and character not in "\r\n\x00")[:255]
        signature = _DOCUMENT_SIGNATURES.get(PurePosixPath(safe_name).suffix.lower())
        if not safe_name or not signature:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF, PNG, and JPEG documents are accepted.")
        if max_size < 1:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Document upload storage is not configured.")

        organization_path = os.path.join(self.base_dir, str(org_id))
        if os.path.islink(organization_path):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Private storage path is invalid.")
        organization_dir = os.path.realpath(organization_path)
        if not self._is_within(organization_dir, self.base_dir):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Private storage path is invalid.")
        os.makedirs(organization_path, mode=0o700, exist_ok=True)
        organization_dir = os.path.realpath(organization_path)
        if not self._is_within(organization_dir, self.base_dir):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Private storage path is invalid.")

        storage_key = str(uuid.uuid4())
        temp_path: Optional[str] = None
        final_path = os.path.join(organization_dir, storage_key)
        size_bytes = 0
        file_hash = hashlib.sha256()
        header = bytearray()
        moved_to_final = False
        completed = False
        try:
            with tempfile.NamedTemporaryFile(mode="wb", dir=organization_dir, prefix=".upload-", delete=False) as temp_file:
                temp_path = temp_file.name
                while True:
                    chunk = source.read(1024 * 1024)
                    if not chunk:
                        break
                    size_bytes += len(chunk)
                    if size_bytes > max_size:
                        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Document exceeds the configured size limit.")
                    if len(header) < 8:
                        header.extend(chunk[:8 - len(header)])
                    file_hash.update(chunk)
                    temp_file.write(chunk)
                temp_file.flush()
                os.fsync(temp_file.fileno())

            content_type, expected_signature = signature
            if size_bytes == 0 or not bytes(header).startswith(expected_signature):
                raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Document content does not match its supported file type.")

            os.replace(temp_path, final_path)
            moved_to_final = True
            result = StoredPrivateObject(storage_key, safe_name, content_type, size_bytes, file_hash.hexdigest())
            completed = True
            return result
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
            if moved_to_final and not completed and os.path.isfile(final_path):
                os.remove(final_path)

    def remove_private_file(self, org_id: int, storage_key: str) -> None:
        path = self._resolve_storage_key(org_id, storage_key)
        if path:
            os.remove(path)

    def hash_uploaded_file(self, filename: str, source: BinaryIO, max_size: int) -> Tuple[str, str, int, str]:
        """Validate and hash a comparison upload without saving it to persistent storage."""
        safe_name = os.path.basename((filename or "").replace("\\", "/"))
        safe_name = "".join(character for character in safe_name if character.isprintable() and character not in "\r\n\x00")[:255]
        signature = _DOCUMENT_SIGNATURES.get(PurePosixPath(safe_name).suffix.lower())
        if not safe_name or not signature:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF, PNG, and JPEG documents are accepted.")
        if max_size < 1:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Document comparison is not configured.")

        size_bytes = 0
        file_hash = hashlib.sha256()
        header = bytearray()
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                break
            size_bytes += len(chunk)
            if size_bytes > max_size:
                raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Document exceeds the configured size limit.")
            if len(header) < 8:
                header.extend(chunk[:8 - len(header)])
            file_hash.update(chunk)

        content_type, expected_signature = signature
        if size_bytes == 0 or not bytes(header).startswith(expected_signature):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Document content does not match its supported file type.")
        return safe_name, content_type, size_bytes, file_hash.hexdigest()

    def store_uploaded_document(
        self,
        db: Session,
        organization: Organization,
        document_type: str,
        filename: str,
        source: BinaryIO,
    ) -> OrganizationDocument:
        """Stream a validated upload to private disk and commit its metadata with compensation."""
        if document_type not in ("PRIMARY", "SUPPORTING"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Unsupported document type.")

        stored = self.store_private_file(
            organization.id,
            filename,
            source,
            settings.MAX_ORGANIZATION_DOCUMENT_SIZE_BYTES,
        )
        committed = False

        try:
            document = OrganizationDocument(
                id=stored.storage_key,
                organization_id=organization.id,
                document_type=document_type,
                filename=stored.filename,
                storage_key=stored.storage_key,
                content_type=stored.content_type,
                size_bytes=stored.size_bytes,
                sha256=stored.sha256,
            )
            db.add(document)
            db.commit()
            committed = True
            db.refresh(document)
            return document
        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise
        finally:
            if not committed:
                self.remove_private_file(organization.id, stored.storage_key)

    def get_organization_documents_metadata(
        self,
        org: Organization,
    ) -> List[OrganizationDocumentMetadata]:
        """
        Construct structured metadata for all documents registered by the organization.
        Distinguishes between verified physical files in private storage ('STORED')
        and metadata-only filename references ('METADATA_ONLY').
        """
        documents: List[OrganizationDocumentMetadata] = []

        stored_types = set()
        for document in sorted(org.documents or [], key=lambda item: item.created_at, reverse=True):
            stored = self._resolve_storage_key(org.id, document.storage_key) is not None
            stored_types.add(document.document_type)
            documents.append(
                OrganizationDocumentMetadata(
                    id=document.id,
                    document_type=document.document_type,
                    label="Primary Registration Document" if document.document_type == "PRIMARY" else "Supplementary Authorization Document",
                    filename=document.filename,
                    is_uploaded=stored,
                    storage_status="STORED" if stored else "METADATA_ONLY",
                    size_bytes=document.size_bytes,
                    content_type=document.content_type,
                    uploaded_at=document.created_at,
                    limitation_notice=None if stored else "Storage subsystem limitation: The private file is missing; metadata is retained.",
                )
            )

        if org.primary_document_url and "PRIMARY" not in stored_types:
            resolved_path = self._resolve_safe_path(org.id, org.primary_document_url)
            is_stored = resolved_path is not None
            documents.append(
                OrganizationDocumentMetadata(
                    id="primary",
                    document_type="PRIMARY",
                    label="Primary Registration Document",
                    filename=os.path.basename(org.primary_document_url.replace("\\", "/")),
                    is_uploaded=is_stored,
                    storage_status="STORED" if is_stored else "METADATA_ONLY",
                    uploaded_at=org.created_at,
                    limitation_notice=(
                        None
                        if is_stored
                        else "Storage subsystem limitation: Document is registered as a metadata/filename reference. Physical file storage is not configured or file was not uploaded."
                    ),
                )
            )

        if org.supporting_document_url and "SUPPORTING" not in stored_types:
            resolved_path = self._resolve_safe_path(org.id, org.supporting_document_url)
            is_stored = resolved_path is not None
            documents.append(
                OrganizationDocumentMetadata(
                    id="supporting",
                    document_type="SUPPORTING",
                    label="Supplementary Authorization Document",
                    filename=os.path.basename(org.supporting_document_url.replace("\\", "/")),
                    is_uploaded=is_stored,
                    storage_status="STORED" if is_stored else "METADATA_ONLY",
                    uploaded_at=org.created_at,
                    limitation_notice=(
                        None
                        if is_stored
                        else "Storage subsystem limitation: Document is registered as a metadata/filename reference. Physical file storage is not configured or file was not uploaded."
                    ),
                )
            )

        return documents

    def get_document_for_download(
        self,
        org: Organization,
        doc_id: str,
    ) -> Tuple[Optional[str], Optional[OrganizationDocumentMetadata]]:
        """
        Retrieve document for secure streaming/download.
        Returns (physical_file_path, metadata).
        If physical file does not exist, physical_file_path will be None.
        """
        clean_doc_id = doc_id.strip().lower()

        stored_document = next((document for document in (org.documents or []) if document.id.lower() == clean_doc_id), None)
        if stored_document:
            physical_path = self._resolve_storage_key(org.id, stored_document.storage_key)
            is_stored = physical_path is not None
            metadata = OrganizationDocumentMetadata(
                id=stored_document.id,
                document_type=stored_document.document_type,
                label="Primary Registration Document" if stored_document.document_type == "PRIMARY" else "Supplementary Authorization Document",
                filename=stored_document.filename,
                is_uploaded=is_stored,
                storage_status="STORED" if is_stored else "METADATA_ONLY",
                size_bytes=stored_document.size_bytes,
                content_type=stored_document.content_type,
                uploaded_at=stored_document.created_at,
                limitation_notice=None if is_stored else "Storage subsystem limitation: The private file is missing; metadata is retained.",
            )
            return physical_path, metadata

        if clean_doc_id in ("primary", "1"):
            target_filename = org.primary_document_url
            doc_type = "PRIMARY"
            label = "Primary Registration Document"
        elif clean_doc_id in ("supporting", "2"):
            target_filename = org.supporting_document_url
            doc_type = "SUPPORTING"
            label = "Supplementary Authorization Document"
        else:
            return None, None

        if not target_filename:
            return None, None

        physical_path = self._resolve_safe_path(org.id, target_filename)
        is_stored = physical_path is not None

        metadata = OrganizationDocumentMetadata(
            id=clean_doc_id,
            document_type=doc_type,
            label=label,
            filename=target_filename,
            is_uploaded=is_stored,
            storage_status="STORED" if is_stored else "METADATA_ONLY",
            uploaded_at=org.created_at,
            limitation_notice=(
                None
                if is_stored
                else "Storage subsystem limitation: Document is registered as a metadata/filename reference. Physical file storage is not configured or file was not uploaded."
            ),
        )

        return physical_path, metadata


# Global singleton instance
document_service = DocumentService()
