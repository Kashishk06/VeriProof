# COMPLETE DATASET AUDIT AND READINESS ASSESSMENT
**VeriProof Secure Digital Document Verification Platform**  
**Audit Timestamp:** 2026-10-09 22:47:47 IST  
**Scope:** Exhaustive physical disk audit, integrity validation, semantic boundary check, license review, and leakage assessment across all acquired, synthetic, and database-derived assets.  
**Auditor:** VeriProof Independent Dataset Auditing Agent

---

## 1. Executive Summary & Readiness Classification

This audit establishes the baseline evidence and readiness status for every dataset component currently residing within the VeriProof repository (`datasets/`). The audit was conducted strictly in a read-only inspection mode: no model training was performed, no application or database records were modified, no synthetic records were fabricated, and no external datasets were downloaded.

Every dataset has been assigned **exactly one** overall readiness status based on technical validity, licensing constraints, privacy guarantees, and alignment with VeriProof verification workflows.

### Consolidated Dataset Status Summary

| Dataset Source | Category / Scope | Physical Files | Image Count | Mask / Ann Count | Row Count | Storage | Overall Status | Primary Experimental Role |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **CASIA 2.0** | Public Photographic Tampering | 17,761 | 12,617 | 5,123 masks | 12,617 | 5,914.52 MB | `RESTRICTED` | Low-level photographic splicing & copy-move localization (ELA / Noise) |
| **IDSpace (ALB)** | Synthetic European ID Scans | 43 | 30 | 0 masks | 30 | 17.46 MB | `READY_FOR_EXPERIMENTS` | Initial synthetic ID layout & inpainting / replacement verification |
| **FUNSD** | Form Understanding & OCR Linking | 1,237 | 199 | 199 JSONs | 41,427 | 72.30 MB | `REVIEW_REQUIRED` | Scanned form OCR transcription & spatial entity linking (ICDARW benchmark) |
| **Synthetic Suite** | Indian Academic Credentials | 191 | 120 | 60 masks | 4,420 | 6.64 MB | `READY_FOR_EXPERIMENTS` | Multi-modal forensic features, OCR consistency, anomaly detection, ECDSA crypto |
| **Neon-Derived** | Cloud Database Schema & Logs | 5 | 0 | 0 | 99 | 0.02 MB | `RESTRICTED` | Database schema validation, issuer lifecycle tracking, platform event monitoring |
| **Total Platform** | **Consolidated Multi-Modal Base** | **19,237** | **12,966** | **5,382** | **58,593** | **6,010.94 MB** | — | — |

### Definition of Readiness Statuses

1. **`READY_FOR_EXPERIMENTS`**: The dataset files are verified on disk, formats and schemas parse cleanly, licenses explicitly permit research and algorithmic development without non-commercial restrictions, semantic labels are well-formed, and train/eval splits can be isolated safely.
2. **`RESTRICTED`**: The dataset is technically complete and validated, but operational, legal, or privacy restrictions constrain its use (e.g., CASIA 2.0 is legally restricted to non-commercial academic research; Neon-derived data is restricted to read-only enterprise monitoring).
3. **`REVIEW_REQUIRED`**: The dataset is technically functional, but intellectual property or commercial terms governing third-party source documents require legal counsel before downstream deployment or commercial training (e.g., FUNSD Tobacco-800 underlying source scans).
4. **`NOT_READY`**: The dataset directory is missing, corrupt, lacks required ground truth, or exhibits fatal schema errors. (None of the 5 datasets currently fall under `NOT_READY`).

---

## 2. Source-by-Source Physical & Integrity Audit

### 2.1 CASIA 2.0 (Public Photographic Manipulation Dataset)
- **Directory:** `datasets/public/CASIA2/`
- **Source Archive:** `datasets/public/CASIA2/raw/CASIA2.0_revised_corrected.zip` (5,966,743,365 bytes, SHA-256: `d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5`)
- **Extraction Structure:**
  - `Au/` (Authentic Images): 7,491 images (`.jpg`, `.tif`, `.bmp`)
  - `Tp/` (Tampered Images): 5,123 images (`.jpg`, `.tif`)
  - `CASIA 2 Groundtruth/` (Tampering Masks): 5,123 binary masks (`.png`, `.tif`)
  - `samples/`: 3 documentation sample images
  - `csv/casia_image_inventory.csv`: 12,617 rows
- **Physical Verification Results:**
  - Image Readability: **12,617 of 12,617 readable (100%)**
  - Mask Availability: **5,123 of 5,123 tampered images map to exact ground-truth masks (100%)**
  - Dimension Alignment: **5,123 of 5,123 masks match image pixel dimensions exactly (100%)**
  - Unmapped / Broken Paths: **0**
- **Semantic Boundaries & Provenance:**
  - Original creation by CASIA NLPR (Dong et al., 2013). Algorithmic ground-truth mask generation by Pham et al. (2019) with dimension/inversion corrections by SunnyHaze (2024).
  - *Strict Boundary:* CASIA images are natural photographic scenes (animals, landscapes, architecture). They contain **zero** academic certificates, transcripts, identity cards, or text documents. Tampering labels (`Au` vs `Tp`) represent pixel splicing and copy-move operations, **not** credential forgery.

### 2.2 IDSpace (Synthetic European Identity Documents)
- **Directory:** `datasets/public/IDSpace/`
- **Source Artifact:** `datasets/public/IDSpace/raw/ALB_scan_preview.parquet` (8,081,245 bytes)
- **Extraction Structure:**
  - `images/scan/ALB/`: 30 high-resolution JPEG images (2480 × 3507 pixels)
  - `csv/idspace_image_inventory.csv`: 30 rows
  - `metadata/`: Shard catalogue and Parquet metadata
- **Physical Verification Results:**
  - Image Readability: **30 of 30 readable (100%)**
  - Classes: 10 `positive` (genuine synthetic scan), 10 `fraud_inpaint_and_rewrite` (text erasure & modification), 10 `fraud_crop_and_replace` (portrait substitution)
  - Missing or Corrupted Images: **0**
- **Semantic Boundaries & Provenance:**
  - Released by CactusLab on Hugging Face (`cactuslab/IDSpace`) under CC-BY-4.0.
  - *Strict Boundary:* The local subset represents a 30-image preview of Albanian scanned identity cards. It provides document-level and field-level forgery patterns, but is **not** an Indian academic certificate dataset. It is strictly suitable for preliminary document tampering feature testing, not production classifier training.

### 2.3 FUNSD (Form Understanding in Noisy Scanned Documents)
- **Directory:** `datasets/public/FUNSD/`
- **Source Archive:** `datasets/public/FUNSD/raw/dataset.zip` (17,624,310 bytes)
- **Extraction Structure:**
  - `training_data/images/` & `annotations/`: 149 TIFF images and 149 JSON annotations
  - `testing_data/images/` & `annotations/`: 50 TIFF images and 50 JSON annotations
  - `csv/`: `funsd_entities.csv` (9,743 rows), `funsd_words.csv` (31,485 rows), `funsd_image_inventory.csv` (199 rows)
- **Physical Verification Results:**
  - Total Files: 1,237 | Images: 199 | Annotations: 199
  - Coordinate Validity: **31,485 of 31,485 word bounding boxes lie within image dimensions (100%)**
  - Entity Labels: `header`, `question`, `answer`, `other` (9,743 entities linked in directed graph)
  - Broken References / Missing JSONs: **0**
- **Semantic Boundaries & Provenance:**
  - Released by Guillaume Jaume et al. (ICDARW 2019), sampled from Tobacco-800 scanned business forms.
  - *Strict Boundary:* FUNSD is exclusively an OCR transcription and spatial layout analysis benchmark. It contains **zero** tampering, forgery, or fraud labels. The label `other` indicates miscellaneous text fields, **never** fraud.

### 2.4 VeriProof Synthetic Credential Suite
- **Directory:** `datasets/synthetic/`
- **Reproducibility Seeds:** Base Seed `42071`, Evaluation Seed `98123`
- **Structure:**
  - `images/`: 120 PNG certificate renderings (1200 × 850 pixels, 300 DPI layout)
    - 60 Authentic (30 degrees, 30 transcripts)
    - 60 Tampered (30 text modifications, 30 seal/signature splices)
  - `masks/`: 60 pixel-aligned binary PNG masks (white = tampered region, black = authentic)
  - `csv/synthetic_master_manifest.csv`: 220 records (120 images + 100 crypto test assertions)
  - `csv/synthetic_ocr_tokens.csv`: 2,400 token-level bounding boxes and transcriptions
  - `csv/synthetic_anomaly_records.csv`: 1,200 behavioral submission records
  - `csv/synthetic_crypto_assertions.csv`: 100 ECDSA P-256 digital signature verification records
  - `csv/synthetic_image_inventory.csv`: 120 image metadata rows
  - `csv/synthetic_group_splits.csv`: 220 group-stratified rows (170 train groups, 50 test groups)
- **Physical Verification Results:**
  - Image Readability: **120 of 120 readable (100%)**
  - Mask Alignment: **60 of 60 masks match image dimensions (1200 × 850) with active white pixels (100%)**
  - Cryptographic Verification: **100 of 100 ECDSA P-256 test assertions execute cleanly (100%)**
  - PII or Real Data: **0 real names, 0 real institutions (100% fictional)**

### 2.5 Neon-Derived Datasets
- **Directory:** `datasets/neon_derived/`
- **Extraction Protocol:** Read-only session constraint (`SET TRANSACTION READ ONLY;`)
- **Structure:**
  - `neon_schema_inventory.csv`: 93 column definitions across 10 tables
  - `issuer_status_cases.csv`: 1 record (pseudonymized active issuer)
  - `verification_history_aggregates.csv`: 5 records (hourly activity buckets)
  - `csv/neon_derived_manifest.csv`: Manifest tracking exported assets
- **Physical Verification Results:**
  - Table Coverage: Schema verified for `organizations`, `users`, `registered_documents`, `verification_requests`, `forensic_analyses`, `audit_logs`
  - Unpopulated Tables: `registered_documents` has 0 rows; `forensic_analyses` has 0 rows. Correctly recorded as `NOT_EXPORTED` with zero synthetic fabrication.
  - Secret Exposure: **0 passwords, 0 hashes, 0 JWTs, 0 database credentials exported (100% sanitized)**

---

## 3. License, Provenance, and Governance Review

| Dataset | Declared License | Source Evidence | Redistribution | Commercial Use | Derived Data Rights | Governance Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CASIA 2.0** | CASIA Non-Commercial License | Dong et al. (2013), CASIA NLPR | Restricted to academic research | **PROHIBITED** | Masks permitted for academic benchmarking only | Fence inside experimental sandbox. Exclude from commercial cloud deployment. |
| **IDSpace** | Creative Commons Attribution 4.0 (CC-BY-4.0) | CactusLab HF Repository (`cactuslab/IDSpace`) | Permitted with attribution | Permitted with attribution | Permitted under CC-BY-4.0 | Fully compliant for experimental pipelines. Include CactusLab citation. |
| **FUNSD** | Research Evaluation / Tobacco-800 Terms | Guillaume Jaume et al. (ICDARW 2019) | Academic evaluation permitted | **REVIEW REQUIRED** (Legacy tobacco litigation archive) | Annotations open for research | Restrict to OCR evaluation benchmark. Seek legal sign-off before packaging model weights into commercial distribution. |
| **Synthetic Suite** | VeriProof Internal (MIT / Apache 2.0 compatible) | Procedural script generation (`SEED=42071`) | Full internal ownership | Fully permitted | Fully owned by VeriProof | Freely usable across training, testing, benchmarking, and production. |
| **Neon-Derived** | Proprietary Enterprise / DPDP & GDPR Safe | Live Cloud PostgreSQL read-only extraction | Internal only | Internal platform operations only | Platform telemetry aggregates | Maintain strict field-level redaction; never export raw tenant documents. |

---

## 4. Cross-Dataset Compatibility Matrix

Different datasets address completely different layers of the document verification stack. Merging these datasets into a single binary "fraud" classification model would cause catastrophic feature collapse.

```
                      +-------------------------------------------------+
                      |     VeriProof Multi-Modal Verification Stack     |
                      +-------------------------------------------------+
                                               |
         +-------------------------------------+-------------------------------------+
         |                                     |                                     |
+------------------+                 +--------------------+                 +------------------+
|  OCR & Layout    |                 |   Image Forensics  |                 | Cryptographic &  |
|  Analysis Layer  |                 | Manipulation Layer |                 | Anomaly Layer    |
+------------------+                 +--------------------+                 +------------------+
  - FUNSD (Forms)                      - CASIA 2.0 (Photos)                   - Synthetic Crypto
  - Synthetic (Certs)                  - IDSpace (ID Scans)                   - Synthetic Anomaly
                                       - Synthetic (Certs)                    - Neon Aggregates
```

### Detailed Capability Mapping

| Pipeline Subsystem | CASIA 2.0 | IDSpace (ALB) | FUNSD | Synthetic Collection | Neon-Derived Data |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **OCR & Layout Analysis** | `INCOMPATIBLE` | `CONDITIONALLY_COMPATIBLE` | `COMPATIBLE` | `COMPATIBLE` | `INCOMPATIBLE` |
| **Image Manipulation Detection** | `COMPATIBLE` | `COMPATIBLE` | `INCOMPATIBLE` | `COMPATIBLE` | `INCOMPATIBLE` |
| **Behavioral Anomaly Detection** | `INCOMPATIBLE` | `INCOMPATIBLE` | `INCOMPATIBLE` | `COMPATIBLE` | `CONDITIONALLY_COMPATIBLE` |
| **Cryptographic Verification** | `INCOMPATIBLE` | `INCOMPATIBLE` | `INCOMPATIBLE` | `COMPATIBLE` | `CONDITIONALLY_COMPATIBLE` |
| **Registry & Audit Analytics** | `INCOMPATIBLE` | `INCOMPATIBLE` | `INCOMPATIBLE` | `INCOMPATIBLE` | `COMPATIBLE` |

### Explicit Compatibility Rationale & Prohibited Operations:
1. **CASIA 2.0**: Strictly for pixel-level tampering (splicing, copy-move, ELA, noise inconsistency). **PROHIBITED:** Never pass CASIA images to OCR engines or treat natural scene tampering as certificate fraud.
2. **IDSpace**: Strictly for document-level scanning artifacts and inpainting detection. **PROHIBITED:** Never treat 30 samples as sufficient for model sign-off; never assume European ID fields match Indian academic certificates.
3. **FUNSD**: Strictly for document OCR tokenization, spatial bounding box regression, and key-value linking. **PROHIBITED:** Never train tampering detection on FUNSD; never treat FUNSD `other` entities as fraud.
4. **Synthetic Suite**: Multi-modal suite designed expressly for VeriProof Indian academic certificates. **PROHIBITED:** Never claim balanced synthetic distribution (50% authentic / 50% tampered) reflects real-world operational fraud prevalence (<1%).
5. **Neon-Derived Data**: Strictly for relational schema validation and platform telemetry. **PROHIBITED:** Never manufacture synthetic database records to simulate live certificate traffic; wait for live operational issuance.

---

## 5. Leakage and Evaluation Safety Audit

### 5.1 Source-Donor Leakage (CASIA 2.0)
- **Vulnerability:** In CASIA 2.0, tampered images (`Tp/`) are generated by copying regions from authentic images (`Au/`). If an authentic donor image is in the training split while its tampered derivative is in the test split, the model can achieve near-100% test accuracy simply by memorizing background image textures rather than detecting manipulation boundaries.
- **Mitigation Requirement:** Group-based splitting must be enforced using source donor IDs. All images sharing the same root donor prefix (e.g., `Sp_D_CND_A_...` and its corresponding `Au/CND_...`) must be assigned to the same partition.

### 5.2 Template Leakage (IDSpace & Synthetic Datasets)
- **Vulnerability:** When multiple documents are rendered using identical layout templates, convolutional neural networks often overfit to template borders, fonts, and watermarks.
- **Mitigation Requirement:**
  - In IDSpace, documents must be split by template/issue series, not random image sampling.
  - In the VeriProof Synthetic suite, this was proactively enforced during generation: 170 template groups were assigned exclusively to training, and 50 groups were assigned exclusively to evaluation, with **0 group overlap**.

### 5.3 Test Set Contamination (FUNSD)
- **Vulnerability:** FUNSD contains an official standardized benchmark split: 149 training documents and 50 testing documents.
- **Mitigation Requirement:** The 50 testing documents (`testing_data/`) must remain strictly sequestered for final reporting. Zero hyperparameter tuning, prompt engineering, or vocabulary building may touch the testing split.

---

## 6. Privacy, Security, and Codebase Safety Audit

| Security & Privacy Check | Target Scope | Findings | Status |
| :--- | :--- | :--- | :---: |
| **Personal Identifiable Information (PII)** | Synthetic Datasets | All names, institutions, document IDs, and registration numbers are 100% fictional. | **PASSED** |
| **Database Credentials & Secrets** | Neon-Derived Datasets | Database passwords, connection URIs, JWT secrets, and auth tokens are completely absent from export files. | **PASSED** |
| **Tenant Document Privacy** | Neon Database Extraction | Zero confidential user uploads or certificate files were exported. | **PASSED** |
| **Executable Files & Path Traversal** | Public Dataset Archives | All extracted archives contain purely `.jpg`, `.png`, `.tif`, `.json`, `.csv`, or `.parquet` files. Zero `.exe`, `.bat`, or `.sh` files. | **PASSED** |
| **Version Control Exclusions** | `.gitignore` Inspection | Large binary raw archives (`*.zip`, `*.parquet`) and temporary files are excluded from git tracking. | **PASSED** |

---

## 7. Deliverables Generated During Step 5 Audit

1. **`datasets/reports/consolidated_dataset_inventory.csv`**
   - Consolidated 16-attribute inventory covering all 5 dataset categories, absolute physical counts, license statuses, intended uses, and known limitations.
2. **`datasets/reports/DATASET_COMPATIBILITY_MATRIX.csv`**
   - Systematic mapping across the 5 VeriProof algorithmic tasks, providing concrete evidence, rationale, and prohibited operations.
3. **`datasets/reports/complete_dataset_audit.json`**
   - Machine-readable audit payload containing full metadata, integrity metrics, file and record counts, and prioritized action lists.
4. **`datasets/reports/COMPLETE_DATASET_AUDIT_REPORT.md`**
   - This comprehensive, authoritative audit document.

---

## 8. Prioritized Pre-Training Checklist

### Mandatory Pre-Training Actions (Must Fix Before Full Training)
- [ ] **Enforce CASIA 2.0 Donor Grouping:** Prior to splitting CASIA 2.0 into training and validation sets, generate an automated donor-mapping manifest to prevent source-image background leakage.
- [ ] **Fence CASIA 2.0 to Research Subsystems:** Configure model training pipelines so CASIA-trained weights are tagged as `academic_noncommercial` and barred from export into proprietary production containers.
- [ ] **FUNSD Commercial Rights Determination:** Obtain formal legal clearance regarding the downstream use of model weights fine-tuned on Tobacco-800 scans.
- [ ] **Acknowledge 0-Row Registry State:** Do not train tabular fraud classifiers on `neon_derived/` until live issuing organizations generate operational certificate traffic.

### Permitted Limited Experiments (May Safely Proceed Immediately)
- [x] **Synthetic Credential OCR Transcription:** Permitted using `datasets/synthetic/csv/synthetic_ocr_tokens.csv` across the pre-isolated 170 training groups.
- [x] **Synthetic Image Tampering Localization:** Permitted using `datasets/synthetic/images/` and aligned masks `datasets/synthetic/masks/`.
- [x] **Synthetic Behavioral Anomaly Detection:** Permitted using `datasets/synthetic/csv/synthetic_anomaly_records.csv` across normal and fraudulent submission patterns.
- [x] **Cryptographic Verification Pipeline:** Permitted using `datasets/synthetic/csv/synthetic_crypto_assertions.csv` (100 ECDSA P-256 test vectors).
- [x] **IDSpace Inpainting Prototype:** Permitted for small-scale exploratory feature testing on the 30-sample Albanian preview.
- [x] **FUNSD OCR & Entity Linking Benchmark:** Permitted for academic evaluation of LayoutLM / donut architectures on the official 149 train / 50 test splits.
