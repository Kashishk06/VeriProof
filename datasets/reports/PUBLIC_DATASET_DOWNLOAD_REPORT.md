# VeriProof — Public Dataset Download Report

**Generated:** 2026-10-09  
**Operator:** Antigravity AI (automated)  
**Scope:** Download, extraction, CSV export, and quality checks for 3 public datasets

---

## Summary

| Dataset | Status | Images | CSVs | Manual Steps Needed |
|---|---|---|---|---|
| FUNSD | ✅ Complete | 199 | 3 | License verification for training use |
| CASIA 2.0 Corrected GT | ⚠️ Partial | 3 (docs only) | 1 | Full dataset from forensics.idealtest.org |
| IDSpace | ⚠️ Partial | 0 (metadata only) | 1 | Full 123GB download + license verification |

---

## 1. FUNSD — ✅ COMPLETED

### Files Created
| File | Path | Rows/Count |
|---|---|---|
| funsd_dataset.zip | `datasets/public/FUNSD/raw/funsd_dataset.zip` | 16,838,830 bytes |
| Extracted images | `datasets/public/FUNSD/images/training_data/` | 149 PNG files |
| Extracted images | `datasets/public/FUNSD/images/testing_data/` | 50 PNG files |
| JSON annotations | `datasets/public/FUNSD/annotations/training_data/` | 149 files |
| JSON annotations | `datasets/public/FUNSD/annotations/testing_data/` | 50 files |
| funsd_entities.csv | `datasets/public/FUNSD/csv/funsd_entities.csv` | **9,743 rows** |
| funsd_words.csv | `datasets/public/FUNSD/csv/funsd_words.csv` | **31,485 rows** |
| funsd_image_inventory.csv | `datasets/public/FUNSD/csv/funsd_image_inventory.csv` | **199 rows** |
| funsd_metadata.json | `datasets/public/FUNSD/metadata/funsd_metadata.json` | — |

### Download Details
- **Source URL:** https://guillaumejaume.github.io/FUNSD/dataset.zip
- **Download size:** 16.84 MB
- **Extraction entries:** 824 (images + annotations + supporting files)
- **Splits:** training_data (149 docs), testing_data (50 docs)
- **Total documents:** 199

### CSV Quality Results
| Check | Result |
|---|---|
| Headers valid | ✅ Yes |
| Encoding | ✅ UTF-8 |
| Missing labels | ✅ None (0/9,743 entities have empty label) |
| Image inventory vs. disk | ✅ 0 mismatches (all 199 images verified) |
| Annotation vs. image parity | ✅ 199 annotations match 199 images |
| Duplicate image_ids | ✅ None (doc_id is not PK — expected repeated in entity/word tables) |

### Field Coverage — funsd_entities.csv
`doc_id`, `split`, `entity_id`, `label`, `text`, `box_x0`, `box_y0`, `box_x1`, `box_y1`, `linking`, `data_origin`, `source_url`

### Field Coverage — funsd_words.csv
`doc_id`, `split`, `entity_id`, `entity_label`, `word_text`, `box_x0`, `box_y0`, `box_x1`, `box_y1`, `data_origin`

### Field Coverage — funsd_image_inventory.csv
`image_id`, `split`, `relative_path`, `file_extension`, `file_size_bytes`, `width`, `height`, `annotation_available`, `annotation_path`, `data_origin`, `source_url`, `download_date`

### Licensing & Usage
- Research use documented at https://guillaumejaume.github.io/FUNSD/
- **Must verify license before using for model training or commercial purposes**
- FUNSD is a form-understanding dataset. Entity labels: `question`, `answer`, `header`, `other`
- **NOT a certificate-fraud dataset** — do not fabricate fraud labels from this data

---

## 2. CASIA 2.0 Corrected Groundtruth — ⚠️ PARTIAL

### Files Created
| File | Path | Count |
|---|---|---|
| casia2_gt_repo.zip | `datasets/public/CASIA2/raw/casia2_gt_repo.zip` | 483,937 bytes |
| README.md | `datasets/public/CASIA2/raw/casia2_extracted/.../README.md` | Documentation |
| kaggle_example.jpg | `datasets/public/CASIA2/images/` | 1 example image |
| resolution_mismatch.png | `datasets/public/CASIA2/images/` | 1 example image |
| rotation_mismatch.png | `datasets/public/CASIA2/images/` | 1 example image |
| casia_image_inventory.csv | `datasets/public/CASIA2/csv/casia_image_inventory.csv` | **3 rows** |
| casia2_metadata.json | `datasets/public/CASIA2/metadata/casia2_metadata.json` | — |

### Download Details
- **Source URL:** https://github.com/SunnyHaze/CASIA2.0-Corrected-Groundtruth
- **Zip size:** 483,937 bytes
- **Zip contents:** 6 entries (README, 3 example images, directory structure)

### What Was Accessible vs. What Was Expected
| Item | Expected | Actual | Status |
|---|---|---|---|
| Full CASIA 2.0 images (Au + Tp) | ~5,123 images | 0 | ❌ Requires registration at forensics.idealtest.org |
| Corrected GT mask ZIP | 5,123 masks | 0 locally | ❌ Hosted on Google Drive (link in README) |
| Documentation/example images | — | 3 | ✅ Downloaded |
| Noise index (17 bad images) | Listed in README | Documented | ✅ In metadata |

### Source Accessibility Issues
The GitHub repo (`SunnyHaze/CASIA2.0-Corrected-Groundtruth`) is a **documentation and correction reference repository**, not the primary data host:
1. **Original CASIA 2.0 images** → Must be requested from http://forensics.idealtest.org/ (registration required)
2. **Corrected GT ZIP** → Hosted on Google Drive: https://drive.google.com/file/d/1JN93ts7VxJ4bbJL9TlE9uxM3ZeYuCN9M/view
3. **Kaggle mirror** → https://www.kaggle.com/datasets/divg07/casia-20-image-tampering-detection-dataset

### Manual Steps Required
1. Register at http://forensics.idealtest.org/ and download CASIA 2.0 (Au + Tp folders)
2. Download corrected GT ZIP from Google Drive link above
3. Place `Au/`, `Tp/`, `Gt/` folders inside `datasets/public/CASIA2/raw/`
4. Re-run `master_download.py` or the CASIA2 section to regenerate the inventory CSV with real data

### Inventory CSV — Known Limitations
The 3 rows in `casia_image_inventory.csv` represent documentation images only:
- `source_category`: empty (not authentic/tampered data images)
- `label`: empty (cannot infer)
- `groundtruth_available`: False (no matching GT masks)
- `pair_mapping_status`: unmatched

### Important Disclaimer
CASIA 2.0 labels `authentic` / `tampered` refer to **general photographic manipulation** (splicing, copy-move, in-painting). This is **not** certificate fraud or academic credential forgery. These labels must not be reused as certificate-fraud ground truth.

---

## 3. IDSpace — ⚠️ PARTIAL (Metadata Only)

### Files Created
| File | Path | Details |
|---|---|---|
| README.md | `datasets/public/IDSpace/raw/README.md` | 7,901 bytes |
| idspace_card_api.json | `datasets/public/IDSpace/raw/idspace_card_api.json` | HF API card |
| idspace_file_listing.json | `datasets/public/IDSpace/raw/idspace_file_listing.json` | 45 file paths |
| idspace_file_inventory.csv | `datasets/public/IDSpace/csv/idspace_file_inventory.csv` | **21 rows** (shard listing) |
| idspace_metadata.json | `datasets/public/IDSpace/metadata/idspace_metadata.json` | — |

### What Was Catalogued (Not Downloaded)
The HuggingFace repo contains 45 files:
- **21 parquet shards** (image data — NOT downloaded, estimated full dataset ~123 GB)
- **10 per-country scan tar.gz files** (`ALB_scan`, `AZE_scan`, `ESP_scan`, `EST_scan`, `FIN_scan`, `GRC_scan`, `LVA_scan`, `RUS_scan`, `SRB_scan`, + template variants)
- **1 Mobile_images.tar**
- **README.md + metadata files**

### Source Accessibility
- HuggingFace API: ✅ Accessible (card, file listing retrieved)
- Full parquet shards: ⚠️ Not downloaded (too large, ~123 GB total)
- Per-country tarballs: ⚠️ Not downloaded (verify license first)

### Manual Steps Required
1. Verify license at https://huggingface.co/datasets/cactuslab/IDSpace
2. To download a single country subset (e.g., ~1-3 GB):
   ```
   huggingface-cli download cactuslab/IDSpace ALB_scan.tar.gz --repo-type dataset
   ```
3. Or use `huggingface_hub.hf_hub_download()` for individual configs
4. Extract to `datasets/public/IDSpace/images/` and re-run inventory export

### Storage Estimates
| Config | Approx. Size |
|---|---|
| Full dataset | ~123 GB |
| Single country scan | ~1–3 GB |
| Mobile images | ~10–20 GB (estimate) |
| Available free disk | **60.7 GB** (insufficient for full dataset) |

### Important Disclaimer
IDSpace contains **European national identity documents**. It does NOT contain:
- Indian academic certificates
- Document authenticity/fraud labels
- Ground-truth for certificate forgery

Do not use IDSpace labels as Indian certificate-fraud ground truth.

---

## CSV Quality Check Summary

| CSV File | Rows | Encoding | Missing Labels | Image Files Verified | Status |
|---|---|---|---|---|---|
| funsd_entities.csv | 9,743 | UTF-8 ✅ | 0 | N/A | ✅ Pass |
| funsd_words.csv | 31,485 | UTF-8 ✅ | N/A | N/A | ✅ Pass |
| funsd_image_inventory.csv | 199 | UTF-8 ✅ | N/A | 199/199 ✅ | ✅ Pass |
| casia_image_inventory.csv | 3 | UTF-8 ✅ | 3/3 (expected — docs only) | 3/3 ✅ | ⚠️ Partial |
| idspace_file_inventory.csv | 21 | UTF-8 ✅ | N/A | 0 (not downloaded) | ⚠️ Partial |

> **Note on funsd_entities/words "duplicate IDs":** doc_id and entity_id are grouping keys, not unique row identifiers. Multiple words share the same entity_id by design. This is not a data quality error.

---

## Files Created — Complete List

```
datasets/
├── public/
│   ├── README.md                                          ✅ Created
│   ├── DATASET_MANIFEST.csv                               ✅ Created (3 rows)
│   ├── FUNSD/
│   │   ├── raw/funsd_dataset.zip                          ✅ 16.84 MB
│   │   ├── raw/funsd_extracted/dataset/training_data/     ✅ 149 images + 149 JSON
│   │   ├── raw/funsd_extracted/dataset/testing_data/      ✅ 50 images + 50 JSON
│   │   ├── images/training_data/                          ✅ 149 PNG files
│   │   ├── images/testing_data/                           ✅ 50 PNG files
│   │   ├── annotations/training_data/                     ✅ 149 JSON files
│   │   ├── annotations/testing_data/                      ✅ 50 JSON files
│   │   ├── csv/funsd_entities.csv                         ✅ 9,743 rows
│   │   ├── csv/funsd_words.csv                            ✅ 31,485 rows
│   │   ├── csv/funsd_image_inventory.csv                  ✅ 199 rows
│   │   └── metadata/funsd_metadata.json                   ✅
│   ├── CASIA2/
│   │   ├── raw/casia2_gt_repo.zip                         ✅ 483 KB
│   │   ├── raw/casia2_extracted/ (3 doc images + README)  ✅
│   │   ├── images/ (3 documentation example images)       ✅
│   │   ├── groundtruth/                                   ❌ Empty (full GT on Google Drive)
│   │   ├── csv/casia_image_inventory.csv                  ⚠️ 3 rows (docs only)
│   │   └── metadata/casia2_metadata.json                  ✅
│   └── IDSpace/
│       ├── raw/README.md                                  ✅ 7.9 KB
│       ├── raw/idspace_card_api.json                      ✅ 3.1 KB
│       ├── raw/idspace_file_listing.json                  ✅ 1.4 KB
│       ├── images/                                        ❌ Empty (not downloaded, ~123 GB)
│       ├── csv/idspace_file_inventory.csv                 ⚠️ 21 shard rows (no image data)
│       └── metadata/idspace_metadata.json                 ✅
└── reports/
    └── PUBLIC_DATASET_DOWNLOAD_REPORT.md                  ✅ This file
```

---

## Manual Steps Still Required

### CASIA 2.0 (High Priority)
1. Register at http://forensics.idealtest.org/
2. Download full Au + Tp + Gt dataset
3. Download corrected GT from https://drive.google.com/file/d/1JN93ts7VxJ4bbJL9TlE9uxM3ZeYuCN9M/view
4. Extract to `datasets/public/CASIA2/raw/` maintaining `Au/`, `Tp/`, `Gt/` structure
5. Re-run inventory script to regenerate `casia_image_inventory.csv` (will then have 5,000+ rows)

### IDSpace (Low Priority — optional)
1. Verify license at https://huggingface.co/datasets/cactuslab/IDSpace
2. Select country subsets to download (disk budget: ~60 GB available)
3. `huggingface-cli download cactuslab/IDSpace <country>_scan.tar.gz --repo-type dataset`
4. Extract to `datasets/public/IDSpace/images/` and regenerate CSV

---

## Licensing Summary

| Dataset | License | Training Use |
|---|---|---|
| FUNSD | Research — verify at homepage | Verify first |
| CASIA 2.0 | Research only — cite Dong 2013 + Pham 2019 | Research only |
| IDSpace | Unknown — check HuggingFace page | Verify first |

---

## Safety & Integrity Notes

- ✅ No executable files downloaded or run from archives
- ✅ All ZIP files inspected for path traversal before extraction
- ✅ Application code and Neon database were not modified
- ✅ No data fabricated — empty CSV fields reflect genuinely unavailable data
- ✅ No large datasets committed to Git (add `datasets/` to `.gitignore`)
- ✅ Source identifiers and original labels preserved without relabeling
