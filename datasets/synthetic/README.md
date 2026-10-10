# VeriProof — Master Synthetic Dataset Collection

> **MANDATORY PRIVACY & SAFETY NOTICE:**  
> All records, documents, certificates, names, institutions, registration numbers, and dates in this directory are **100% synthetically generated and fictional**. No real people's personal identities, government ID numbers, or actual educational certificates were used. These datasets are generated strictly for algorithmic development, pipeline testing, and reproducible ML experimentation within the VeriProof Platform.

---

## 1. Directory Structure

```
datasets/synthetic/
├── document_forensics_features.csv        (1,500 rows — document-level tabular features)
├── ocr_field_consistency.csv              (1,200 rows — OCR extraction & field consistency cases)
├── image_forensics_features.csv           (120 rows — image manifest with measured metrics)
├── image_forensics/
│   ├── images/                            (120 PNG images — synthetic academic certificates)
│   └── masks/                             (60 PNG binary masks — pixel-aligned ground truth)
├── anomaly_detection_features.csv         (1,000 rows — verification request behavioral profiles)
├── cryptographic_verification_cases.csv   (100 rows — deterministic executable crypto test cases)
├── model_evaluation_cases.csv             (500 rows — strictly held-out test evaluation set)
├── README.md                              (This overview and governance document)
└── DATA_DICTIONARY.md                     (Granular schema and field definitions)
```

---

## 2. Dataset Collection Overviews

### A. Document Forensics Features (`document_forensics_features.csv`)
* **Scope:** 1,500 records across 150 template/institution groups (`GRP_001` to `GRP_150`).
* **Content:** Document-level features including Error Level Analysis (ELA) mean and max differences, Laplacian blur variance, SNR noise estimates, JPEG quality factors, and resampling indicators.
* **Labels:** `authentic` (55%) vs `tampered` (45%). Includes benign distortions (scanning, recompression) explicitly labeled `authentic` to prevent models from confusing quality degradation with forgery.

### B. OCR Field Consistency (`ocr_field_consistency.csv`)
* **Scope:** 1,200 field extraction cases covering names, roll numbers, GPA scores, passing years, and issuance dates.
* **Core Rule:** **OCR errors are not automatically fraud!**
* **Classes:**
  * `CONSISTENT`: High-confidence OCR matching ground truth.
  * `BENIGN_OCR_NOISE`: Character substitutions (e.g. `0` vs `O`, `1` vs `I`) or delimiter variances on authentic documents.
  * `AMBIGUOUS`: Poor-contrast or degraded scans resulting in inconclusive readings.
  * `INCONSISTENT_SUSPECT_TAMPERING`: Semantic cross-field conflicts (e.g., GPA mismatch, batch year conflicting with degree date).

### C. Image Forensics Dataset (`image_forensics/`)
* **Scope:** 120 generated certificate images (1000 × 700 PNG) and 60 pixel-aligned ground-truth masks.
* **Transformations:**
  * `genuine_pristine` (20 images, mask: None)
  * `genuine_distorted_blur` (20 images, mask: None)
  * `genuine_distorted_jpeg` (20 images, mask: None)
  * `tampered_copy_move_seal` (20 images, 20 aligned binary masks)
  * `tampered_spliced_signature` (20 images, 20 aligned binary masks)
  * `tampered_grade_text_replace` (20 images, 20 aligned binary masks)
* **Measured Features:** Actual image intensity, Laplacian edge variance, and tamper area percentages calculated from generated image files.

### D. Anomaly Detection Features (`anomaly_detection_features.csv`)
* **Scope:** 1,000 verification event profiles across 40 fictional verifier organizations.
* **Classes:**
  * `NORMAL_VERIFICATION`: Baseline single-document queries.
  * `BENIGN_HIGH_VOLUME`: Scheduled bulk graduation audits (high volume != fraud).
  * `SUSPICIOUS_BRUTE_FORCE`: Rapid failed hash queries with rotating geolocations.
  * `ANOMALOUS_ISSUER_STATUS`: Requests citing revoked or compromised keys.

### E. Cryptographic Verification Cases (`cryptographic_verification_cases.csv`)
* **Scope:** 100 executable test cases using Python's `cryptography` standard library.
* **Coverage:** Valid ECDSA P-256 signatures, single-byte payload alterations, signature corruption, foreign public keys, revoked issuers, and expired certificates.
* **Result:** 100% verified against real mathematical operations.

### F. Independent Model Evaluation Cases (`model_evaluation_cases.csv`)
* **Scope:** 500 held-out evaluation cases generated under a separate fixed seed (`EVAL_SEED = 98123`).
* **Zero Leakage:** Strictly disjoint institution/template groups (`EVAL_GRP_001` to `EVAL_GRP_050`). No overlap with training sets.

---

## 3. Provenance & Reproducibility

* **Master Training Seed:** `42071`
* **Independent Evaluation Seed:** `98123`
* **Provenance Tags:**
  * `VeriProof_Synthetic_v1_Seed_42071`
  * `VeriProof_Synthetic_v1_EvalSeed_98123`
* **Generator Script:** `C:\Users\hp\.gemini\antigravity-ide\brain\75a9dfe7-d737-4f3c-a966-8230f9765de3\scratch\generate_master_synthetic_datasets.py`
