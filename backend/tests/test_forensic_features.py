from app.forensics.features import extract_document_features
import pymupdf


def test_extracts_pdf_structure_without_claiming_a_verdict():
    document = pymupdf.open()
    document.new_page()
    content = document.tobytes()
    document.close()
    features = extract_document_features("credential.pdf", content)

    assert features["detected_mime_type"] == "application/pdf"
    assert features["signature_matches_extension"] is True
    assert features["pdf_header_present"] is True
    assert features["pdf_eof_marker_present"] is True
    assert features["pdf_parseable"] is True
    assert features["pdf_page_count"] == 1
    assert features["reason_codes"] == []


def test_flags_extension_and_content_mismatch():
    features = extract_document_features("credential.pdf", b"not a pdf")

    assert features["detected_mime_type"] is None
    assert features["signature_matches_extension"] is False
    assert features["reason_codes"] == ["FILE_SIGNATURE_MISMATCH"]


def test_empty_file_has_zero_entropy():
    features = extract_document_features("credential.png", b"")

    assert features["entropy_bits_per_byte"] == 0.0
    assert features["file_size_bytes"] == 0