# VeriProof Image Forensics — Reliability, Robustness & Uncertainty Evaluation Report

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Evaluator:** Senior ML Reliability & Document Forensics Team  
**Evaluation Date:** 2026-10-10  
**Model Architecture:** Gradient Boosting Forensic Classifier (`image_forensics-v20261009T183244Z-743113d3`)  
**Feature Extraction:** 10 Features (ELA mean/max/std/p95, Laplacian blur variance, SNR noise dB, color channel variance, aspect ratio, edge density, resampling indicator)

---

## 1. Held-Out Evaluation & Confidence Bounds

Evaluation was executed on the strictly isolated test split (`IMG_GRP_018`, `IMG_GRP_019`, `IMG_GRP_020`):

| Metric | Measured Baseline Score | Wilson 95% Confidence Interval | Sample Support |
|---|---|---|---|
| **Accuracy** | **1.0000 (100.0%)** | **[0.8241, 1.0000]** | 18 images |
| **Precision** | **1.0000 (100.0%)** | - | 9 authentic / 9 tampered |
| **Recall (Sensitivity)** | **1.0000 (100.0%)** | **[0.7008, 1.0000]** | 9 tampered |
| **F1-Score** | **1.0000** | - | 18 images |
| **ROC-AUC** | **1.0000** | - | 18 images |
| **False Positive Rate (FPR)** | **0.0000 (0.0%)** | - | 9 clean |
| **False Negative Rate (FNR)** | **0.0000 (0.0%)** | - | 9 tampered |
| **Mean Localization IoU** | **0.8842** | - | Ground truth masks |

> **Uncertainty Warning:**  
> While the model achieves 100% on the synthetic 18-image held-out partition, the Wilson 95% confidence interval for true population accuracy is **[82.41%, 100.0%]**. Statistical confidence claims must not exceed the bounds of empirical sample support.

---

## 2. Transformation Robustness Matrix

| Transformation Category | Type | Test Cases | Accuracy | Correct Predictions | Failure Modes / Remarks |
|---|---|---|---|---|---|
| **Malicious Alteration** | Copy-Move Seal Splice | 3 | 100.0% | 3/3 | High ELA localized residual in spliced area |
| **Malicious Alteration** | CGPA Inpainting / Text Overlay | 3 | 100.0% | 3/3 | Resampling grid & Laplacian gradient divergence |
| **Malicious Alteration** | Signature Cut-and-Paste | 3 | 100.0% | 3/3 | Boundary noise SNR inconsistency |
| **Benign Transformation** | JPEG Recompression (Q=75) | 3 | 100.0% | 3/3 | Uniform compression ELA profile; correctly classified authentic |
| **Benign Transformation** | Gaussian Blur Distortion | 3 | 100.0% | 3/3 | Uniform blur variance; correctly classified authentic |
| **Benign Transformation** | Pristine Digital Vector PDF Render | 3 | 100.0% | 3/3 | Baseline reference; correctly classified authentic |
| **Physical Acquisition** | Scanner & Mobile Camera Distortion | - | *Pending Lab Data* | - | Marked pending physical test fixture collection |

---

## 3. Cryptographic Invariant Safeguards

- Image forensics output `tamper_score` is rendered as an informational risk score (0.0 to 1.0) and pixel-level heatmap.
- **Under no circumstances does an image forensics score approve a document if the SHA-256 artifact hash does not match or the ECDSA P-256 signature is invalid.**
- If an image cannot be parsed or the forensic model throws an exception, the platform falls back to deterministic cryptographic rules and flags `forensics_diagnostic_status: "ERROR"`.
