# IDSpace Dataset — Subset Acquisition & Analysis Report

**Dataset:** IDSpace (European Synthetic Identity Document Dataset)  
**Source:** [https://huggingface.co/datasets/cactuslab/IDSpace](https://huggingface.co/datasets/cactuslab/IDSpace)  
**Status:** ✅ Permitted Preview Subset Acquired & Validated (30 Images)  
**Date:** 2026-10-09  
**Report File:** `datasets/reports/IDSPACE_SUBSET_REPORT.md`  
**CSV Inventory:** `datasets/public/IDSpace/csv/idspace_image_inventory.csv`  

---

## 1. Executive Summary

| Metric / Check | Value | Status |
|---|---|---|
| **Official Repository** | `cactuslab/IDSpace` on Hugging Face | ✅ Public (non-gated) |
| **Official License** | **Creative Commons Attribution 4.0 International (CC-BY-4.0)** | ✅ Permissive Research License |
| **Full Dataset Size** | ~123 GB (359,240 synthetic images) | ⚠️ Excluded per storage limit |
| **21 Baseline Catalogue Rows** | Represents 21 Parquet preview shards across configs, NOT training images | ✅ Clarified |
| **Acquired Subset** | `preview/scan/ALB.parquet` (Albania Scanner-Simulation Subset) | ✅ Downloaded |
| **Downloaded Archive Size** | **8,081,245 bytes (7.71 MB)** | ✅ Minimal Disk Footprint |
| **Extracted Images on Disk** | **30 full-resolution JPEG document images (10.42 MB)** | ✅ Extracted & PIL-verified |
| **Image Dimensions** | Exactly **2480 × 3507 pixels** (high-resolution A4 document scans) | ✅ Uniform High Quality |
| **Image Categories** | 10 Genuine (`positive`), 10 Inpaint/Rewrite, 10 Crop/Replace | ✅ Balanced Forensics Sample |
| **Inventory Records** | 30 rows in `idspace_image_inventory.csv` | ✅ Fully Catalogued |
| **Remaining Manual Actions** | None for current scope | ✅ Complete |

---

## 2. Source Inspection & Repository Structure

### Official Source Provenance:
* **Hugging Face Hub Repository:** `https://huggingface.co/datasets/cactuslab/IDSpace`
* **Creators:** CactusLab
* **Associated Paper:** *"IDSpace: A Novel Document Generator for Identity Verification and Document Fraud Detection"*
* **Repository Properties:**
  * `private`: False
  * `gated`: False (no approval form, token, or gatekeeping required)
  * `license`: `cc-by-4.0`

### Full Archive vs. Preview Structure:
The repository contains 45 files:
1. **Full Country Archives (~123 GB total):**
   * Per-country scanner archives: `ALB_scan.tar.gz` (4.09 GB), `AZE_scan.tar.gz`, `ESP_scan.tar.gz`, `EST_scan.tar.gz`, `FIN_scan.tar.gz`, `GRC_scan.tar.gz`, `LVA_scan.tar.gz`, `RUS_scan.tar.gz`, `SRB_scan.tar.gz`, `SVK_scan.tar.gz`.
   * Per-country template archives: `ALB_template.tar.gz` (12.59 GB), `AZE_template.tar.gz`, etc.
   * Mobile simulation archive: `Mobile_images.tar`.
2. **Preview Parquet Shards (21 files):**
   * 1 Mobile preview: `preview/mobile/mobile.parquet` (123.95 MB)
   * 10 Scanner previews: `preview/scan/*.parquet` (7–10 MB each)
   * 10 Template previews: `preview/template/*.parquet` (20–25 MB each)

---

## 3. Explanation of the 21 Baseline Catalogue Rows

The previous report catalogued 21 rows in `datasets/public/IDSpace/csv/idspace_file_inventory.csv`. 
* **Nature of the 21 Rows:** These rows represented the **remote file listing of the 21 preview Parquet shards** on Hugging Face (1 mobile, 10 scan, and 10 template shards).
* **Important Finding:** They were **remote shard index entries**, NOT local document images or training samples. No image binaries were present on disk until the current acquisition step.

---

## 4. Acquired Subset Details (`preview/scan/ALB.parquet`)

### Selection Rationale:
Rather than consuming 4.09 GB to 12.59 GB for a single uncompressed country tarball or ~123 GB for the full dataset, the official `preview/scan/ALB.parquet` file provides an ideal representative benchmark:
* Download size is only **7.71 MB**.
* Contains embedded binary image payloads and forensic transformation parameters.
* Covers genuine and synthetic fraud scenarios.

### Extracted Category Breakdown:
| Category | Source | Samples | Verified Dimensions | Description |
|---|---|---|---|---|
| `positive` | `scan` | 10 | 2480 × 3507 | Synthetic identity document simulated under flatbed scanner capture (genuine) |
| `fraud_inpaint_and_rewrite` | `scan` | 10 | 2480 × 3507 | Synthetic forgery simulating text erasure and replacement |
| `fraud_crop_and_replace` | `scan` | 10 | 2480 × 3507 | Synthetic forgery simulating photo/portrait cropping and replacement |
| **Total** | | **30** | **2480 × 3507** | **100% Readable (Pillow verified)** |

### Image Properties:
* **Format:** JPEG (`RGB` mode)
* **Resolution:** 2480 × 3507 (approx. 300 DPI A4 document standard)
* **Average File Size:** ~350 KB per image (10.42 MB total for 30 images)
* **Embedded Annotation:** Each record contains synthesis parameters in JSON (e.g. brightness, contrast, sharpness factor, simulated scanner noise).

---

## 5. CSV Inventory Manifest

The extracted image manifest has been written to [`datasets/public/IDSpace/csv/idspace_image_inventory.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/public/IDSpace/csv/idspace_image_inventory.csv) with **30 data rows**:

```csv
image_id,relative_path,country,source_type,category,label,width,height,file_extension,file_size_bytes,image_format,image_mode,annotation_json,data_origin,source_url,download_date,note
idspace_alb_scan_001,images/scan/ALB/scanned_86_generated.photos_v3_0068166.jpg,ALB,scan,positive,genuine_synthetic,2480,3507,jpg,474581,JPEG,RGB,"{...}",public_synthetic,https://huggingface.co/datasets/cactuslab/IDSpace,2026-10-09,"Synthetic ID document simulated under scanner capture (genuine)"
...
```

---

## 6. Critical Forensic & Domain Disclaimers

> ⚠️ **NO REAL PERSONAL INFORMATION:** All images and textual metadata in IDSpace are synthetically generated by model-guided generative pipelines. No real individuals' personal data is exposed.
>
> ⚠️ **DOMAIN LIMITATION — NOT INDIAN ACADEMIC CREDENTIALS:** IDSpace is exclusively composed of **European national identity cards and passports** (Albania, Spain, Greece, Finland, etc.). It does **not** represent Indian university degree certificates, diplomas, CBSE/ICSE marks cards, or academic seals. The labels `genuine_synthetic` and `fraud_synthetic` should be used strictly for general document layout and tampering detection experiments, not as ground truth for Indian certificate validation.

---

## 7. Storage Footprint Summary

* `datasets/public/IDSpace/raw/ALB_scan_preview.parquet`: 7.71 MB
* `datasets/public/IDSpace/images/scan/ALB/` (30 images): 10.42 MB
* `datasets/public/IDSpace/csv/idspace_image_inventory.csv`: 20.3 KB
* **Total Local Disk Consumption:** **~18.15 MB** (preserving 57+ GB free space).
