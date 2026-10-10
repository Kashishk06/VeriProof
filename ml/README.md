# VeriProof AI/ML Intelligence & Document Forensics Engine

The **VeriProof AI/ML Pipeline** provides task-specific, leak-proof, reproducible document forensics, OCR consistency validation, behavioral anomaly scoring, and cryptographic verification for academic credentials and official documents.

---

## 1. Directory Architecture

```
ml/
├── configs/
│   └── default.yaml                     # Master hyperparameter & path configuration
├── src/
│   ├── config.py                        # Safe YAML/JSON configuration loader
│   ├── data_registry.py                 # Dataset manifest & split partition registry
│   ├── validate_data.py                 # Data validation & leakage audit CLI
│   ├── train.py                         # Reproducible model training engine CLI
│   ├── evaluate.py                      # Held-out benchmark evaluation CLI
│   ├── model_registry.py                # Checksum-verified artifact storage & versioning
│   ├── inference_service.py             # Production inference services layer
│   └── features/
│       ├── image_forensics.py           # ELA, noise SNR, Laplacian sharpness, and localization
│       ├── ocr_features.py              # Text normalization, fuzzy matching, and date rules
│       └── anomaly_features.py          # Platform velocity, burst rate, and failure scoring
├── artifacts/
│   └── models/                          # Versioned .joblib artifacts & registry.json
├── reports/
│   ├── STEP7_IMPLEMENTATION_REPORT.md   # Comprehensive implementation report
│   ├── STEP7_MODEL_CARDS.md             # Formal model cards for all registered models
│   ├── step7_pipeline_manifest.json     # Machine-readable pipeline manifest
│   └── step7_test_results.json          # Machine-readable evaluation test results
└── tests/
    ├── test_data_registry.py            # Manifest & split leakage unit tests
    └── test_features_and_models.py      # Feature extraction & model registry tests
```

---

## 2. CLI Usage & Pipeline Execution

### A. Validate Dataset Integrity & Group Leakage
```bash
python -m ml.src.validate_data --config ml/configs/default.yaml
```

### B. Train Models Reproducibly
```bash
# Train all tasks:
python -m ml.src.train --task all --config ml/configs/default.yaml

# Or train individual tasks:
python -m ml.src.train --task image_forensics --config ml/configs/default.yaml
python -m ml.src.train --task anomaly_detection --config ml/configs/default.yaml
python -m ml.src.train --task field_consistency --config ml/configs/default.yaml
```

### C. Evaluate Models Against Strictly Held-Out Test Splits
```bash
python -m ml.src.evaluate --task all --config ml/configs/default.yaml
```

### D. Run Automated Test Suite
```bash
# ML Unit Tests:
python -m pytest ml/tests/ -v

# FastAPI Backend ML Integration Tests:
cd backend && .\.venv\Scripts\python -m pytest tests/test_ml_api.py -v
```

---

## 3. Subsystem Architecture & Separation of Concerns

1. **Image Forensics Layer (`ImageForensicsService`):**
   - Features: Error Level Analysis (ELA), Laplacian focus/sharpness, Gaussian noise SNR, color channel ratios, resampling inconsistency.
   - Outputs: Continuous tampering probability `[0.0, 1.0]`, pixel-level localization bounding boxes, and heuristic warnings.
2. **OCR Field Consistency Layer (`FieldConsistencyService`):**
   - Features: Normalized Levenshtein similarity, regex format parsing, chronological validation (passing year vs issue date vs convocation).
   - Distinguishes: `CONSISTENT`, `BENIGN_OCR_NOISE` (e.g. 0/O ambiguity), `AMBIGUOUS` (low confidence scan), and `INCONSISTENT_SUSPECT_TAMPERING`.
3. **Behavioral Anomaly Layer (`AnomalyDetectionService`):**
   - Features: Verification request velocity (last hour), rapid failure burst count, IP country changes, off-hours scoring.
   - Outputs: Decision function score and severity flags (`LOW`, `MEDIUM`, `HIGH`).
4. **Cryptographic Verification Layer (`CryptographicVerificationService`):**
   - Deterministic SHA-256 digest comparison and ECDSA signature validation against trusted public keys.
   - **Crucial Rule:** Deterministic cryptographic outcomes are authoritative (`VERIFIED` vs `TAMPERED`); ML scores serve as explainable supporting evidence and never override cryptographic proof.

---

## 4. FastAPI Backend Endpoints

All inference endpoints are mounted under `/api/v1/ml/` and protected by server-side JWT authentication and RBAC:

- `GET /api/v1/ml/health` — Returns system health and active model versions.
- `GET /api/v1/ml/models` — Lists checksum-verified model artifacts in the registry.
- `POST /api/v1/ml/image-forensics` — Analyzes base64-encoded document image for tampering.
- `POST /api/v1/ml/field-consistency` — Evaluates OCR extraction against expected ground truth.
- `POST /api/v1/ml/anomaly-score` — Scores platform submission telemetry for brute-force patterns.
- `POST /api/v1/ml/ocr` — Performs structured field validation and confidence scoring.
