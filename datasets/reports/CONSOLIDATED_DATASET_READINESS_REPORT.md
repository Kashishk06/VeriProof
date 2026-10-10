# VeriProof — Consolidated Dataset Readiness Audit Report

**Scope:** Consolidated Pre-Training Audit across all Public, Synthetic, and Database-Derived Datasets  
**Audit Date:** 2026-10-09  
**Auditor:** Antigravity AI  
**Target Architecture:** VeriProof Secure Digital Document Verification Platform  
**Report File:** `datasets/reports/CONSOLIDATED_DATASET_READINESS_REPORT.md`  
**Consolidated Inventory CSV:** `datasets/reports/consolidated_dataset_inventory.csv`  
**Machine-Readable JSON:** `datasets/reports/consolidated_dataset_readiness.json`  

---

## 1. Executive Summary & Readiness Classification

Before initiating any AI/ML model training or feature pipeline execution, all dataset directories and reports were audited against actual disk files, schema consistency, legal licensing, and task compatibility.

| Dataset Target | Local Directory Path | Images on Disk | Annotations / Masks | Readiness Classification | License Status | Suitable ML Tasks |
|---|---|---|---|---|---|---|
| **CASIA 2.0** | `datasets/public/CASIA2/` | **12,617** | **5,123 masks** | **READY_FOR_EXPERIMENTS** (Non-commercial) | **RESTRICTED** (Non-commercial research only) | Low-level tampering detection, splicing localization |
| **IDSpace** | `datasets/public/IDSpace/` | **30** (subset) | **30 metadata records** | **READY_FOR_EXPERIMENTS** | **PERMISSIVE** (CC-BY-4.0) | Synthetic identity document forensics, inpaint/crop detection |
| **FUNSD** | `datasets/public/FUNSD/` | **199** | **199 JSON files** | **READY_FOR_EXPERIMENTS** (Research) | **REVIEW_REQUIRED** (Tobacco-800 derived) | Document OCR, form layout analysis, key-value extraction |
| **Synthetic Data** | `datasets/synthetic/` | **0** | **0** | **NOT_READY** | **PERMISSIVE_INTERNAL** (Planned) | Indian academic certificate forgery benchmarks |
| **Neon-Derived Data** | `datasets/neon_derived/` | **0** | **0** | **NOT_READY** | **RESTRICTED** (GDPR/DPDP compliance) | Cryptographic signature audit, ledger consistency |

---

## 2. Granular Per-Dataset Audit Findings

### 2.1 CASIA 2.0 (Image Tampering Evaluation Database v2.0)
* **Directory:** [`datasets/public/CASIA2/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/)
* **Filesystem Reality:**
  * Authentic images (`Au`): **7,491 images** in `images/Au/`
  * Tampered images (`Tp`): **5,123 images** in `images/Tp/`
  * Documentation demo images: **3 images** in `images/images/`
  * Ground-truth binary masks (`Gt`): **5,123 masks** in `groundtruth/`
  * Source archive: `raw/CASIA2.0_revised_corrected.zip` (2,677,393,245 bytes, SHA-256 verified)
  * Manifest: [casia_image_inventory.csv](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/csv/casia_image_inventory.csv) (**12,617 rows**)
* **Integrity Audit:** 0 broken image paths, 0 broken mask paths, 0 duplicate IDs, 0 unreadable files, 100% bijective 1-to-1 Tp ↔ Gt mapping.
* **Label Semantics:**
  * `authentic`: Natural, untampered photographic images.
  * `tampered`: Spliced and copy-move manipulated photographic images.
  * `groundtruth`: Spatial pixel-level binary masks showing manipulated regions.
* **Licensing & Usage Constraints:**
  * **Status: RESTRICTED.** Originates from CASIA NLPR (Dong et al., 2013). Strictly licensed for non-commercial academic research. Commercial deployment requires prior written approval from CASIA NLPR.
* **Forensic Boundary:** Natural scene photography only. Contains zero academic degrees or identity certificates.

---

### 2.2 IDSpace (Synthetic European Identity Document Dataset)
* **Directory:** [`datasets/public/IDSpace/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/IDSpace/)
* **Filesystem Reality:**
  * Extracted preview images: **30 high-resolution JPEG images** (2480 × 3507) in `images/scan/ALB/`
  * Downloaded preview archive: `raw/ALB_scan_preview.parquet` (8,081,245 bytes)
  * Manifest: [idspace_image_inventory.csv](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/IDSpace/csv/idspace_image_inventory.csv) (**30 rows**)
  * Remote catalogue listing: [idspace_file_inventory.csv](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/IDSpace/csv/idspace_file_inventory.csv) (21 Parquet shard index rows)
* **Integrity Audit:** 0 broken paths, 0 unreadable files, 0 duplicate IDs.
* **Label Semantics:**
  * `positive`: Synthetic identity document simulated under flatbed scanner capture (genuine).
  * `fraud_inpaint_and_rewrite`: Synthetic forgery simulating text erasure and replacement.
  * `fraud_crop_and_replace`: Synthetic forgery simulating portrait/photo cropping and replacement.
* **Licensing & Usage Constraints:**
  * **Status: PERMISSIVE (CC-BY-4.0).** Can be used for research and development provided CactusLab is cited.
* **Forensic Boundary:** Synthetically generated European national IDs and passports (contains no real PII). Does not represent Indian university degrees, marksheets, or educational boards. Full ~123 GB archive excluded to protect local disk capacity.

---

### 2.3 FUNSD (Form Understanding in Noisy Scanned Documents)
* **Directory:** [`datasets/public/FUNSD/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/FUNSD/)
* **Filesystem Reality:**
  * Document images: **199 PNG files** (149 training, 50 testing)
  * Annotation files: **199 JSON files** (149 training, 50 testing)
  * Manifests:
    * `csv/funsd_image_inventory.csv`: **199 rows**
    * `csv/funsd_entities.csv`: **9,743 rows**
    * `csv/funsd_words.csv`: **31,485 rows**
* **Integrity Audit:** 0 broken paths, 0 unreadable images, 0 malformed JSONs, all 9,743 bounding boxes strictly within image coordinate boundaries.
* **Label Semantics:**
  * Form layout and semantic structure: `header`, `question`, `answer`, `other`.
  * Spatial bounding boxes and entity-to-entity directed linking graph.
  * **CRITICAL:** Contains **NO fraud or authenticity labels**.
* **Licensing & Usage Constraints:**
  * **Status: REVIEW_REQUIRED.** While distributed openly for academic evaluation (ICDARW 2019), the underlying document scans originate from the public Tobacco-800 collection. Commercial training use must be legally vetted.

---

### 2.4 Synthetic Dataset (`datasets/synthetic/`)
* **Directory Status:** **Does not exist on disk** (`exists=False`).
* **Readiness Classification:** **NOT_READY**.
* **Missing Components:**
  * Indian academic certificate generator (degree certificates, provisional marksheets, diploma certificates).
  * Templated forgery generation pipeline: font mismatch, altered marks/grades, forged university seal/stamp, modified QR codes.
  * Explicit synthetic labeling convention (`genuine_synthetic_cert`, `tampered_grade`, etc.).

---

### 2.5 Neon-Derived Dataset (`datasets/neon_derived/`)
* **Directory Status:** **Does not exist on disk** (`exists=False`).
* **Readiness Classification:** **NOT_READY**.
* **Missing Components:**
  * Read-only authorized database export pipeline.
  * Schema-minimized tabular features: certificate hash, issuer DID, issuance timestamp, revocation status.
  * Privacy filtering: Complete redaction of student PII (names, phone numbers, addresses) in accordance with DPDP and GDPR.

---

## 3. Task Compatibility & Prohibition of Incompatible Label Merging

A fundamental risk in multi-modal verification platforms is attempting to merge disparate labels into a monolithic "document fraud" target.

> ⚠️ **ARCHITECTURAL WARNING — PROHIBITION OF LABEL MERGING:**  
> It is strictly invalid to combine `tampered` (CASIA photographic splicing), `fraud_crop_and_replace` (IDSpace portrait substitution), and `other` (FUNSD administrative form noise) into a single classification head.  
> Each dataset serves a distinct, orthogonal subsystem in VeriProof:

```
                                  VERIPROOF PIPELINE
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [OCR & Layout]                 [Pixel Tamper Forensics]            [Crypto Ledger]
      (FUNSD)                         (CASIA2 & IDSpace)              (Neon-Derived)
         │                                 │                                 │
   • Text transcription              • Noise inconsistency             • Merkle proof check
   • Form key-value pairs            • Splicing localization           • Issuer signature
   • Font geometry check             • Error Level Analysis (ELA)      • Revocation check
```

---

## 4. Train / Validation / Test Data Leakage Assessment

To guarantee scientific and forensic integrity, training pipelines must strictly prevent data leakage across splits:

### 1. Source Donor Leakage (CASIA 2.0 Risk)
* **Risk:** In CASIA 2.0, tampered images (`Tp`) are constructed by splicing objects from authentic donor images (`Au`). If an authentic donor image is placed in the training split while its tampered spliced variant is placed in the validation or test split, the model will memorize donor features rather than learning general forgery boundaries.
* **Enforced Mitigation:** A grouping index must bind donor-derivative pairs into the **exact same split**.

### 2. Layout & Template Leakage (IDSpace & Synthetic Risk)
* **Risk:** Documents sharing identical layout templates (e.g. all Albanian flatbed scans) exhibit identical visual backdrops. Distributing the same template across train and test evaluates background recognition rather than forgery localization.
* **Enforced Mitigation:** Group documents by underlying template ID/country; ensure test splits evaluate held-out templates.

### 3. Test Contamination (FUNSD Risk)
* **Risk:** The 50 official testing documents in `datasets/public/FUNSD/images/testing_data/` represent an established academic benchmark.
* **Enforced Mitigation:** These 50 documents must remain strictly sequestered for final unbiased evaluation; zero hyperparameter tuning or feature pre-training is permitted on them.

---

## 5. Storage Footprint Summary

| Dataset Directory | File Count | Storage Footprint | Git Status |
|---|---|---|---|
| `datasets/public/CASIA2/` | 17,740 files | 5.78 GB (includes 2.49 GB archive) | Excluded via `.gitignore` |
| `datasets/public/IDSpace/` | 34 files | 17.46 MB (includes 7.71 MB parquet) | Excluded via `.gitignore` |
| `datasets/public/FUNSD/` | 401 files | 72.30 MB | Excluded via `.gitignore` |
| `datasets/reports/` | 11 reports & manifests | 11.8 MB | Tracked in Git |
| **Total Datasets Storage** | **18,186 files** | **~5.88 GB** | **~57.3 GB free disk space** |

---

## 6. Prioritized Action Plan Before Training

1. **Priority 1 (Dataset Splitting & Leakage Prevention):**  
   Implement a Python grouping script to generate `casia_train_val_test_splits.csv` and `idspace_splits.csv`, guaranteeing zero donor or template leakage.
2. **Priority 2 (Synthetic Academic Certificate Generation):**  
   Establish `datasets/synthetic/` with an Indian educational certificate generator (degree marks cards, roll numbers, holographic seals) containing ground-truth tampering labels.
3. **Priority 3 (Privacy-Preserving Neon Export):**  
   Design an authorized read-only export pipeline to create `datasets/neon_derived/` with cryptographic hash records and zero plain-text PII.
4. **Priority 4 (FUNSD Commercial License Review):**  
   Complete legal assessment of Tobacco-800 commercial usage terms prior to packaging FUNSD layout models for production.
