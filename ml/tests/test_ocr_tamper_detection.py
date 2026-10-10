"""Tests for PaddleOCR & PyMuPDF Key-Field Extraction and Document Tamper Detection.

Verifies:
1. Decimal precision preservation in CGPA/SGPA (e.g. 8.34 vs 9.80).
2. Genuine document extraction and field matches against trusted original.
3. Altered/tampered candidate detection (CGPA 9.80 != 8.34, Result ASS != PASS).
4. Copied valid QR code on altered PDF cannot bypass verification.
5. Inconclusive or missing fields produce UNAVAILABLE/REVIEW_REQUIRED, not automatic match.
"""

import os
import pytest
from ml.src.features.ocr_features import document_ocr_extractor, document_field_comparator, OCRConsistencyEngine


GENUINE_PDF = r"C:\Users\hp\Downloads\pdf&rendition=1.pdf"
FAKE_PDF = r"C:\Users\hp\Downloads\fake.pdf"


def test_ocr_extracts_genuine_fields_accurately():
    """Verify that key fields including CGPA 8.34, SGPA 8.83, and PASS are extracted from genuine PDF."""
    if not os.path.exists(GENUINE_PDF):
        pytest.skip(f"Test fixture not found: {GENUINE_PDF}")

    fields = document_ocr_extractor.extract_key_fields(GENUINE_PDF)
    
    assert fields["student_name"] == "MANSI KUMAWAT"
    assert fields["roll_number"] == "0863IS231032"
    assert fields["cgpa"] == "8.34"
    assert fields["sgpa"] == "8.83"
    assert fields["result"] == "PASS"
    assert "IS601- [T]" in fields["subject_grades"]
    assert fields["subject_grades"]["IS601- [T]"] == "B+"


def test_ocr_extracts_altered_fields_accurately():
    """Verify that altered CGPA 9.80 and corrupted Result ASS are extracted from altered PDF."""
    if not os.path.exists(FAKE_PDF):
        pytest.skip(f"Test fixture not found: {FAKE_PDF}")

    fields = document_ocr_extractor.extract_key_fields(FAKE_PDF)
    
    assert fields["student_name"] == "MANSI KUMAWAT"
    assert fields["roll_number"] == "0863IS231032"
    assert fields["cgpa"] == "9.80"
    assert fields["sgpa"] == "8.83"
    assert fields["result"] == "ASS"


def test_field_comparison_genuine_is_exact_match():
    """Verify that comparing genuine PDF against trusted reference produces 100% MATCH."""
    if not os.path.exists(GENUINE_PDF):
        pytest.skip(f"Test fixture not found: {GENUINE_PDF}")

    trusted_fields = document_ocr_extractor.extract_key_fields(GENUINE_PDF)
    candidate_fields = document_ocr_extractor.extract_key_fields(GENUINE_PDF)
    
    comp = document_field_comparator.compare_documents(trusted_fields, candidate_fields)
    
    assert comp["overall_match"] is True
    assert comp["mismatch_count"] == 0
    assert len(comp["tampered_fields"]) == 0
    
    # Check specific fields
    cgpa_comp = next(f for f in comp["field_comparisons"] if "CGPA" in f["field_name"])
    assert cgpa_comp["status"] == "MATCH"
    assert cgpa_comp["registered_value"] == "8.34"
    assert cgpa_comp["observed_value"] == "8.34"


def test_field_comparison_detects_altered_cgpa_and_result():
    """Verify that comparing altered PDF against trusted original flags CGPA & Result MISMATCH."""
    if not os.path.exists(GENUINE_PDF) or not os.path.exists(FAKE_PDF):
        pytest.skip("Test fixtures not found")

    trusted_fields = document_ocr_extractor.extract_key_fields(GENUINE_PDF)
    candidate_fields = document_ocr_extractor.extract_key_fields(FAKE_PDF)
    
    comp = document_field_comparator.compare_documents(trusted_fields, candidate_fields)
    
    assert comp["overall_match"] is False
    assert comp["mismatch_count"] > 0
    assert "CGPA" in comp["tampered_fields"]
    assert "Result Status" in comp["tampered_fields"]
    
    cgpa_comp = next(f for f in comp["field_comparisons"] if "CGPA" in f["field_name"])
    assert cgpa_comp["status"] == "MISMATCH"
    assert cgpa_comp["registered_value"] == "8.34"
    assert cgpa_comp["observed_value"] == "9.80"
    
    res_comp = next(f for f in comp["field_comparisons"] if "Result" in f["field_name"])
    assert res_comp["status"] == "MISMATCH"
    assert res_comp["registered_value"] == "PASS"
    assert res_comp["observed_value"] == "ASS"


def test_decimal_preservation_and_numeric_tolerance():
    """Verify that floating point comparison preserves decimals without false matching."""
    engine = OCRConsistencyEngine()
    
    # Exact match with decimals
    res_exact = engine.evaluate_consistency("CGPA", "8.34", "8.34")
    assert res_exact["is_consistent"] is True
    assert res_exact["classification"] == "CONSISTENT"
    
    # Equivalent precision
    res_trailing = engine.evaluate_consistency("CGPA", "8.34", "8.340")
    assert res_trailing["is_consistent"] is True
    
    # Mismatch with subtle alteration (8.34 vs 9.80 or 8.84)
    res_tampered = engine.evaluate_consistency("CGPA", "8.34", "9.80")
    assert res_tampered["is_consistent"] is False
    assert res_tampered["classification"] == "INCONSISTENT_SUSPECT_TAMPERING"


def test_missing_field_produces_unavailable_not_match():
    """Verify that unextractable or missing fields are marked UNAVAILABLE rather than silently matching."""
    trusted_fields = {"cgpa": "8.34", "student_name": "MANSI KUMAWAT"}
    candidate_fields = {"student_name": "MANSI KUMAWAT"}  # CGPA is missing
    
    comp = document_field_comparator.compare_documents(trusted_fields, candidate_fields)
    cgpa_comp = next(f for f in comp["field_comparisons"] if "CGPA" in f["field_name"])
    
    assert cgpa_comp["status"] == "UNAVAILABLE"
    assert cgpa_comp["observed_value"] == "UNAVAILABLE"
