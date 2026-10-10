# VeriProof Stage 6 Forensic Engine

## Audit outcome

Before this work, the backend had no forensic service, analysis persistence, model registry, training pipeline, or forensic API. Existing verifier screens displayed mock forensic claims. The signed document registry, private file storage, SHA-256 checks, ECDSA signature verification, authentication, RBAC, and audit-event model were reused.

## Implemented

- Deterministic structural features for accepted PDF, PNG, and JPEG files, including PDF parseability, page count, and metadata-presence flags. Raw PDF creator/producer values are not persisted.
- Explainable baseline risk index with reason codes for registry-hash mismatch, invalid or unavailable ECDSA keys, file-signature mismatch, malformed PDF structure, missing PDF end marker, and reuse of a registered hash. The index is not a probability and does not override registry or cryptographic outcomes.
- Optional XGBoost supervised and Isolation Forest unsupervised training, preprocessing, holdout evaluation/diagnostics, feature validation, artifact checksums, local versioned artifact storage, and registered-model inference signals kept separate from the baseline risk index.
- CSV training command: `python -m app.scripts.train_forensic_models --algorithm xgboost --input <reviewed.csv>` or `--algorithm isolation-forest`. XGBoost CSVs require the eight named feature columns plus `label` (`0` genuine, `1` suspicious); Isolation Forest requires the feature columns only. No training data is included in this repository.
- Authenticated APIs: `POST /api/v1/documents/{document_id}/forensic-analysis`, `GET /api/v1/documents/{document_id}/forensic-analysis`, and `GET /api/v1/forensics/models`.
- Verifier analysis UI wired to live API results, history, cryptographic check outcomes, findings, features, and registered model versions. The prior mock forensic component is no longer rendered by the verifier route.
- Analysis records are persisted with the document and organization references, features, findings, ML signals, model version, score, and cryptographic check outcomes. Analysis completion is recorded in the existing audit-event table.
- Alembic merge revision resolves the repository's two existing migration heads; forensic table and ML-signal migrations now form one head.

## Validation

- Backend test suite: `98 passed`.
- Frontend production build: succeeded.
- Alembic: one head (`b7c8d9e0a1f2`); offline `upgrade head --sql` generation succeeded.
- Pylance diagnostics: no errors in the changed API, model, schema, ML, or dashboard files.

## Production gaps

- The selected backend environment does not have `scikit-learn`, `xgboost`, or `joblib` installed. The optional dependency file declares ML packages, but actual model fitting, artifact round-trip, and inference were not executable here.
- No labeled training corpus or trained model artifacts exist. XGBoost evaluation and Isolation Forest diagnostics must be run against reviewed, representative data before any model is activated; the current Isolation Forest diagnostics are not fraud-detection performance metrics.
- The existing registry stores uploaded documents in private storage and verifies their SHA-256/ECDSA protections. It does not encrypt the document file bytes with AES-256-GCM. This implementation analyzes those existing stored bytes and does not change the established storage format; encrypted-at-rest document analysis remains separate work.
- Current visual analysis is limited to file signatures and PDF structure/metadata-presence indicators. OCR, image manipulation localization, ELA, and visual forgery classification are not implemented by this backend slice.
- The model registry is a local filesystem registry, not a distributed model service. Protect its configured directory as trusted server-side storage and restrict training commands to authorized operators.
- The migrations were validated offline but were not applied to a live PostgreSQL database in this environment.