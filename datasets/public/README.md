# VeriProof — Public Datasets

> **Data Origin:** All datasets listed here are publicly sourced. None of this data originates from VeriProof's production system or Neon database.

## Directory Structure

```
datasets/
├── public/
│   ├── IDSpace/           European identity document dataset (metadata only)
│   ├── CASIA2/            Image tampering detection corrected groundtruth
│   └── FUNSD/             Form understanding in noisy scanned documents
└── reports/               Download and quality reports
```

---

## Dataset Summaries

### 1. FUNSD — Form Understanding in Noisy Scanned Documents

| Field | Value |
|---|---|
| **Source** | https://github.com/crcresearch/FUNSD |
| **Homepage** | https://guillaumejaume.github.io/FUNSD/ |
| **Download date** | 2026-10-09 |
| **Images downloaded** | 199 (149 train, 50 test) |
| **Annotation files** | 199 JSON files |
| **Entity rows (CSV)** | 9,743 |
| **Word rows (CSV)** | 31,485 |
| **License** | Research use — verify at homepage before commercial/training use |

**What it is:** Scanned form images annotated with entity types (`question`, `answer`, `header`, `other`) and bounding boxes at word and entity level.

> ⚠️ **NOT a certificate or document-fraud dataset.** FUNSD contains administrative forms (tax forms, receipts, etc.). Fraud/authenticity labels do not exist in this dataset.

**CSV files:**
- `csv/funsd_entities.csv` — 9,743 entity records with label, text, bounding box, linking
- `csv/funsd_words.csv` — 31,485 word records with bounding box coordinates
- `csv/funsd_image_inventory.csv` — 199 image records with dimensions and annotation path

---

### 2. CASIA 2.0 Corrected Groundtruth

| Field | Value |
|---|---|
| **Source** | https://github.com/SunnyHaze/CASIA2.0-Corrected-Groundtruth |
| **Original dataset** | http://forensics.idealtest.org/ |
| **Archive** | `CASIA2.0_revised_corrected.zip` (2.49 GB, SHA-256: `d9e6d648a...`) |
| **Download date** | 2026-10-09 |
| **Images downloaded** | 12,614 total (7,491 Au authentic, 5,123 Tp tampered) + 3 demo images |
| **Ground-truth masks** | 5,123 repaired binary masks (100% matched, 0 mismatches) |
| **License** | Research use only. Cite Jing Dong et al. (2013) and Nam Thanh Pham et al. (2019) |

**What it is:** CASIA 2.0 is a photographic image-tampering detection dataset (splicing, copy-move, removal). The ground truth provides **corrected masks** fixing rotation/resolution mismatches in the original widely-distributed groundtruth.

> ⚠️ **NOT a certificate or academic-credential fraud dataset.** The `authentic`/`tampered` labels refer to photographic manipulation of general images. Do not conflate with document fraud.

**CSV files:**
- `csv/casia_image_inventory.csv` — 12,617 rows (3 documentation images + 7,491 authentic + 5,123 tampered images with ground-truth mapping)

---

### 3. IDSpace — European Identity Document Dataset

| Field | Value |
|---|---|
| **Source** | https://huggingface.co/datasets/cactuslab/IDSpace |
| **Download date** | 2026-10-09 |
| **Full dataset size** | ~123 GB (NOT downloaded) |
| **Files catalogued** | 45 repo files (21 parquet shards + 24 config/country tarballs) |
| **License** | Check HuggingFace dataset page before any use |

**What it is:** European identity document images (national IDs, passports) in mobile-photo, scan, and template configurations across multiple countries (ALB, AZE, ESP, EST, FIN, GRC, LVA, RUS, SRB).

> ⚠️ **NOT an Indian academic certificate dataset.** IDSpace contains European identity documents. Do not infer certificate authenticity labels from this dataset.

> 🔴 **MANUAL STEP REQUIRED:** Full dataset requires ~123 GB storage and verified license agreement. Per-country configs available as `{COUNTRY}_scan.tar.gz` / `{COUNTRY}_template.tar.gz` + `Mobile_images.tar`.

**CSV files:**
- `csv/idspace_file_inventory.csv` — 21 parquet shard rows catalogued (file listing only, data not downloaded)

---

## ⚠️ Important Disclaimer

None of these datasets contain verified Indian academic certificate data or certificate fraud labels:

- **FUNSD** → administrative form understanding
- **CASIA 2.0** → general photographic tampering detection
- **IDSpace** → European identity documents

These datasets provide general ML foundations (layout analysis, tampering detection, document structure). Domain-specific fine-tuning on actual Indian academic certificate data would require separate, properly licensed datasets.

---

## Citation Requirements

If publishing research using these datasets, cite the original authors:

**FUNSD:**
> Jaume, Guillaume, Hazem Hajj, and Jean-Philippe Thiran. "FUNSD: A Dataset for Form Understanding in Noisy Scanned Documents." *ICDARW 2019.*

**CASIA 2.0:**
> Jing Dong, Wei Wang, Tieniu Tan. "CASIA Image Tampering Detection Evaluation Database." *IEEE ChinaSIP 2013.*
> Nam Thanh Pham et al. "Hybrid Image-Retrieval Method for Image-Splicing Validation." *Symmetry 2019.*

**IDSpace:**
> See https://huggingface.co/datasets/cactuslab/IDSpace for citation details.
