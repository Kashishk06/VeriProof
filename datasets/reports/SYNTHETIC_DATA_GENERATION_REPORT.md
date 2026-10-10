# VeriProof — Synthetic Dataset Generation & Validation Report

**Phase:** Step 4A — Master Synthetic Dataset Generation  
**Execution Date:** 2026-10-09  
**Auditor / Generator:** Antigravity AI  
**Master Random Seed:** `42071`  
**Independent Evaluation Seed:** `98123`  
**Overall Validation Status:** ✅ **ALL_CHECKS_PASSED**  
**Report File:** `datasets/reports/SYNTHETIC_DATA_GENERATION_REPORT.md`  
**Validation Results JSON:** `datasets/reports/synthetic_validation_results.json`  

---

## 1. Executive Summary & Inventory Overview

A reproducible, privacy-safe synthetic dataset collection was generated for the VeriProof Secure Digital Document Verification Platform. All files were generated strictly using fictional entities, mathematical cryptographic operations, and procedural image rendering.

| Dataset File / Directory | Artifact Type | Record / File Count | Total Disk Size | Validation Status |
|---|---|---|---|---|
| [`document_forensics_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/document_forensics_features.csv) | Tabular Features | **1,500 records** | 338.4 KB | ✅ PASS |
| [`ocr_field_consistency.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/ocr_field_consistency.csv) | Field Extraction Cases | **1,200 records** | 244.6 KB | ✅ PASS |
| [`image_forensics_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics_features.csv) | Image Manifest | **120 records** | 34.2 KB | ✅ PASS |
| [`image_forensics/images/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics/images/) | Rendered Certificate Images | **120 PNG images** (1000 × 700) | 9.84 MB | ✅ PASS |
| [`image_forensics/masks/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics/masks/) | Binary Ground-Truth Masks | **60 PNG masks** (1000 × 700) | 182.4 KB | ✅ PASS |
| [`anomaly_detection_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/anomaly_detection_features.csv) | Behavioral Log Features | **1,000 records** | 225.8 KB | ✅ PASS |
| [`cryptographic_verification_cases.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/cryptographic_verification_cases.csv) | Deterministic Test Cases | **100 test cases** | 32.5 KB | ✅ PASS |
| [`model_evaluation_cases.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/model_evaluation_cases.csv) | Held-Out Test Evaluation | **500 records** | 108.2 KB | ✅ PASS |
| **Total Collection Footprint** | **6 CSVs + 180 Images/Masks** | **4,420 rows \| 180 files** | **~11.0 MB** | ✅ **ALL PASSED** |

---

## 2. Detailed Dataset Specifications

### 2.1 Dataset A — Document Forensics Features
* **Output Path:** [`datasets/synthetic/document_forensics_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/document_forensics_features.csv)
* **Count:** 1,500 rows across 150 template/institution groups (`GRP_001` to `GRP_150`).
* **Design & Label Distribution:**
  * `authentic`: 825 records (55.0%) — includes pristine documents, benign scanner resampling, and benign multi-generation JPEG recompression.
  * `tampered`: 675 records (45.0%) — copy-move gold seals, spliced signatures, altered GPA marks, and unauthorized QR patches.
* **Key Differentiator:** Benign distortions (scan blur, compression) are explicitly labeled `authentic` with intact consistency, preventing models from conflating low image resolution with intentional fraud.

### 2.2 Dataset B — OCR Field Consistency
* **Output Path:** [`datasets/synthetic/ocr_field_consistency.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/ocr_field_consistency.csv)
* **Count:** 1,200 records evaluating field parsing across student names, roll numbers, CGPA, passing years, and dates.
* **Classifications:**
  * `CONSISTENT` (60.0%): Accurate text extraction matching ground truth.
  * `BENIGN_OCR_NOISE` (20.0%): Character substitutions (`0` vs `O`, `1` vs `I`, `-` vs `/`) where document authenticity is uncompromised.
  * `AMBIGUOUS` (10.0%): Poor scan contrast resulting in inconclusive characters.
  * `INCONSISTENT_SUSPECT_TAMPERING` (10.0%): Semantic cross-field conflicts (e.g. cumulative CGPA conflicting with course grades; passing year postdating issuance date).
* **Core Principle:** Demonstrates that **low OCR confidence or character typos are not automatically fraud**.

### 2.3 Dataset C — Image Forensics Dataset
* **Output Paths:**
  * Images: [`datasets/synthetic/image_forensics/images/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics/images/) (120 PNG files, 1000 × 700 px)
  * Masks: [`datasets/synthetic/image_forensics/masks/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics/masks/) (60 PNG binary masks, 1000 × 700 px)
  * Manifest: [`datasets/synthetic/image_forensics_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/image_forensics_features.csv) (120 rows)
* **Visual Generation:** Rendered with Pillow using procedural borders, institutional titles, recipient names, division banners, signature lines, official seals, and a prominent synthetic watermark.
* **Controlled Transformations (20 samples per class):**
  1. `genuine_pristine`: Clean authentic certificate (mask: None).
  2. `genuine_distorted_blur`: Authentic certificate with Gaussian defocus (mask: None).
  3. `genuine_distorted_jpeg`: Authentic certificate with heavy Q45 compression artifacts (mask: None).
  4. `tampered_copy_move_seal`: Official seal duplicated across coordinates (aligned binary mask).
  5. `tampered_spliced_signature`: Foreign registrar signature patch spliced onto document (aligned binary mask).
  6. `tampered_grade_text_replace`: Division field replaced with fraudulent gold medal claim (aligned binary mask).
* **Measured Properties:** Actual grayscale intensity, Laplacian edge variance, and altered pixel percentages measured directly from the generated files.

### 2.4 Dataset D — Anomaly Detection Features
* **Output Path:** [`datasets/synthetic/anomaly_detection_features.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/anomaly_detection_features.csv)
* **Count:** 1,000 verification session profiles across 40 fictional verifier organizations.
* **Classes:**
  * `NORMAL_VERIFICATION` (75.0%): Standard baseline verifications within operational rate limits.
  * `BENIGN_HIGH_VOLUME` (15.0%): Scheduled bulk verification bursts (e.g. annual hiring background checks) — high frequency without malicious intent.
  * `SUSPICIOUS_BRUTE_FORCE` (5.0%): Rapid failed hash checks with rotating IP geolocations.
  * `ANOMALOUS_ISSUER_STATUS` (5.0%): Requests referencing revoked or compromised signing keys.

### 2.5 Dataset E — Cryptographic Verification Cases
* **Output Path:** [`datasets/synthetic/cryptographic_verification_cases.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/cryptographic_verification_cases.csv)
* **Count:** 100 deterministic software test cases.
* **Execution Realism:** Generated and verified using Python's `cryptography` standard library with real ECDSA SECP256R1 keypairs and SHA-256 digests.
* **Tested Scenarios:** Valid hash and signature, single-byte payload tampering, signature byte corruption, foreign public key mismatch, revoked issuer key, unregistered registry record, expired document validity.
* **Result:** **100 / 100 test assertions passed.**

### 2.6 Dataset F — Independent Model Evaluation Cases
* **Output Path:** [`datasets/synthetic/model_evaluation_cases.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/synthetic/model_evaluation_cases.csv)
* **Count:** 500 held-out evaluation cases.
* **Leakage Safeguard:** Generated with an independent seed (`EVAL_SEED = 98123`) across 50 dedicated evaluation groups (`EVAL_GRP_001` to `EVAL_GRP_050`). Zero overlap with training groups.

---

## 3. Real Validation Audit Results

Executed via `scratch/validate_synthetic_collection.py`:

| Validation Check | Audited Metric | Result | Status |
|---|---|---|---|
| **1. CSV Existence & Counts** | 6 files, 4,420 total expected rows | 6 files present; exact row counts verified | ✅ PASS |
| **2. Image Readability** | 120 generated certificate images | 120 / 120 opened with Pillow without error | ✅ PASS |
| **3. Mask Dimension Alignment** | 60 binary ground-truth masks | 60 / 60 exact 1000 × 700 pixel alignment | ✅ PASS |
| **4. Mask Absence on Genuine** | 60 authentic / distorted images | 0 masks generated for authentic images | ✅ PASS |
| **5. Cryptographic Assertions** | 100 executable test cases | 100 / 100 mathematical assertions passed | ✅ PASS |
| **6. Group Isolation** | Train groups (170) vs Eval groups (50) | **0 overlapping groups (Zero Data Leakage)** | ✅ PASS |
| **7. Privacy & Secrets Scan** | Regex scan for Aadhaar, PAN, private keys | **0 matches / 0 security flags** | ✅ PASS |
| **8. Schema & Null Check** | Column data types and headers | 100% compliant with Data Dictionary | ✅ PASS |

---

## 4. Methodological Limitations & Prohibited Interpretations

1. **Synthetic Fraud Prevalence:** The ratio of authentic to manipulated examples (approx. 55:45 in training features) was chosen for balanced statistical learning. It does **not** reflect real-world document fraud prevalence, which is typically sparse (<1%).
2. **Procedural Rendering Simplification:** While synthetic certificates model realistic borders, fonts, and gold seals, they do not simulate paper fibers, micro-printing, or physical UV watermarks.
3. **Domain Separation:** These synthetic academic certificates are designed to benchmark tampering detection algorithms; they must **never** be presented as real academic credentials or government certifications.
