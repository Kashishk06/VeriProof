# STEP 6A: DATASET SPLITTING AND LEAKAGE VALIDATION REPORT
**VeriProof Secure Digital Document Verification Platform**  
**Execution Timestamp:** 2026-10-09 23:11:30 IST  
**Master Random Seed:** `20261009` (Deterministically Reproducible)  
**Overall Validation Verdict:** `PASSED_WITH_ZERO_LEAKAGE`

---

## 1. Executive Summary & Objective

In accordance with Step 6A requirements, task-specific, leakage-proof dataset splits have been constructed and verified across all public and synthetic dataset collections in the VeriProof repository. 

To eliminate data leakage risks (background memorization, donor leakage, template memorization, and test set contamination), all splits were generated using **connected-component grouping**, **source-document cluster isolation**, and **official benchmark sequestration**.

### Consolidated Split Summary

| Dataset Source | Target Verification Task | Total Records | Train Split | Validation Split | Test Split | Demo / Holdout | Grouping Strategy | Overlap Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| **CASIA 2.0** | Image manipulation detection & localization | 12,617 | 9,877 | 1,892 | 845 | 3 | Connected component donor clusters (6,523 clusters) | **ZERO OVERLAP (0)** |
| **IDSpace (ALB)** | Synthetic ID manipulation & inpainting | 30 | 18 | 6 | 6 | 0 | 3-Class stratified with template tracking | **BALANCED (0)** |
| **FUNSD** | Scanned form OCR & spatial layout parsing | 199 | 119 | 30 | 50 | 0 | Official ICDARW 149-train / 50-test partition | **SEQUESTERED (0)** |
| **Synthetic Forensics** | Certificate tampering & mask localization | 120 | 84 (14 grps) | 18 (3 grps) | 18 (3 grps) | 0 | Source document group ID (`IMG_GRP_xxx`) | **ZERO OVERLAP (0)** |
| **Synthetic OCR** | OCR transcription & cross-field consistency | 1,200 | 140 | 30 | 1,030 | 0 | Source document group ID (`GRP_xxx`) | **ZERO OVERLAP (0)** |
| **Synthetic Anomaly** | Behavioral submission anomaly detection | 1,000 | 350 | 75 | 575 | 0 | Entity organization ID (`VERIFIER_ORG_xxx`) | **ZERO OVERLAP (0)** |
| **Synthetic Crypto** | ECDSA P-256 digital signature validation | 100 | — | — | 100 | 0 | Deterministic unit verification assertions | **TEST ONLY** |
| **Total Artifacts** | **Multi-Modal Verification Base** | **15,266** | **10,588** | **2,051** | **2,624** | **3** | — | **ALL PASSED** |

---

## 2. Source-by-Source Splitting & Leakage Safeguards

### 2.1 CASIA 2.0: Connected-Component Donor Grouping
- **Split Manifest:** [`datasets/splits/casia2_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/casia2_splits.csv)
- **Target Task:** Pixel-level image tampering detection (copy-move, splicing) and localization against ground-truth binary masks.
- **Leakage Safeguard:**
  - In CASIA 2.0, tampered images (`Tp/`) are created by splicing content from authentic images (`Au/`). Standard random splitting causes background leakage: the model memorizes the camera noise or scene texture of the authentic donor and trivially classifies the spliced variant.
  - **Implementation:** We extracted all donor prefixes from all 5,123 tampered images (e.g. `ani00018`, `sec00096` from `Tp_D_CND_M_N_ani00018_sec00096_00138.tif`) and matched them with the 7,491 authentic images.
  - A graph of connected components was constructed using Disjoint Set Union (DSU). Exactly **6,523 independent donor clusters** were formed.
  - Entire clusters were assigned atomically to `train`, `val`, or `test`.
- **Validation Results:**
  - `Train-Val` Donor Overlap: **0**
  - `Train-Test` Donor Overlap: **0**
  - `Val-Test` Donor Overlap: **0**
  - Unresolved Donor Mappings: **0** (100% of tampered images mapped to known donor codes).
- **Class Breakdown:**
  - `train`: 5,477 Authentic, 4,400 Tampered (Total: 9,877)
  - `val`: 1,402 Authentic, 490 Tampered (Total: 1,892)
  - `test`: 612 Authentic, 233 Tampered (Total: 845)
  - `demo_holdout`: 3 Documentation demo images

### 2.2 IDSpace (Albanian Preview): Stratified Template Partitioning
- **Split Manifest:** [`datasets/splits/idspace_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/idspace_splits.csv)
- **Target Task:** Synthetic European ID document inpainting and facial crop-and-replace detection.
- **Leakage Safeguard:**
  - The 30 Albanian scan preview images represent 3 distinct classes: 10 `positive` (genuine synthetic scan), 10 `fraud_inpaint_and_rewrite` (text modification), and 10 `fraud_crop_and_replace` (portrait replacement).
  - Split proportionally 60% / 20% / 20%:
    - `train`: 6 positive, 6 fraud_inpaint, 6 fraud_crop (Total: 18)
    - `val`: 2 positive, 2 fraud_inpaint, 2 fraud_crop (Total: 6)
    - `test`: 2 positive, 2 fraud_inpaint, 2 fraud_crop (Total: 6)
  - Template/source photo metadata (`generated.photos_v3_...`) was parsed and preserved in the manifest to facilitate template-level tracking.

### 2.3 FUNSD: Official Benchmark Sequestration
- **Split Manifest:** [`datasets/splits/funsd_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/funsd_splits.csv)
- **Target Task:** Scanned document OCR transcription, entity classification (`header`, `question`, `answer`, `other`), and directed graph key-value linking.
- **Leakage Safeguard:**
  - The official FUNSD benchmark partition defines 149 training documents and 50 testing documents.
  - To prevent test set contamination, the **50 testing documents are 100% sequestered in the `test` split** (`test_sequestered = True`). No training, tuning, or hyperparameter selection may use these 50 documents.
  - The 149 training documents were partitioned into **119 training documents** and **30 validation documents**.

### 2.4 VeriProof Synthetic Image Forensics: Strict Source-Group Isolation
- **Split Manifest:** [`datasets/splits/synthetic_image_forensics_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_image_forensics_splits.csv)
- **Target Task:** Indian academic certificate image manipulation detection and pixel-level mask localization.
- **Leakage Safeguard:**
  - The 120 certificate images consist of 20 distinct source-document groups (`IMG_GRP_001` through `IMG_GRP_020`). Each group contains 6 variants (genuine pristine, blur distorted, JPEG distorted, copy-move seal, spliced signature, grade text replace).
  - Splitting randomly by image would cause catastrophic template leakage (the model would see the authentic certificate in training and test on its spliced variant).
  - **Implementation:** Groups were partitioned atomically:
    - `train`: 14 groups (84 images: 42 authentic, 42 tampered)
    - `val`: 3 groups (18 images: 9 authentic, 9 tampered)
    - `test`: 3 groups (18 images: 9 authentic, 9 tampered)
- **Validation Results:**
  - Group Overlap between all splits: **EXACTLY ZERO (0)**.

### 2.5 Synthetic OCR & Anomaly Partitions
- **Synthetic OCR Consistency Manifest:** [`datasets/splits/synthetic_ocr_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_ocr_splits.csv)
  - 1,200 records partitioned across the 20 source groups with zero group overlap.
- **Synthetic Anomaly Detection Manifest:** [`datasets/splits/synthetic_anomaly_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_anomaly_splits.csv)
  - 1,000 behavioral records partitioned across 20 verifier entity organizations (`VERIFIER_ORG_001` - `VERIFIER_ORG_020`) with zero entity overlap.
- **Synthetic Cryptographic Test Suite:** [`datasets/splits/synthetic_crypto_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_crypto_splits.csv)
  - 100 deterministic ECDSA P-256 test vectors for verification pipeline unit/integration testing.

---

## 3. Physical File Path and Integrity Validation

Every single file path referenced across all 7 split manifests was physically verified against actual disk storage:

- **Total Referenced Files Verified on Disk:** **12,966**
  - CASIA 2.0 Images: 12,617 (Au: 7,491, Tp: 5,123, Demo: 3)
  - IDSpace Images: 30
  - FUNSD Images: 199
  - Synthetic Certificate Images: 120
- **Missing or Broken File Paths:** **0 (100% Verified)**
- **Duplicate IDs Detected:** **0**

---

## 4. Master Split Manifest Directory

All versioned split CSVs are located under `datasets/splits/`:

1. [`master_split_manifest.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/master_split_manifest.csv) — Global split directory index.
2. [`casia2_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/casia2_splits.csv) — CASIA 2.0 donor-grouped split (12,617 records).
3. [`idspace_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/idspace_splits.csv) — IDSpace 3-class stratified split (30 records).
4. [`funsd_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/funsd_splits.csv) — FUNSD OCR benchmark split (199 records).
5. [`synthetic_image_forensics_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_image_forensics_splits.csv) — Synthetic certificate forensics split (120 records).
6. [`synthetic_ocr_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_ocr_splits.csv) — Synthetic OCR consistency split (1,200 records).
7. [`synthetic_anomaly_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_anomaly_splits.csv) — Synthetic behavioral anomaly split (1,000 records).
8. [`synthetic_crypto_splits.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/splits/synthetic_crypto_splits.csv) — Synthetic cryptographic assertion suite (100 records).

---

## 5. Prioritized Experimental Readiness

All generated split manifests are **production-ready and leak-proof** for downstream model experimentation:

- [x] **Image Tampering Localization:** Ready to train ELA / Noise / ResNet models using `datasets/splits/casia2_splits.csv` and `datasets/splits/synthetic_image_forensics_splits.csv`.
- [x] **Document OCR & Layout Understanding:** Ready to benchmark LayoutLM / TrOCR models using `datasets/splits/funsd_splits.csv` and `datasets/splits/synthetic_ocr_splits.csv`.
- [x] **Behavioral Anomaly Detection:** Ready to train Isolation Forest / Autoencoder anomaly detectors using `datasets/splits/synthetic_anomaly_splits.csv`.
- [x] **Cryptographic Engine Testing:** Ready to run test assertions using `datasets/splits/synthetic_crypto_splits.csv`.
