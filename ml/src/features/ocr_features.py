"""OCR feature extraction, text normalization, key-field parsing, and document consistency rules."""

import io
import re
import difflib
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image

try:
    import pymupdf  # PyMuPDF
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        pymupdf = None

try:
    import cv2
except ImportError:
    cv2 = None


class OCRConsistencyEngine:
    """Evaluates extracted document text against structural rules and cross-field logic."""

    def __init__(self, fuzzy_threshold: float = 0.82):
        self.fuzzy_threshold = fuzzy_threshold

    def calculate_similarity(self, text_a: str, text_b: str) -> float:
        """Compute normalized Levenshtein-like similarity ratio."""
        if not text_a or not text_b:
            return 0.0
        matcher = difflib.SequenceMatcher(None, text_a.strip().lower(), text_b.strip().lower())
        return round(matcher.ratio(), 4)

    def normalize_text(self, raw_text: str) -> str:
        """Clean and normalize OCR strings removing erratic scan noise."""
        if not raw_text:
            return ""
        # Collapse whitespace
        text = re.sub(r"\s+", " ", raw_text).strip()
        return text

    def validate_roll_number(self, roll_number: str) -> Tuple[bool, str]:
        """Validate Indian academic institution roll number format (e.g., VU-2022-22295, 0863IS231032)."""
        if not roll_number:
            return False, "Empty roll number"
            
        clean_roll = roll_number.strip().upper()
        # Pattern 1: Hyphenated institutional roll number (e.g., VU-2022-22295)
        pattern_hyphen = r"^[A-Z]{2,4}-\d{4}-\d{4,6}$"
        # Pattern 2: RGPV / University enrollment format (e.g., 0863IS231032)
        pattern_alphanum = r"^[0-9]{4}[A-Z]{2,4}[0-9]{5,8}$"

        if re.match(pattern_hyphen, clean_roll) or re.match(pattern_alphanum, clean_roll):
            return True, "Valid roll number format"

        # Check if benign 0/O or 1/I substitution happened
        repaired = clean_roll.replace("O", "0").replace("I", "1")
        if re.match(pattern_hyphen, repaired) or re.match(pattern_alphanum, repaired):
            return True, "Valid roll number after OCR character repair (O->0, I->1)"

        return False, "Invalid roll number format"

    def validate_date_chronology(
        self,
        passing_year: Optional[Union[int, str]],
        issue_date_str: Optional[str],
        convocation_year: Optional[Union[int, str]] = None
    ) -> Tuple[bool, str]:
        """Verify that document issue date does not logically predate graduation/passing year."""
        try:
            p_year = int(passing_year) if passing_year else None
        except (ValueError, TypeError):
            return False, "Unparseable passing year"

        if not issue_date_str:
            return True, "Issue date not provided"

        # Try parsing DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD
        parsed_issue_year = None
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y"):
            try:
                dt = datetime.strptime(issue_date_str.strip(), fmt)
                parsed_issue_year = dt.year
                break
            except ValueError:
                continue

        if parsed_issue_year is None:
            # Fallback regex for 4-digit year
            m = re.search(r"\b(19\d\d|20\d\d)\b", issue_date_str)
            if m:
                parsed_issue_year = int(m.group(1))

        if parsed_issue_year and p_year:
            if parsed_issue_year < p_year:
                return False, f"Logical inconsistency: Document issue year ({parsed_issue_year}) is earlier than passing year ({p_year})"

        return True, "Date chronology is logically consistent"

    def evaluate_consistency(
        self,
        field_name: str,
        ground_truth_val: str,
        ocr_extracted_val: str,
        ocr_confidence: float = 0.90
    ) -> Dict[str, Any]:
        """Perform unified consistency classification on an OCR field extraction."""
        gt_norm = self.normalize_text(ground_truth_val)
        ocr_norm = self.normalize_text(ocr_extracted_val)
        sim = self.calculate_similarity(gt_norm, ocr_norm)

        warnings = []
        is_consistent = False
        classification = "CONSISTENT"

        # Field-specific numeric comparison for CGPA / SGPA
        if field_name.lower() in ("cgpa", "sgpa", "gpa", "percentage"):
            try:
                gt_num = float(gt_norm)
                ocr_num = float(ocr_norm)
                if abs(gt_num - ocr_num) < 1e-3:
                    is_consistent = True
                    classification = "CONSISTENT"
                else:
                    is_consistent = False
                    classification = "INCONSISTENT_SUSPECT_TAMPERING"
                    warnings.append(f"Extracted numeric value '{ocr_norm}' does not match expected '{gt_norm}' for {field_name}")
                return {
                    "field_name": field_name,
                    "ground_truth_value": gt_norm,
                    "ocr_extracted_value": ocr_norm,
                    "ocr_confidence": ocr_confidence,
                    "similarity_score": 1.0 if is_consistent else 0.0,
                    "is_consistent": is_consistent,
                    "classification": classification,
                    "warnings": warnings,
                }
            except (ValueError, TypeError):
                pass

        if gt_norm == ocr_norm:
            is_consistent = True
            classification = "CONSISTENT"
        elif sim >= self.fuzzy_threshold:
            is_consistent = True
            classification = "BENIGN_OCR_NOISE"
            warnings.append(f"Minor character scan noise detected in '{field_name}' (similarity: {sim})")
        elif ocr_confidence < 0.60:
            classification = "AMBIGUOUS"
            warnings.append(f"Low OCR confidence ({ocr_confidence:.2f}) for '{field_name}'; requires human verification")
        else:
            # High confidence OCR reading that contradicts ground truth indicates potential tampering
            classification = "INCONSISTENT_SUSPECT_TAMPERING"
            warnings.append(f"High-confidence OCR value '{ocr_norm}' contradicts expected registry field '{gt_norm}'")

        return {
            "field_name": field_name,
            "ground_truth_value": gt_norm,
            "ocr_extracted_value": ocr_norm,
            "ocr_confidence": ocr_confidence,
            "similarity_score": sim,
            "is_consistent": is_consistent,
            "classification": classification,
            "warnings": warnings
        }


class DocumentOCRExtractor:
    """End-to-End PDF & Image OCR extraction engine with key-field normalization."""

    def __init__(self):
        self._paddle_ocr = None
        self._init_paddle()

    def _init_paddle(self):
        """Optionally initialize PaddleOCR engine if available."""
        try:
            from paddleocr import PaddleOCR
            self._paddle_ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        except Exception:
            self._paddle_ocr = None

    def render_pdf_to_images(self, pdf_bytes: bytes, dpi: int = 300) -> List[np.ndarray]:
        """Render multi-page PDF bytes into high-resolution numpy image arrays."""
        if pymupdf is None:
            return []
        
        images = []
        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                pix = page.get_pixmap(dpi=dpi)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                images.append(np.array(img))
            doc.close()
        except Exception:
            pass
        return images

    def preprocess_image(self, img_array: np.ndarray) -> np.ndarray:
        """Apply OpenCV orientation, grayscale, and contrast preprocessing while preserving text dots."""
        if cv2 is None or img_array is None:
            return img_array

        try:
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array.copy()

            # Slight bilateral filter to preserve sharp edges and decimal points
            filtered = cv2.bilateralFilter(gray, 9, 75, 75)
            return filtered
        except Exception:
            return img_array

    def extract_document_text_and_blocks(
        self,
        file_input: Union[bytes, str, Path],
        filename: str = ""
    ) -> Dict[str, Any]:
        """Extract full text, lines, bounding boxes, and confidence scores from PDF or image."""
        raw_bytes = None
        if isinstance(file_input, (str, Path)):
            with open(file_input, "rb") as f:
                raw_bytes = f.read()
        elif isinstance(file_input, bytes):
            raw_bytes = file_input

        if not raw_bytes:
            return {"full_text": "", "blocks": [], "confidence": 0.0}

        is_pdf = raw_bytes.startswith(b"%PDF") or filename.lower().endswith(".pdf")
        full_text = ""
        blocks = []
        confidences = []

        if is_pdf and pymupdf is not None:
            try:
                doc = pymupdf.open(stream=raw_bytes, filetype="pdf")
                for page_num, page in enumerate(doc):
                    page_text = page.get_text()
                    full_text += page_text + "\n"
                    
                    # Extract detailed text spans with bounding boxes
                    text_dict = page.get_text("dict")
                    for block in text_dict.get("blocks", []):
                        if "lines" in block:
                            for line in block["lines"]:
                                line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                                if line_text.strip():
                                    bbox = list(line.get("bbox", [0, 0, 0, 0]))
                                    blocks.append({
                                        "text": line_text.strip(),
                                        "bbox": bbox,
                                        "confidence": 0.98,
                                        "page": page_num + 1
                                    })
                                    confidences.append(0.98)
                doc.close()
            except Exception:
                pass

        # Fallback/augmentation with PaddleOCR if available and text is sparse
        if len(full_text.strip()) < 20 and self._paddle_ocr is not None:
            try:
                if is_pdf:
                    images = self.render_pdf_to_images(raw_bytes, dpi=200)
                else:
                    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
                    images = [np.array(img)]

                for page_idx, img_arr in enumerate(images):
                    prep = self.preprocess_image(img_arr)
                    ocr_res = self._paddle_ocr.ocr(prep, cls=True)
                    if ocr_res and ocr_res[0]:
                        for line in ocr_res[0]:
                            box, (txt, conf) = line
                            full_text += txt + "\n"
                            blocks.append({
                                "text": txt,
                                "bbox": box,
                                "confidence": float(conf),
                                "page": page_idx + 1
                            })
                            confidences.append(float(conf))
            except Exception:
                pass

        avg_conf = float(np.mean(confidences)) if confidences else 0.95

        return {
            "full_text": full_text.strip(),
            "blocks": blocks,
            "confidence": round(avg_conf, 4)
        }

    def extract_key_fields(
        self,
        file_input: Union[bytes, str, Path],
        filename: str = ""
    ) -> Dict[str, Any]:
        """Extract structured academic marksheet / certificate key fields."""
        res = self.extract_document_text_and_blocks(file_input, filename=filename)
        text = res["full_text"]
        blocks = res["blocks"]
        confidence = res["confidence"]

        fields: Dict[str, Any] = {
            "student_name": None,
            "roll_number": None,
            "institution": None,
            "course": None,
            "branch": None,
            "semester": None,
            "result": None,
            "sgpa": None,
            "cgpa": None,
            "revaluation_date": None,
            "subject_grades": {},
            "raw_text_length": len(text),
            "ocr_confidence": confidence
        }

        if not text:
            return fields

        # 1. Student Name
        m_name = re.search(r"Name\s*\n\s*([A-Z\s]+?)\s*\n\s*Roll", text, re.IGNORECASE)
        if m_name:
            fields["student_name"] = m_name.group(1).strip()
        else:
            m_name2 = re.search(r"(?:Student\s*Name|Candidate\s*Name|Name\s*of\s*Candidate)\s*[:\n]\s*([A-Z\s]{3,40})", text, re.IGNORECASE)
            if m_name2:
                fields["student_name"] = m_name2.group(1).strip()

        # 2. Roll / Registration Number
        m_roll = re.search(r"Roll\s*No\.?\s*\n\s*([A-Z0-9]+)", text, re.IGNORECASE)
        if m_roll:
            fields["roll_number"] = m_roll.group(1).strip()
        else:
            m_roll2 = re.search(r"(?:Roll\s*(?:No\.?|Number)?(?:\s*/\s*Registration)?|Enrollment\s*(?:No\.?|Number)?|Registration\s*(?:No\.?|Number)?)\s*[:\s]*([A-Z0-9-]{6,20})", text, re.IGNORECASE)
            if m_roll2:
                fields["roll_number"] = m_roll2.group(1).strip()


        # 3. Course, Branch, Semester
        m_course = re.search(r"Course\s*\n\s*([^\n]+)", text, re.IGNORECASE)
        if m_course:
            fields["course"] = m_course.group(1).strip()

        m_branch = re.search(r"Branch\s*\n\s*([^\n]+)", text, re.IGNORECASE)
        if m_branch:
            fields["branch"] = m_branch.group(1).strip()

        m_sem = re.search(r"Semester\s*\n\s*([0-9]+)", text, re.IGNORECASE)
        if m_sem:
            fields["semester"] = m_sem.group(1).strip()

        # 4. Result, SGPA, CGPA
        m_res_table = re.search(
            r"Result\s*Des\.?\s*\n\s*SGPA\s*\n\s*CGPA\s*\n\s*([A-Za-z]+)\s*\n\s*([0-9]+\.[0-9]+)\s*\n\s*([0-9]+\.[0-9]+)",
            text,
            re.IGNORECASE
        )
        if m_res_table:
            fields["result"] = m_res_table.group(1).strip()
            fields["sgpa"] = m_res_table.group(2).strip()
            fields["cgpa"] = m_res_table.group(3).strip()
        else:
            # Individual regex extractors
            m_cgpa = re.search(r"CGPA\s*[:\n\s]*([0-9]+\.[0-9]+)", text, re.IGNORECASE)
            if m_cgpa:
                fields["cgpa"] = m_cgpa.group(1).strip()

            m_sgpa = re.search(r"SGPA\s*[:\n\s]*([0-9]+\.[0-9]+)", text, re.IGNORECASE)
            if m_sgpa:
                fields["sgpa"] = m_sgpa.group(1).strip()

            m_res = re.search(r"Result(?:\s*Des\.?)?\s*[:\n\s]*\b(PASS|FAIL|ASS|PROMOTED|WITHHELD)\b", text, re.IGNORECASE)
            if m_res:
                fields["result"] = m_res.group(1).strip()

        # 5. Dates
        m_rev_date = re.search(
            r"Revaluation\s*Date\s*\n\s*(?:Revaluation\s*Date\s*with\s*Late\s*Fee\s*\n\s*)?([0-9]{2}/[0-9]{2}/[0-9]{4})",
            text,
            re.IGNORECASE
        )
        if m_rev_date:
            fields["revaluation_date"] = m_rev_date.group(1).strip()

        # 6. Institution
        m_inst = re.search(r"([A-Za-z\s]+(?:Vishwavidyalaya|University|Institute|College)[^\n]*)", text)
        if m_inst:
            fields["institution"] = m_inst.group(1).strip()

        # 7. Subject Codes and Grades
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        subject_grades = {}
        for i, line in enumerate(lines):
            if re.match(r"^[A-Z0-9]+-\s*\[.*\]", line):
                sub_code = line
                # Look ahead for credits and grade (grade is usually the 4th item or last in block)
                if i + 3 < len(lines):
                    grade_val = lines[i + 3]
                    # Verify grade format (e.g., A+, B+, A, B, Be, Ae, O, F, etc.)
                    if len(grade_val) <= 4:
                        subject_grades[sub_code] = grade_val
        fields["subject_grades"] = subject_grades

        return fields


class DocumentFieldComparator:
    """Performs rigorous key-field comparison between trusted registered original and submitted candidate."""

    def __init__(self, consistency_engine: Optional[OCRConsistencyEngine] = None):
        self.engine = consistency_engine or OCRConsistencyEngine()

    def compare_documents(
        self,
        trusted_fields: Dict[str, Any],
        candidate_fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Produce field-by-field comparison matrix with explicit statuses and explanations."""
        comparisons = []
        mismatch_count = 0
        overall_match = True
        tampered_fields = []

        # 1. CGPA Comparison (Numerical preservation)
        exp_cgpa = trusted_fields.get("cgpa")
        obs_cgpa = candidate_fields.get("cgpa")
        if exp_cgpa is not None and obs_cgpa is not None:
            try:
                exp_val = float(exp_cgpa)
                obs_val = float(obs_cgpa)
                if abs(exp_val - obs_val) < 1e-3:
                    comparisons.append({
                        "field_name": "CGPA (Cumulative Grade Point Average)",
                        "registered_value": str(exp_cgpa),
                        "observed_value": str(obs_cgpa),
                        "status": "MATCH",
                        "confidence": 99.8,
                        "comparison_rule": "NUMERICAL_FLOAT_EXACT",
                        "evidence": f"Calculated exact parity: expected {exp_cgpa} matches observed {obs_cgpa}."
                    })
                else:
                    overall_match = False
                    mismatch_count += 1
                    tampered_fields.append("CGPA")
                    comparisons.append({
                        "field_name": "CGPA (Cumulative Grade Point Average)",
                        "registered_value": str(exp_cgpa),
                        "observed_value": str(obs_cgpa),
                        "status": "MISMATCH",
                        "confidence": 99.5,
                        "comparison_rule": "NUMERICAL_FLOAT_EXACT",
                        "evidence": f"Altered grade point detected: expected registered value is {exp_cgpa}, but observed candidate contains {obs_cgpa}."
                    })
            except (ValueError, TypeError):
                comparisons.append({
                    "field_name": "CGPA (Cumulative Grade Point Average)",
                    "registered_value": str(exp_cgpa),
                    "observed_value": str(obs_cgpa),
                    "status": "SUSPICIOUS",
                    "confidence": 75.0,
                    "comparison_rule": "NUMERICAL_PARSE",
                    "evidence": "Unable to parse numeric values for CGPA comparison."
                })
        elif exp_cgpa is not None and obs_cgpa is None:
            comparisons.append({
                "field_name": "CGPA (Cumulative Grade Point Average)",
                "registered_value": str(exp_cgpa),
                "observed_value": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "confidence": 0.0,
                "comparison_rule": "EXTRACTION_MISSING",
                "evidence": "Candidate document did not yield a readable CGPA field; manual review required."
            })

        # 2. SGPA Comparison
        exp_sgpa = trusted_fields.get("sgpa")
        obs_sgpa = candidate_fields.get("sgpa")
        if exp_sgpa is not None and obs_sgpa is not None:
            try:
                exp_s = float(exp_sgpa)
                obs_s = float(obs_sgpa)
                if abs(exp_s - obs_s) < 1e-3:
                    comparisons.append({
                        "field_name": "SGPA (Semester Grade Point Average)",
                        "registered_value": str(exp_sgpa),
                        "observed_value": str(obs_sgpa),
                        "status": "MATCH",
                        "confidence": 99.6,
                        "comparison_rule": "NUMERICAL_FLOAT_EXACT",
                        "evidence": f"Exact numeric match: {obs_sgpa}."
                    })
                else:
                    overall_match = False
                    mismatch_count += 1
                    tampered_fields.append("SGPA")
                    comparisons.append({
                        "field_name": "SGPA (Semester Grade Point Average)",
                        "registered_value": str(exp_sgpa),
                        "observed_value": str(obs_sgpa),
                        "status": "MISMATCH",
                        "confidence": 99.2,
                        "comparison_rule": "NUMERICAL_FLOAT_EXACT",
                        "evidence": f"Expected SGPA {exp_sgpa}, but observed candidate contains {obs_sgpa}."
                    })
            except (ValueError, TypeError):
                pass

        # 3. Result Status Comparison (e.g. PASS vs ASS)
        exp_res = trusted_fields.get("result")
        obs_res = candidate_fields.get("result")
        if exp_res and obs_res:
            if exp_res.strip().upper() == obs_res.strip().upper():
                comparisons.append({
                    "field_name": "Result Status",
                    "registered_value": exp_res,
                    "observed_value": obs_res,
                    "status": "MATCH",
                    "confidence": 99.9,
                    "comparison_rule": "TEXTUAL_EXACT",
                    "evidence": f"Status match: {obs_res}."
                })
            else:
                overall_match = False
                mismatch_count += 1
                tampered_fields.append("Result Status")
                comparisons.append({
                    "field_name": "Result Status",
                    "registered_value": exp_res,
                    "observed_value": obs_res,
                    "status": "MISMATCH",
                    "confidence": 98.5,
                    "comparison_rule": "TEXTUAL_EXACT",
                    "evidence": f"Expected '{exp_res}', but observed candidate contains '{obs_res}' (tampering or corrupted character dropping)."
                })

        # 4. Student Name Comparison
        exp_name = trusted_fields.get("student_name")
        obs_name = candidate_fields.get("student_name")
        if exp_name and obs_name:
            sim = self.engine.calculate_similarity(exp_name, obs_name)
            if sim >= 0.88:
                comparisons.append({
                    "field_name": "Student Name",
                    "registered_value": exp_name,
                    "observed_value": obs_name,
                    "status": "MATCH",
                    "confidence": round(sim * 100, 1),
                    "comparison_rule": "NAME_FUZZY_MATCH",
                    "evidence": f"Identity verified with similarity {sim:.2f}."
                })
            else:
                overall_match = False
                mismatch_count += 1
                tampered_fields.append("Student Name")
                comparisons.append({
                    "field_name": "Student Name",
                    "registered_value": exp_name,
                    "observed_value": obs_name,
                    "status": "MISMATCH",
                    "confidence": round(sim * 100, 1),
                    "comparison_rule": "NAME_FUZZY_MATCH",
                    "evidence": f"Expected recipient '{exp_name}', but candidate contains '{obs_name}'."
                })

        # 5. Roll / Registration Number Comparison
        exp_roll = trusted_fields.get("roll_number")
        obs_roll = candidate_fields.get("roll_number")
        if exp_roll and obs_roll:
            if exp_roll.strip().upper() == obs_roll.strip().upper():
                comparisons.append({
                    "field_name": "Roll / Registration Number",
                    "registered_value": exp_roll,
                    "observed_value": obs_roll,
                    "status": "MATCH",
                    "confidence": 100.0,
                    "comparison_rule": "IDENTIFIER_EXACT",
                    "evidence": "Exact identifier match with registered record."
                })
            else:
                overall_match = False
                mismatch_count += 1
                tampered_fields.append("Roll Number")
                comparisons.append({
                    "field_name": "Roll / Registration Number",
                    "registered_value": exp_roll,
                    "observed_value": obs_roll,
                    "status": "MISMATCH",
                    "confidence": 99.0,
                    "comparison_rule": "IDENTIFIER_EXACT",
                    "evidence": f"Expected roll number '{exp_roll}', but observed '{obs_roll}'."
                })

        # 6. Institution Comparison
        exp_inst = trusted_fields.get("institution")
        obs_inst = candidate_fields.get("institution")
        if exp_inst and obs_inst:
            sim = self.engine.calculate_similarity(exp_inst, obs_inst)
            if sim >= 0.80:
                comparisons.append({
                    "field_name": "Issuing Institution",
                    "registered_value": exp_inst,
                    "observed_value": obs_inst,
                    "status": "MATCH",
                    "confidence": round(sim * 100, 1),
                    "comparison_rule": "INSTITUTION_FUZZY_MATCH",
                    "evidence": f"Institution name verified with {sim:.2f} similarity."
                })
            else:
                overall_match = False
                mismatch_count += 1
                tampered_fields.append("Institution")
                comparisons.append({
                    "field_name": "Issuing Institution",
                    "registered_value": exp_inst,
                    "observed_value": obs_inst,
                    "status": "MISMATCH",
                    "confidence": round(sim * 100, 1),
                    "comparison_rule": "INSTITUTION_FUZZY_MATCH",
                    "evidence": f"Institution mismatch: expected '{exp_inst}', observed '{obs_inst}'."
                })

        # 7. Subject Grades Comparison
        exp_subs = trusted_fields.get("subject_grades", {})
        obs_subs = candidate_fields.get("subject_grades", {})
        if exp_subs and obs_subs:
            for sub_code, exp_g in exp_subs.items():
                obs_g = obs_subs.get(sub_code)
                if obs_g is not None:
                    if exp_g.strip().upper() == obs_g.strip().upper():
                        comparisons.append({
                            "field_name": f"Subject Grade: {sub_code}",
                            "registered_value": exp_g,
                            "observed_value": obs_g,
                            "status": "MATCH",
                            "confidence": 99.5,
                            "comparison_rule": "GRADE_EXACT",
                            "evidence": f"Grade '{obs_g}' matches registry."
                        })
                    else:
                        overall_match = False
                        mismatch_count += 1
                        tampered_fields.append(f"Grade {sub_code}")
                        comparisons.append({
                            "field_name": f"Subject Grade: {sub_code}",
                            "registered_value": exp_g,
                            "observed_value": obs_g,
                            "status": "MISMATCH",
                            "confidence": 98.0,
                            "comparison_rule": "GRADE_EXACT",
                            "evidence": f"Subject {sub_code} grade modified: expected '{exp_g}', but candidate has '{obs_g}'."
                        })

        return {
            "overall_match": overall_match,
            "mismatch_count": mismatch_count,
            "tampered_fields": tampered_fields,
            "field_comparisons": comparisons,
            "extracted_fields": candidate_fields
        }


# Global singleton extractor and comparator
document_ocr_extractor = DocumentOCRExtractor()
document_field_comparator = DocumentFieldComparator()
