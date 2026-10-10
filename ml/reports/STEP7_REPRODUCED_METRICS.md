# STEP 7: REPRODUCED METRICS & CONFUSION MATRIX AUDIT

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Audit Timestamp:** 2026-10-10 00:10:00 IST  
**Auditor:** Independent Automated Verification Gate  
**Master Random Seed:** `20261009` (Strictly Deterministic)

---

## 1. Executive Metric Summary

All registered models in the VeriProof model registry have been independently re-evaluated against the original, strictly held-out test splits without hyperparameter re-tuning, threshold manipulation, or test-label feedback.

| Task / Subsystem | Registered Model ID | Test Split Support | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Checksum Verified |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Image Forensics** | `image_forensics-v20261009T183244Z-743113d3` | 18 images | `1.0000` | `1.0000` | `1.0000` | `1.0000` | `1.0000` | **MATCH (SHA-256)** |
| **Anomaly Detection** | `anomaly_detection-v20261009T183244Z-0eb3e3a2` | 575 events | — | `0.3922` | `0.7143` | `0.5063` | — | **MATCH (SHA-256)** |
| **Field Consistency** | `field_consistency-v20261009T183244Z-a7aaf085` | 1,030 cases | `0.9650` | `1.0000` | `0.6571` | `0.7931` | `0.9661` | **MATCH (SHA-256)** |

---

## 2. Deep Dive: Image Forensics 1.0000 Score Investigation

### A. The Finding
The `image_forensics` Gradient Boosting model achieved **100.0% accuracy (18 / 18 correct)** on the held-out test split:
- **True Negatives (Authentic):** 9 / 9
- **True Positives (Tampered):** 9 / 9
- **False Positives:** 0
- **False Negatives:** 0

### B. Root Cause Analysis
1. **Zero Group Leakage:** The test set consists exclusively of 3 held-out template groups (`IMG_GRP_018`, `IMG_GRP_019`, `IMG_GRP_020`) that are completely absent from training and validation. Group isolation is 100% verified.
2. **Synthetic Digital Fingerprint Disparity:** The synthetic generation pipeline renders pristine certificates using digital vector fonts and uncompressed PIL drawing, while tampering is introduced via digital pixel cut-and-paste (splicing seal/signature) and JPEG recompression.
3. **Linear Separability:** In the absence of physical paper texture, optical scanner sensor noise, paper crumpling, and uneven ambient lighting, the ELA mean difference (`ela_mean_diff`) and Laplacian gradient variance (`blur_laplacian_var`) exhibit distinct, non-overlapping cluster distributions between authentic and tampered synthetic documents.

> [!WARNING]
> **Real-World Generalization Warning:**  
> A score of 1.0000 on synthetic digital certificates is a measure of feature separation on synthetic mathematical artifacts. It **must not** be cited as evidence of real-world fraud detection capability against high-quality physical document counterfeiting. Deployment onto physical paper scans requires calibration against scanner-benchmarked datasets.

---

## 3. Confusion Matrices & Per-Class Breakdown

### Task 1: Image Forensics Classifier
- **Support:** 18 (9 Authentic, 9 Tampered)
- **Confusion Matrix:**
  $$\begin{pmatrix} 9 & 0 \\ 0 & 9 \end{pmatrix}$$
  - True Negative (Authentic -> Authentic): **9**
  - False Positive (Authentic -> Tampered): **0**
  - False Negative (Tampered -> Authentic): **0**
  - True Positive (Tampered -> Tampered): **9**

### Task 2: Behavioral Anomaly Detector
- **Support:** 575 Telemetry Events (519 Normal, 56 Anomalous)
- **Confusion Matrix:**
  $$\begin{pmatrix} 457 & 62 \\ 16 & 40 \end{pmatrix}$$
  - True Negative (Normal -> Normal): **457**
  - False Positive (Normal -> Anomaly Flag): **62**
  - False Negative (Anomaly -> Normal): **16**
  - True Positive (Anomaly -> Anomaly Flag): **40**
- **Analysis:** High recall (`71.43%`) ensures most suspicious brute-force attempts are flagged for second-factor review, with a moderate false alarm rate (`11.9%` false positive rate) typical of unsupervised Isolation Forests.

### Task 3: OCR Field Consistency Classifier
- **Support:** 1,030 Field Extractions (925 Consistent/Benign Noise, 105 Tampered/Inconsistent)
- **Confusion Matrix:**
  $$\begin{pmatrix} 925 & 0 \\ 36 & 69 \end{pmatrix}$$
  - True Negative (Consistent/Noise -> Consistent): **925**
  - False Positive (Consistent/Noise -> Tampered): **0**
  - False Negative (Tampered -> Consistent): **36**
  - True Positive (Tampered -> Tampered): **69**
- **Analysis:** Precision is `100.0%` (zero false alarms on benign OCR noise such as `0` vs `O`), while recall is `65.71%` due to conservative handling of subtle single-digit substitutions without date context.

---

## 4. Artifact Integrity Checksums

| Model ID | File Path | Actual SHA-256 Checksum | Registry Match |
| :--- | :--- | :--- | :---: |
| `image_forensics-v20261009T183244Z-743113d3` | `ml/artifacts/models/image_forensics-v20261009T183244Z-743113d3.joblib` | `611e3b376703708737f2c8635e71857d84080fa392f6a12fe92d4475e836539c` | **MATCH** |
| `anomaly_detection-v20261009T183244Z-0eb3e3a2` | `ml/artifacts/models/anomaly_detection-v20261009T183244Z-0eb3e3a2.joblib` | `669e0c8803d2404e70404db6c3fe3031580698f2a842530a3ea39f319a2ecf59` | **MATCH** |
| `field_consistency-v20261009T183244Z-a7aaf085` | `ml/artifacts/models/field_consistency-v20261009T183244Z-a7aaf085.joblib` | `d8e4404e0e7bf05c930a68ee1efd6793d8d6bdc956425367262c523d8f70eb07` | **MATCH** |
