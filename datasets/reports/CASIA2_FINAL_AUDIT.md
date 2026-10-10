# CASIA 2.0 Final Independent Audit Report

**Dataset:** CASIA Image Tampering Detection Evaluation Database v2.0  
**Audit Date:** 2026-10-09  
**Auditor:** Antigravity AI (Independent Verification Protocol)  
**Overall Audit Status:** ✅ **FULLY VALIDATED (PASS)**  
**Machine-Readable Audit JSON:** `datasets/reports/casia2_final_audit.json`  

---

## 1. Executive Summary Table

| Audit Check | Requirement | Result | Status |
|---|---|---|---|
| **1. Archive SHA-256** | Equals `d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5` | `d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5` | ✅ PASS |
| **2. Actual Images Recount** | 7,491 Au images, 5,123 Tp images, 5,123 Gt masks | **7,491 Au**, **5,123 Tp**, **5,123 Gt** (excluding 3 demo images) | ✅ PASS |
| **3. Inventory CSV Integrity** | 12,617 rows, unique IDs, valid paths, correct labels | **12,617 rows**, **12,617 unique IDs**, **0 broken paths**, **0 label mismatches** | ✅ PASS |
| **4. Mask Bijective Mapping** | 100% 1-to-1 mapping, exact dimensions, no missing/orphans | **5,123 / 5,123 mapped**, **0 dimension mismatches**, **0 missing**, **0 orphaned** | ✅ PASS |
| **5. Baseline Artifacts** | `casia2_gt_repo.zip` & 3 example images preserved | `casia2_gt_repo.zip` (483,937 B) and all 3 demo images intact | ✅ PASS |
| **6. Attribution & Provenance** | Citations, non-commercial license, forensic disclaimer | All verified in metadata and reports | ✅ PASS |
| **Failures Detected** | Zero audit failures | **0 failures** | ✅ PASS |

---

## 2. Check 1 — Archive File & SHA-256 Cryptographic Audit

* **Archive Location:** [`datasets/public/CASIA2/raw/CASIA2.0_revised_corrected.zip`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/raw/)
* **Archive Size:** 2,677,393,245 bytes (2,553.36 MB / ~2.49 GB)
* **Calculated SHA-256:**
  ```text
  d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5
  ```
* **Expected SHA-256:**
  ```text
  d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5
  ```
* **Result:** **MATCH**. Cryptographic checksum verified bit-for-bit against the source archive.

---

## 3. Check 2 — Disk File Recount

Independent filesystem scan using absolute path iteration (excluding demo images):

* **Authentic (`Au`) Images on Disk:** **7,491** files in [`datasets/public/CASIA2/images/Au/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/images/Au/)
  * All non-zero size (range: 12.3 KB to 1.84 MB per image).
* **Tampered (`Tp`) Images on Disk:** **5,123** files in [`datasets/public/CASIA2/images/Tp/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/images/Tp/)
  * All non-zero size (range: 18.2 KB to 3.82 MB per image).
* **Ground-Truth Masks (`Gt`) on Disk:** **5,123** files in [`datasets/public/CASIA2/groundtruth/`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/groundtruth/)
  * All non-zero size PNG binary masks.
* **Baseline Demonstration Images:** **3** files in `datasets/public/CASIA2/images/images/` (isolated from full-dataset split counts).

---

## 4. Check 3 — CSV Inventory Parsing & Validation

Parsed [`datasets/public/CASIA2/csv/casia_image_inventory.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/csv/casia_image_inventory.csv):

* **Total Data Rows:** **12,617**
* **Unique Image IDs:** **12,617** (0 duplicate IDs detected)
* **Row Breakdown:**
  * Baseline Documentation Samples: 3 rows (`casia2_src_00001` to `00003`)
  * Authentic Images: 7,491 rows (`casia2_au_00001` to `casia2_au_07491`)
  * Tampered Images: 5,123 rows (`casia2_tp_00001` to `casia2_tp_05123`)
* **Path Validation:**
  * Image Path Check: **12,617 / 12,617 exist on disk** (0 broken paths)
  * Mask Path Check: **5,123 / 5,123 exist on disk** (0 broken paths)
* **Label Integrity:**
  * All `Au` rows have `label: "authentic"`, `groundtruth_available: False`, `pair_mapping_status: "not_applicable"`.
  * All `Tp` rows have `label: "tampered"`, `groundtruth_available: True`, `pair_mapping_status: "matched"`.

---

## 5. Check 4 — Independent 1-to-1 Mapping & Dimension Verification

Each tampered image file was independently tested directly against the mask directory, bypassing row order:

* **Bijective Mapping:** Every `Tp_<donor>_<spliced>_<id>.<ext>` maps to exactly `Tp_<donor>_<spliced>_<id>_gt.png`.
* **Mapped Pairs:** **5,123 / 5,123** (100.0%)
* **Dimension Matching:** Every image and mask pair opened with Pillow:
  * Dimensions matching: **5,123 / 5,123** (100.0%)
  * Dimension mismatches: **0**
* **Missing Masks:** **0**
* **Orphaned Masks in `groundtruth/`:** **0** (no unreferenced masks exist)
* **Unreadable Files:** **0**

---

## 6. Check 5 — Baseline Artifact Preservation

* `datasets/public/CASIA2/raw/casia2_gt_repo.zip`: **Preserved** (483,937 bytes).
* `datasets/public/CASIA2/images/images/kaggle_example.jpg`: **Preserved** (195,554 bytes, 2135 × 1006).
* `datasets/public/CASIA2/images/images/resolution_mismatch.png`: **Preserved** (141,729 bytes, 881 × 402).
* `datasets/public/CASIA2/images/images/rotation_mismatch.png`: **Preserved** (186,423 bytes, 906 × 403).

---

## 7. Check 6 — Attribution, Provenance & Forensic Boundaries

* **Original Authors:** Jing Dong, Wei Wang, Tieniu Tan (2013), *"CASIA Image Tampering Detection Evaluation Database"*, IEEE ChinaSIP 2013.
* **Ground-Truth Reconstruction:** Nam Thanh Pham et al. (2019), *"Hybrid Image-Retrieval Method for Image-Splicing Validation"*, *Symmetry* 11(1):83.
* **Repaired Corrections:** SunnyHaze (2024), repairing rotation and resolution mismatches across Kaggle and Pham releases.
* **Legal Terms:** Non-commercial academic research only.
* > ⚠️ **Domain Disclaimer:** CASIA 2.0 authentic/tampered labels refer exclusively to general photographic manipulation (splicing and copy-move of natural scenes). They do NOT represent academic certificate or credential authenticity.

---

## 8. Final Audit Determination

| Criteria | Result |
|---|---|
| Archive Integrity & Checksum | PASSED |
| Filesystem Recount | PASSED |
| Inventory CSV Schema & Links | PASSED |
| Bijective Mask Alignment | PASSED |
| Baseline Preservation | PASSED |
| Provenance & Disclaimers | PASSED |
| **Audit Conclusion** | **CASIA 2.0 ACQUISITION IS FULLY VALIDATED** |
