"""Deterministic structural features for registered document bytes."""

import math
from collections import Counter
from pathlib import PurePosixPath
from typing import Any


_FILE_SIGNATURES = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
}


def extract_document_features(filename: str, content: bytes) -> dict[str, Any]:
    """Extract observable file structure; these features are not a verdict."""
    extension = PurePosixPath(filename).suffix.lower()
    expected = _FILE_SIGNATURES.get(extension)
    mime_type, signature = expected if expected else (None, None)
    signature_matches = bool(signature and content.startswith(signature))
    entropy = 0.0

    if content:
        counts = Counter(content)
        entropy = -sum(
            (count / len(content)) * math.log2(count / len(content))
            for count in counts.values()
        )

    is_pdf = extension == ".pdf" and signature_matches
    features = {
        "file_size_bytes": len(content),
        "file_extension": extension,
        "detected_mime_type": mime_type if signature_matches else None,
        "signature_matches_extension": signature_matches,
        "entropy_bits_per_byte": round(entropy, 6),
        "pdf_header_present": is_pdf,
        "pdf_eof_marker_present": is_pdf and b"%%EOF" in content[-2048:],
        "reason_codes": [] if signature_matches else ["FILE_SIGNATURE_MISMATCH"],
    }

    if is_pdf:
        features.update(
            {
                "pdf_parseable": False,
                "pdf_page_count": None,
                "pdf_metadata_present": False,
                "pdf_creator_present": False,
                "pdf_producer_present": False,
                "pdf_creation_date_present": False,
                "pdf_modification_date_present": False,
            }
        )
        try:
            import pymupdf

            with pymupdf.open(stream=content, filetype="pdf") as document:
                metadata = document.metadata or {}
                features.update(
                    {
                        "pdf_parseable": True,
                        "pdf_page_count": document.page_count,
                        "pdf_metadata_present": any(bool(value) for value in metadata.values()),
                        "pdf_creator_present": bool(metadata.get("creator")),
                        "pdf_producer_present": bool(metadata.get("producer")),
                        "pdf_creation_date_present": bool(metadata.get("creationDate")),
                        "pdf_modification_date_present": bool(metadata.get("modDate")),
                    }
                )
        except Exception:
            features["reason_codes"].append("PDF_STRUCTURE_UNREADABLE")

    return features