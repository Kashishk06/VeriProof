# CASIA 2.0 Acquisition and Validation Report

**Dataset:** CASIA Image Tampering Detection Evaluation Database v2.0 (Corrected Ground-Truth Bundle)  
**Status:** ✅ ACQUISITION & VALIDATION COMPLETE (PASS)  
**Date:** 2026-10-09  
**Target Directory:** `datasets/public/CASIA2/`  
**Report File:** `datasets/reports/CASIA2_ACQUISITION_AND_VALIDATION_REPORT.md`  
**Raw Results JSON:** `datasets/reports/casia2_validation_results.json`  

---

## 1. Executive Summary

| Phase / Metric | Result | Status |
|---|---|---|
| **Archive Present in `raw/`** | `CASIA2.0_revised_corrected.zip` (2.49 GB) | ✅ Acquired |
| **Archive SHA-256 Checksum** | `d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5` | ✅ Verified |
| **ZIP CRC Integrity Test** | 17,744 entries verified; 0 corrupt files | ✅ PASS |
| **Archive Security Audit** | 0 unsafe paths, 0 path traversals (`..`), 0 executables | ✅ PASS |
| **Baseline Preserved** | 3 documentation images & baseline inventory records preserved | ✅ Preserved |
| **Authentic Images (`Au`)** | **7,491** readable images (345.68 MB) | ✅ Extracted & Validated |
| **Tampered Images (`Tp`)** | **5,123** readable images (3,003.31 MB) | ✅ Extracted & Validated |
| **Ground-Truth Masks (`Gt`)** | **5,123** readable masks (6.72 MB) | ✅ Extracted & Validated |
| **Tp ↔ Gt Mask Mapping** | **5,123 / 5,123** mapped (100.0%) | ✅ Complete |
| **Dimension Alignment** | **5,123 / 5,123** dimensions matched (100.0%) | ✅ 0 Mismatches |
| **Missing or Orphaned Masks** | **0** missing, **0** unmapped/orphaned | ✅ Perfect Match |
| **Total Inventory Records** | **12,617** rows in `casia_image_inventory.csv` | ✅ Complete |
| **Manual Action Remaining** | **None** | ✅ Complete |

---

## 2. Archive Acquisition & Integrity Details

The full dataset archive was identified and verified in `datasets/public/CASIA2/raw/`:

* **Archive Filename:** `CASIA2.0_revised_corrected.zip`
* **File Size:** 2,677,393,245 bytes (2,553.36 MB / ~2.49 GB)
* **Uncompressed Payload Size:** 3,519,145,533 bytes (~3.28 GB)
* **SHA-256 Checksum:**
  ```
  d9e6d648a683f4c4e4fa87067d9bd0790182769003b2805acd03af1b037ec9f5
  ```
* **Integrity Audit:** Performed exhaustive CRC-32 testing across all 17,744 archive entries using Python's `zipfile.ZipFile.testzip()`. Zero bad checksums or corrupted compression blocks were detected.
* **Security & Path Traversal Check:**
  * Root path traversal attempts (`../` or `..\`): **0**
  * Absolute paths (`/` or `C:\`): **0**
  * Suspicious executable files (`.exe`, `.dll`, `.bat`, `.cmd`, `.sh`, `.ps1`): **0**
  * Extracted safely without overwriting pre-existing files. `Thumbs.db` was ignored.

---

## 3. Dataset Provenance, Scope & Legal Terms

### Authorship and Citation
1. **Original Dataset Creators:**
   * **Institutions:** National Laboratory of Pattern Recognition (NLPR), Institute of Automation, Chinese Academy of Sciences (CASIA).
   * **Authors:** Jing Dong, Wei Wang, Tieniu Tan (2013).
   * **Publication:** *"CASIA Image Tampering Detection Evaluation Database"*, IEEE China Summit and International Conference on Signal and Information Processing (ChinaSIP 2013).
   * **Portal:** `http://forensics.idealtest.org/`

2. **Ground-Truth Mask Reconstruction & Repairs:**
   * **Algorithmic Reconstruction:** Nam Thanh Pham, Jong-Weon Lee, Goo-Rak Kwon, Chun-Su Park (2019), *"Hybrid Image-Retrieval Method for Image-Splicing Validation"*, *Symmetry* 11(1):83.
   * **Noisy Label & Alignment Correction:** Repaired by SunnyHaze (2024), fixing known rotation and resolution discrepancies between image pairs and masks.

### Usage Restrictions & Critical Disclaimer
* **Non-Commercial Academic Research Only:** Commercial deployment or public resale is strictly prohibited by CASIA NLPR terms.
* > ⚠️ **CRITICAL FORENSIC DISCLAIMER:** CASIA 2.0 is a benchmark for **photographic image manipulation** (copy-move and splicing of natural scenes, animals, architecture, and objects). It is **NOT** a dataset of educational degrees, academic marks cards, or government identity certificates. The labels `authentic` and `tampered` must not be conflated with academic credential authenticity.

---

## 4. Local Directory Structure on Disk

```
datasets/public/CASIA2/
├── raw/
│   ├── CASIA2.0_revised_corrected.zip    (2,677,393,245 bytes — full dataset archive)
│   ├── casia2_gt_repo.zip                (483,937 bytes — preserved documentation repo)
│   └── casia2_extracted/                 (Preserved documentation extraction)
├── images/
│   ├── Au/                               (7,491 authentic images; .jpg, .tif, .bmp)
│   ├── Tp/                               (5,123 tampered images; .jpg, .tif)
│   └── images/                           (3 preserved documentation demo images)
├── groundtruth/                          (5,123 repaired ground-truth masks; .png)
├── metadata/
│   ├── au_list.txt                       (Original NLPR list of 7,491 Au filenames)
│   ├── tp_list.txt                       (Original NLPR list of 5,123 Tp filenames)
│   └── casia2_metadata.json              (Full provenance, counts, and checksum record)
└── csv/
    └── casia_image_inventory.csv         (12,617 rows — unified dataset inventory)
```

---

## 5. Image & Ground-Truth Validation Results

Every extracted image and ground-truth mask was individually opened and inspected using Pillow (`PIL.Image`):

### 1. File Counts & Readability
* **Authentic (`Au`) Images:** 7,491 files
  * **Readable:** **7,491** (100.0%)
  * **Unreadable / Corrupt:** 0
  * **Formats:** JPEG (6,903), TIFF (534), BMP (54)
* **Tampered (`Tp`) Images:** 5,123 files
  * **Readable:** **5,123** (100.0%)
  * **Unreadable / Corrupt:** 0
  * **Formats:** JPEG (2,598), TIFF (2,525)
* **Ground-Truth (`Gt`) Masks:** 5,123 files
  * **Readable:** **5,123** (100.0%)
  * **Unreadable / Corrupt:** 0
  * **Format:** PNG (5,123)

### 2. Image-to-Mask Mapping Verification
* **Mapping Schema:** Each tampered image `Tp_<donor>_<spliced>_<id>.<ext>` maps to `Tp_<donor>_<spliced>_<id>_gt.png` in `groundtruth/`.
* **Tp Images Mapped to Existing Mask:** **5,123 / 5,123** (100.0%)
* **Missing Masks for Tp Images:** **0**
* **Orphaned Masks (masks without corresponding Tp image):** **0**
* **Authentic Images (`Au`):** Validated with `pair_mapping_status: "not_applicable"` and `groundtruth_available: False`.

### 3. Dimension Alignment Verification
* **Dimension Matches:** **5,123 / 5,123** (100.0%)
* **Dimension Mismatches:** **0**
* All 5,123 masks exactly match their corresponding tampered image width and height, verifying that SunnyHaze's rotation and resolution corrections are present.

### 4. Mask Color Modes
* `L` (8-bit grayscale / binary): 2,458 masks
* `RGB` (3-channel): 1,582 masks
* `RGBA` (4-channel with alpha): 1,081 masks
* `LA` (Grayscale with alpha): 2 masks

---

## 6. Inventory Manifest (`casia_image_inventory.csv`)

The inventory at [`datasets/public/CASIA2/csv/casia_image_inventory.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/CASIA2/csv/casia_image_inventory.csv) contains **12,617 rows**:

* **Baseline Documentation Records:** 3 rows (`casia2_src_00001` to `00003`)
* **Authentic Image Records:** 7,491 rows (`casia2_au_00001` to `casia2_au_07491`)
* **Tampered Image Records:** 5,123 rows (`casia2_tp_00001` to `casia2_tp_05123`)

### Field Specifications:
* `image_id`: Unique persistent identifier.
* `relative_path`: Relative path from `datasets/public/CASIA2/`.
* `source_category`: `Au` (Authentic), `Tp` (Tampered), or `documentation_demo`.
* `label`: `authentic`, `tampered`, or `unknown`.
* `width` & `height`: Verified image dimensions in pixels.
* `file_extension`: Lowercase file extension (`jpg`, `tif`, `png`, `bmp`).
* `file_size_bytes`: Exact file size on disk.
* `groundtruth_path`: Path to mask in `groundtruth/` (for Tp) or empty.
* `groundtruth_available`: Boolean string (`True` or `False`).
* `pair_mapping_status`: `matched` (100% of Tp), `not_applicable` (Au), or `unmatched` (demo).
* `data_origin`: `public`.
* `source_archive`: `CASIA2.0_revised_corrected.zip` or `casia2_gt_repo.zip`.
* `source_url` & `download_date`: Source attribution and timestamp.
* `note`: Granular description and status note.

---

## 7. Operational Compliance & Project State

* **Application Code:** Untouched (no FastAPI backend or frontend files modified).
* **Database & Neon:** Untouched (no migrations run, no records seeded or modified).
* **Model Training:** Not initiated.
* **Storage Footprint:**
  * Free disk space remains ample (~57+ GB free).
  * Raw dataset binary files are excluded from Git via `.gitignore`.
  * Manifest CSVs and markdown reports are properly tracked.
