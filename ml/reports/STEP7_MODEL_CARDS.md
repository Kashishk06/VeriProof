# VERIPROOF STEP 7: FORMAL MODEL CARDS

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Pipeline Release:** v1.0.0  
**Generated Date:** 2026-10-10  
**Master Random Seed:** `20261009`

---

## Model Card 1: Image Forensics Classifier (`image_forensics`)

### 1. Model Details
- **Model ID:** `image_forensics-v20261009T183244Z-743113d3`
- **Architecture:** Gradient Boosting Decision Trees (`GradientBoostingClassifier`, `n_estimators=100`, `max_depth=4`, `learning_rate=0.08`)
- **Developer:** VeriProof Core ML Intelligence Team
- **Release Date:** October 2026
- **License:** Internal VeriProof Platform (Permissive / MIT compatible)

### 2. Intended Use
- **Primary Use Case:** Identify statistical and compression inconsistencies in scanned academic degrees and certificates (splicing, seal copy-move, text grade inpainting).
- **Out-of-Scope Uses:** Must **not** be used as standalone legal proof of criminal fraud without registry cryptographic verification; must not be used on natural photographic scenes without domain adaptation.

### 3. Training & Evaluation Data
- **Training Partition:** 84 Synthetic Academic Certificate Images across 14 isolated source groups (`IMG_GRP_001` - `IMG_GRP_014`). 50% authentic / 50% tampered.
- **Validation Partition:** 18 Synthetic Certificate Images across 3 isolated source groups (`IMG_GRP_015` - `IMG_GRP_017`).
- **Test Partition (Held-out):** 18 Synthetic Certificate Images across 3 isolated source groups (`IMG_GRP_018` - `IMG_GRP_020`).
- **Zero Group Overlap:** Enforced and verified via connected component checks.

### 4. Features
1. `aspect_ratio`: Document width-to-height ratio.
2. `color_channel_var_ratio`: Ratio of red channel variance to blue channel variance.
3. `blur_laplacian_var`: Measure of global focus/sharpness via discrete Laplacian kernel.
4. `noise_snr_db`: High-frequency noise signal-to-noise ratio.
5. `ela_mean_diff`, `ela_max_diff`, `ela_std_diff`, `ela_p95_diff`: Recompression difference statistics at quality=90.
6. `edge_density`: Ratio of high-gradient pixel edges.
7. `resampling_indicator`: Inconsistency score between edge variance and noise floor.

### 5. Performance Metrics (Held-out Test Split)
- **Accuracy:** `1.0000` (100.0%)
- **Precision:** `1.0000` (100.0%)
- **Recall:** `1.0000` (100.0%)
- **F1-Score:** `1.0000` (100.0%)
- **ROC-AUC:** `1.0000`
- **Tampering Localization IoU:** `0.0182` (Bounding box regression on active splice masks)

---

## Model Card 2: Behavioral Anomaly Detector (`anomaly_detection`)

### 1. Model Details
- **Model ID:** `anomaly_detection-v20261009T183244Z-0eb3e3a2`
- **Architecture:** Unsupervised Isolation Forest (`IsolationForest`, `n_estimators=100`, `contamination=0.08`)
- **Developer:** VeriProof Core ML Intelligence Team
- **Release Date:** October 2026
- **License:** Internal VeriProof Platform (Permissive / MIT compatible)

### 2. Intended Use
- **Primary Use Case:** Detect unusual verification query velocities, credential brute-forcing, and telemetry spikes from verifier portal integrations.
- **Out-of-Scope Uses:** Must not be used to block legitimate users without administrative second-factor confirmation.

### 3. Training & Evaluation Data
- **Training Partition:** 350 Synthetic Telemetry Records from normal/burst verification events across 14 verifier entities (`VERIFIER_ORG_001` - `VERIFIER_ORG_014`).
- **Validation Partition:** 75 Telemetry Records from 3 verifier entities.
- **Test Partition (Held-out):** 575 Telemetry Records from 3 verifier entities.

### 4. Features
1. `verification_requests_last_hour`: Hourly query velocity.
2. `consecutive_failed_checks`: Rapid consecutive cryptographic or credential failures.
3. `burst_request_rate_per_sec`: Instantaneous query rate per second.
4. `time_of_day_anomaly_score`: Deviation from standard business-hours activity.
5. `metadata_tampering_score`: Inconsistent client headers / origin IP shifts.

### 5. Performance Metrics (Held-out Test Split)
- **Anomaly Recall:** `0.7143` (71.43%)
- **Anomaly Precision:** `0.3922` (39.22%)
- **Anomaly F1-Score:** `0.5063` (50.63%)
- **Operational Verdict:** Baseline anomaly flagger; routed to security operations for human review.

---

## Model Card 3: OCR Field Consistency Classifier (`field_consistency`)

### 1. Model Details
- **Model ID:** `field_consistency-v20261009T183244Z-a7aaf085`
- **Architecture:** Random Forest Classifier (`RandomForestClassifier`, `n_estimators=50`, `max_depth=4`)
- **Developer:** VeriProof Core ML Intelligence Team
- **Release Date:** October 2026
- **License:** Internal VeriProof Platform (Permissive / MIT compatible)

### 2. Intended Use
- **Primary Use Case:** Separate benign OCR character substitutions (e.g. `O` vs `0`, `I` vs `1` in stylized fonts) from high-confidence deliberate field alterations.
- **Out-of-Scope Uses:** Must not label unreadable scans as fraudulent.

### 3. Training & Evaluation Data
- **Training Partition:** 140 OCR Extraction Cases across 14 source groups.
- **Validation Partition:** 30 OCR Extraction Cases across 3 source groups.
- **Test Partition (Held-out):** 1,030 OCR Extraction Cases across 3 source groups.

### 4. Features
1. `similarity_score`: Normalized Levenshtein ratio between extracted text and expected registry field.
2. `ocr_confidence`: Confidence score output by OCR tokenization engine `[0.0, 1.0]`.
3. `is_roll_format_valid`: Boolean indicator of valid institutional roll number regex.
4. `length_diff_ratio`: Relative string length disparity.

### 5. Performance Metrics (Held-out Test Split)
- **Accuracy:** `0.9650` (96.50%)
- **Precision:** `1.0000` (100.0%)
- **Recall:** `0.6571` (65.71%)
- **F1-Score:** `0.7931` (79.31%)
