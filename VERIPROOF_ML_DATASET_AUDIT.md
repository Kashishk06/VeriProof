# VeriProof ML Subsystems — Comprehensive Dataset Audit & Split Integrity Report

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Audit Date:** 2026-10-10  
**Evaluator:** Senior ML Reliability & Security Audit Team  
**Cryptographic Invariant:** SHA-256 integrity + ECDSA P-256 signatures remain strictly authoritative.

---

## Executive Summary

A complete, systematic dataset audit was conducted across all internal synthetic datasets, deterministic cryptographic test suites, and public benchmarks. The goal of this audit is to identify potential training/validation/test data leakage, group/cluster overlaps, synthetic artifact signatures, class imbalance, and template confounding.

---

## 1. Dataset Inventory and Distribution

| Dataset Manifest / Split File | Task / Domain | Total Records | Train Split | Val Split | Test Split | Primary Group Column | Split Isolation Status |
|---|---|---|---|---|---|---|---|
| `synthetic_image_forensics_splits.csv` | Document Image Forensics | 120 | 84 (70%) | 18 (15%) | 18 (15%) | `source_group_id` | **PASSED (Zero Group Leakage)** |
| `synthetic_ocr_splits.csv` | OCR Field Consistency | 1,200 | 140 (Train subset) | 30 (Val) | 1,030 (Bench) | `source_group_id` | **PASSED (Zero Group Leakage)** |
| `synthetic_anomaly_splits.csv` | Behavioral Anomaly Detection | 1,000 | 309 (Train subset) | 75 (Val) | 616 (Bench) | `entity_id` | **PASSED (Zero Entity Leakage)** |
| `synthetic_crypto_splits.csv` | Deterministic Crypto Checks | 100 | - | - | 100 (Test Vectors) | N/A | **PASSED (Deterministic Suite)** |
| `casia2_splits.csv` | Splice / Copy-Move Benchmark | 12,617 | 9,877 | 1,892 | 845 | `cluster_group_id` | **PASSED (Disjoint Clusters)** |
| `funsd_splits.csv` | Scanned Form Understanding | 199 | 119 | 30 | 50 | N/A (Official) | **PASSED (Official Split)** |
| `idspace_splits.csv` | Scanned Identity Documents | 30 | 18 | 6 | 6 | `template_group_id` | **LEAKAGE_DETECTED (Template Overlap)** |

---

## 2. Key Findings & Data Leakage Analysis

### A. Synthetic Image Forensics (`synthetic_image_forensics_splits.csv`)
- **Group Splitting:** Source documents are grouped into `IMG_GRP_001` through `IMG_GRP_020`. All benign transformations (resampling, blur, JPEG compression) and tampering variants (splice, inpainting) derived from the same source document strictly reside in the *same* split.
- **Held-Out Test Groups:** Test partition consists strictly of `IMG_GRP_018`, `IMG_GRP_019`, and `IMG_GRP_020` (18 images total).
- **Leakage Finding:** Zero group leakage. However, because images are synthetically generated without real-world camera sensor PRNU noise or paper grain texture, linear separability is artificially high. Physical camera/scanner tests remain explicitly marked as **Pending Physical Laboratory Calibration**.

### B. OCR Field Consistency (`synthetic_ocr_splits.csv`)
- **Group Splitting:** Disjoint `GRP_001` through `GRP_030` identifiers.
- **Class Balance:** 1,095 Consistent Cases (91.25%) vs 105 Tampered Cases (8.75%).
- **Error Breakdown:** Missed tampering cases (false negatives) are dominated by single-digit numerical substitutions (e.g. `8` vs `3`, `0` vs `O`) with high OCR confidence.

### C. Behavioral Telemetry Anomaly Detection (`synthetic_anomaly_splits.csv`)
- **Entity Grouping:** Grouped by `VERIFIER_ORG_001` through `VERIFIER_ORG_050`.
- **Temporal Sequence:** Chronological evaluation confirms time-series stability without future lookahead bias in rolling velocity computations (`verification_requests_last_hour`, `burst_request_rate_per_sec`).

### D. IDSpace Identity Cards Benchmark (`idspace_splits.csv`)
- **Audit Flag:** `LEAKAGE_DETECTED` across `template_group_id`. Identity card templates from the same issuer/state appear across train and test partitions.
- **Mitigation Recommendation:** Re-partition IDSpace splits strictly by issuing authority/jurisdiction before retraining any secondary identity document models.

---

## 3. Mandatory Security Invariant Statement

Under all operational conditions:
- **ML scores are strictly supporting diagnostic signals.**
- **SHA-256 document hash integrity, ECDSA P-256 signature verification, and database revocation state remain authoritative.**
- Model failures or missing datasets never allow an unauthenticated or invalid document to verify.
