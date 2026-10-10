# VeriProof AI/ML Subsystems — Reproducibility & Model Registry Guide

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Version:** v2.0.0  
**Date:** 2026-10-10  
**Registry Root:** `ml/artifacts/models/registry.json`

---

## 1. Verified Model Artifacts & SHA-256 Checksums

All trained model weights and metadata are strictly tracked in `ml/artifacts/models/registry.json`.

| Model Name / Task | Model ID | Artifact Filename | SHA-256 Checksum | Approved Status |
|---|---|---|---|---|
| **Image Forensics** | `image_forensics-v20261009T183244Z-743113d3` | `image_forensics-v20261009T183244Z-743113d3.joblib` | `611e3b376703708737f2c8635e71857d84080fa392f6a12fe92d4475e836539c` | `VALIDATED` |
| **Anomaly Detection** | `anomaly_detection-v20261009T183244Z-0eb3e3a2` | `anomaly_detection-v20261009T183244Z-0eb3e3a2.joblib` | `669e0c8803d2404e70404db6c3fe3031580698f2a842530a3ea39f319a2ecf59` | `VALIDATED` |
| **Field Consistency** | `field_consistency-v20261009T183244Z-a7aaf085` | `field_consistency-v20261009T183244Z-a7aaf085.joblib` | `d8e4404e0e7bf05c930a68ee1efd6793d8d6bdc956425367262c523d8f70eb07` | `VALIDATED` |

---

## 2. Reproducibility & Execution Commands

### A. Run Complete Enhanced ML Reliability & Calibration Suite
```powershell
backend\.venv\Scripts\python.exe ml/src/run_enhanced_evaluation.py
```
*Outputs master manifest to `ml/reports/ml_evaluation_manifest_v2.json`.*

### B. Run Complete ML Unit & Regression Suite
```powershell
backend\.venv\Scripts\python.exe -m pytest ml/tests/ -v
```

### C. Run Full Backend Regression Suite (134 Tests)
```powershell
backend\.venv\Scripts\python.exe -m pytest backend/tests/ -v
```

### D. Verify Model Artifact Checksums Programmatically
```powershell
backend\.venv\Scripts\python.exe -c "from ml.src.model_registry import ModelRegistry; from pathlib import Path; reg = ModelRegistry(Path('ml/artifacts/models')); print('All artifacts verified:', all(reg.verify_checksum(m) for m in reg.list_models()))"
```

---

## 3. Seed & Hyperparameter Standards

- **Random State:** Fixed at `20261009` across training pipelines.
- **Evaluation Splits:** Group-aware isolation maintained in `datasets/splits/*.csv`.
- **Atomic Loading:** In-memory joblib deserialization only occurs from verified registry paths with SHA-256 validation.
