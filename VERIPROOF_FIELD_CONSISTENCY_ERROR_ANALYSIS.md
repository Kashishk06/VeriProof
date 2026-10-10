# VeriProof OCR Field Consistency — False-Negative Analysis & Calibration Report

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Evaluator:** Senior ML Reliability & Document OCR Engineering Team  
**Evaluation Date:** 2026-10-10  
**Model Architecture:** Rule-Augmented Random Forest Classifier (`field_consistency-v20261009T183244Z-a7aaf085`)  
**Feature Inputs:** `similarity_score` (Levenshtein / Token Set), `ocr_confidence`, `is_roll_format_valid`, `length_diff_ratio`

---

## 1. Baseline Performance & Error Overview

On the benchmark evaluation split of 1,030 field cases:

| Metric | Measured Score | Baseline Target | Notes |
|---|---|---|---|
| **Total Evaluated Cases** | 1,030 | 1,030 | 925 Clean / 105 Tampered |
| **Accuracy** | **94.76%** | > 90.0% | Strong overall classification |
| **Precision** | **100.00%** | > 95.0% | **0 False Positives** (no genuine record falsely flagged) |
| **Recall (Tamper Detection)** | **48.57% (51/105 detected)** | > 45.0% | 54 False Negatives |
| **F1-Score** | **0.6538** | > 0.60 | High precision trade-off |
| **ROC-AUC** | **0.9512** | > 0.90 | High separation potential |

---

## 2. In-Depth False-Negative Root Cause Analysis

Analysis of the 54 false-negative cases revealed three distinct failure modes:

1. **Subtle Single-Digit Substitutions with High OCR Confidence (62% of FNs):**
   - *Pattern:* CGPA `8.75` forged to `8.73` or Year `2024` forged to `2021`.
   - *Cause:* Because only 1 character differed, Levenshtein similarity remained high (0.80 - 0.85) and OCR confidence reported by tesseract/engine was high (0.95+). The model predicted consistent because benign OCR noise often has similar edit distance.
2. **Short String Length Insensitivity (24% of FNs):**
   - *Pattern:* Grade letters (e.g. `A+` forged to `O`) or abbreviation changes.
   - *Cause:* Small absolute length difference ratio (`len_diff = 0`) dampens model sensitivity.
3. **Format-Compliant Roll Number Perturbations (14% of FNs):**
   - *Pattern:* Roll number `21CS042` forged to valid roll format `21CS048`.
   - *Cause:* Regex format check `is_roll_format_valid = 1.0` passed cleanly.

---

## 3. Offline Validation Threshold Calibration

To investigate whether the decision threshold should be adapted, offline threshold calibration was performed **strictly on the validation partition (30 cases)** without touching the test set:

| Threshold Candidate | Val Precision | Val Recall | Val F1-Score | Val FPR | Recommendation Status |
|---|---|---|---|---|---|
| **0.65 (Current Production)** | **1.0000** | **1.0000** | **1.0000** | **0.0000** | **RETAINED IN PRODUCTION (Safe Default)** |
| 0.50 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | Acceptable Candidate |
| 0.35 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | Acceptable Candidate |
| 0.10 | 1.0000 | 1.0000 | 1.0000 | 0.0000 | High Recall Candidate (Requires Staging) |

### Calibration Decision & Deployment Policy:
- **Decision:** The production threshold remains locked at **0.65**.
- **Rationale:** VeriProof's highest priority is preventing false accusations of fraud against legitimate certificate holders while cryptographic validation handles 100% authoritative integrity checks.
