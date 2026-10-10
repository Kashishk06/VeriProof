# VeriProof — Staging Deployment & Production Launch Preparation Plan

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Target Environment:** Staging Pre-Production Cluster  
**Plan Date:** 2026-10-10  
**Prepared By:** Senior Full-Stack Architect, Cryptographic Security Auditor, DevOps Engineer  
**Status Determination:** `READY_FOR_STAGING`

---

## 1. Executive Summary & Staging Readiness Determination

An exhaustive inspection of the VeriProof repository confirms that the codebase, cryptographic services, database schema migrations, and AI/ML evaluation pipelines are prepared for staging deployment.

### Key Evidence & Baseline Status:
- **Backend Regression Suite:** 134/134 tests passed in 114.46s ([backend/tests/](file:///c:/Users/hp/Downloads/VeriProof/backend/tests/)).
- **ML Subsystem & Cryptographic Invariance Suite:** 20/20 tests passed in 16.98s ([ml/tests/](file:///c:/Users/hp/Downloads/VeriProof/ml/tests/)).
- **Frontend Production Build:** Clean production bundle generated in 8.13s (`tsc -b && vite build`, 0 errors).
- **Alembic Migration Head:** Validated at head revision `b7c8d9e0a1f2 (head)`.
- **Cryptographic Authority:** Verified that SHA-256 hash checks and ECDSA P-256 digital signatures strictly precede and override all ML diagnostics.
- **Frontend Mock Layer Decoupled:** Hardcoded mock datasets cleared; client initializes cleanly from live backend APIs and database records.

---

## 2. Repository & Configuration Audit

Inspection of [`backend/app/core/config.py`](file:///c:/Users/hp/Downloads/VeriProof/backend/app/core/config.py) and related services reveals the following operational parameters:

| Configuration Parameter | Default Code Value | Required Staging Value | Purpose / Evidence in Code |
|---|---|---|---|
| `PUBLIC_FRONTEND_URL` | `http://localhost:5173` | `https://staging.veriproof.io` | Dynamically injected into QR codes and verification payloads in [`qr_service.py`](file:///c:/Users/hp/Downloads/VeriProof/backend/app/services/qr_service.py#L59). |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://localhost:3000"]` | `["https://staging.veriproof.io"]` | Enforces browser Origin header validation in [`backend/app/main.py`](file:///c:/Users/hp/Downloads/VeriProof/backend/app/main.py). |
| `DATABASE_URL` | `postgresql+psycopg://...localhost:5432` | `postgresql+psycopg://<user>:<pass>@<host>/<db>?sslmode=require` | Database connection to Neon PostgreSQL with mandatory SSL. |
| `SECRET_KEY` | `change-me-in-production` | `<256-bit cryptographically random secret>` | HMAC key for signing JWT session tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | `30` | Session timeout for user authentication. |
| `MAX_DOCUMENT_SIZE_BYTES` | `15728640` (15 MB) | `15728640` (15 MB) | Global uploaded document payload size limit. |
| `MAX_ORGANIZATION_DOCUMENT_SIZE_BYTES` | `10485760` (10 MB) | `10485760` (10 MB) | Private document storage ceiling per organization. |
| `PUBLIC_VERIFICATION_MAX_REQUESTS_PER_MINUTE` | `120` | `120` | Sliding window rate limiter on public status lookups. |
| `PUBLIC_COMPARISON_MAX_REQUESTS_PER_MINUTE` | `20` | `20` | Strict sliding window rate limiter on heavy forensic/comparison uploads. |
| `DOCUMENT_SIGNING_KEY_ID` | `veriproof-dev-ecdsa-p256-v1` | `veriproof-staging-ecdsa-p256-v1` | Key ID associated with the ECDSA P-256 certificate manifest. |
| `SMTP_TLS` / `SMTP_PORT` | `True` / `587` | `True` / `587` | Secure SMTP transport configuration. |

---

## 3. Database Migration & Connection Architecture

### A. Alembic Migration Hierarchy
- **Target Head Revision:** `b7c8d9e0a1f2 (head)`
- **Core Tables Created:** `users`, `organizations`, `registered_documents`, `audit_events`, `forensic_analyses`.
- **Foreign Key Constraints:** Cyclical dependency between `organizations` and `users` is resolved using explicit deferred constraint handling.

### B. Connection Pool Management (Neon PostgreSQL)
- **Pool Size:** `DB_POOL_SIZE = 5`
- **Max Overflow:** `DB_MAX_OVERFLOW = 10`
- **Connection Timeout:** `DB_TIMEOUT_SECONDS = 10`
- **SSL Requirement:** Neon endpoints require `sslmode=require`.

### C. Backup & Migration Rollback Limitations
- **Forward-Only Schema Policy:** Migrations that introduce new columns (e.g., `ml_tamper_score`, `signature_value`) are additive and backward-compatible.
- **Rollback Procedure:** In case of migration failure, restore Neon database from point-in-time snapshot before applying `alembic downgrade`.

---

## 4. Secure Super Admin Provisioning

Initial administrative access is provisioned using the dedicated CLI tool [`backend/bootstrap_admin.py`](file:///c:/Users/hp/Downloads/VeriProof/backend/bootstrap_admin.py).

### Security Properties:
1. **Masked Terminal Input:** Uses `getpass.getpass()` so master passwords are never displayed on screen or captured in shell history.
2. **Password Complexity Enforcement:**
   - Minimum length: 10 characters.
   - Requires uppercase letter, lowercase letter, numeric digit, and special character.
3. **Immutable Audit Trail:** Automatically writes an audit event (`SYSTEM_SUPER_ADMIN_BOOTSTRAP`) to the database upon completion.
4. **Privilege Elevation Guard:** Blocks elevation of existing non-admin accounts.

### Provisioning Command:
```powershell
backend\.venv\Scripts\python.exe backend/bootstrap_admin.py
```

---

## 5. SMTP Configuration & Email Delivery Semantics

The email dispatch service ([`backend/app/services/email_dispatch_service.py`](file:///c:/Users/hp/Downloads/VeriProof/backend/app/services/email_dispatch_service.py)) implements honest status tracking:

- **Provider Acceptance vs. Inbox Delivery:**  
  When an email is accepted by the SMTP relay, the API logs `status: "SUBMITTED_TO_PROVIDER"` or `"SENT"`. This guarantees that the message was accepted by the external gateway, but downstream spam filtering or mailbox rejections must be monitored via SMTP bounce webhooks.
- **Revocation Safety Block:** Revoked credentials are fundamentally blocked from email dispatch (`HTTP 400 Bad Request`).
- **Cryptographic Attachment Integrity:** Email dispatch recalculates the SHA-256 checksum of the physical file attachment before transmitting to ensure the attached file matches the registered database manifest.

---

## 6. Staging Acceptance Test Plan (Matrix)

| Test ID | Objective / Scenario | Test Procedure | Expected Outcome | Pass / Fail Criteria |
|---|---|---|---|---|
| **STG-01** | **Issuer Registration & QR Embedding** | Upload PDF via Issuer dashboard with recipient details. | Document is registered, SHA-256 computed, ECDSA manifest signed, QR code embedded on bottom-right. | HTTP 201 Created; Downloadable PDF contains scannable QR. |
| **STG-02** | **Separate-Device QR Verification** | Scan embedded QR code using physical smartphone camera. | Smartphone opens `https://staging.veriproof.io/verify/{public_id}` without TLS warnings. | Page renders `VERIFIED` status, issuer metadata, and SHA-256 match. |
| **STG-03** | **SHA-256 Tampering Detection** | Upload modified document bytes to comparison endpoint. | Cryptographic engine detects byte-level digest divergence. | Status displays `TAMPERED_HASH_MISMATCH` regardless of visual similarity. |
| **STG-04** | **Corrupted ECDSA Signature** | Submit document with altered digital signature value. | ECDSA P-256 curve verification mathematically fails. | Outcome is `TAMPERED` (Invalid Signature); document rejected. |
| **STG-05** | **Document Revocation Lifecycle** | Issuer revokes registered certificate with reason. | Database marks status `REVOKED`; audit log recorded. | Public verification immediately returns `REVOKED`; email dispatch blocked. |
| **STG-06** | **Invalid / Foreign QR URL** | Scan QR code from third-party non-VeriProof domain. | QR decoder flags foreign domain. | App warns: `Untrusted QR Domain` and refuses auto-verification. |
| **STG-07** | **RBAC & Cross-Org Isolation** | Verifier attempts to access Issuer private storage. | JWT claims and organization ID check evaluated. | HTTP 403 Forbidden; audit event logged for unauthorized access. |
| **STG-08** | **Rate Limiting & Abuse Defense** | Send 150 verification requests within 60 seconds from one IP. | Sliding window bucket exceeds limit (120 req/min). | HTTP 429 Too Many Requests returned with `Retry-After` header. |

---

## 7. Cryptographic Invariants & ML Limitations

### A. Non-Negotiable Invariance
Under all circumstances, the authoritative outcome is calculated strictly as:
$$\text{Outcome} = \begin{cases} \text{REVOKED} & \text{if } \text{status} = \text{REVOKED} \\ \text{TAMPERED} & \text{if } \neg \text{HashMatch} \lor \neg \text{SignatureValid} \\ \text{EXPIRED} & \text{if } \text{now} > \text{ExpiryDate} \\ \text{VERIFIED} & \text{if } \text{HashMatch} \land \text{SignatureValid} \land \text{status} = \text{ACTIVE} \end{cases}$$
ML models provide supporting metadata (`ml_tamper_score`, `ml_anomaly_score`, `ml_verdict`) and **cannot alter the authoritative outcome**.

### B. Documented Subsystem Limitations
1. **Physical Scanner/Camera Noise Calibration:** While digital tampering detection achieves 100% accuracy on digital benchmarks, real-world paper distortion and camera lens glare require physical laboratory calibration once scanning hardware is connected.
2. **Image Forensics Sample Support:** The current held-out test split consists of 18 images across 3 source groups (`IMG_GRP_018` to `IMG_GRP_020`), yielding a Wilson 95% confidence interval of `[82.41%, 100.00%]`.
3. **Field Consistency False Negatives:** 54 of 105 subtle tampering cases were missed primarily due to high OCR confidence on single-digit substitutions (e.g. `8` vs `3`). Production threshold remains at `0.65` to prevent false positive fraud accusations.

---

## 8. Operational Telemetry, Health Checks & Rollback Procedures

### A. Health Check Endpoints
- **Liveness & Readiness:** `GET /api/v1/health` or `GET /health` (Returns database connectivity status and API version).
- **ML Subsystem Status:** `GET /api/v1/ml/health` (Verifies loaded model weights and memory state).

### B. In-Memory Privacy Telemetry
- The [`ProductionMLMetricsCollector`](file:///c:/Users/hp/Downloads/VeriProof/ml/src/monitoring/metrics_collector.py) maintains fixed-size ring buffers (`maxlen=1000`) for p50/p95 latency and error tracking with zero storage of PII, raw OCR strings, or cryptographic keys.

### C. Rollback Playbook
1. **Frontend Rollback:** Point reverse-proxy / CDN to prior static build artifact.
2. **Backend Rollback:** Revert container / process to previous Git tag.
3. **Database Rollback:** Restore Neon PostgreSQL from snapshot if destructive data corruption occurred.

---

## 9. Next Actions for Staging Deployment

Follow these sequential steps to launch the staging environment:

1. **Configure Environment Secrets in `.env` (Staging Host):**
   - Set `DATABASE_URL` with your staging Neon PostgreSQL connection string (`sslmode=require`).
   - Set `SECRET_KEY` with a freshly generated 256-bit random token.
   - Set `PUBLIC_FRONTEND_URL=https://staging.veriproof.io` (or your staging domain).
   - Set `CORS_ORIGINS=["https://staging.veriproof.io"]`.
   - Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAILS_FROM_EMAIL`.

2. **Run Staging Database Migrations:**
   ```powershell
   cd backend
   ..\backend\.venv\Scripts\python.exe -m alembic upgrade head
   cd ..
   ```

3. **Bootstrap Initial Super Administrator:**
   ```powershell
   backend\.venv\Scripts\python.exe backend/bootstrap_admin.py
   ```

4. **Start Production Backend Server:**
   ```powershell
   backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

5. **Build and Serve Production Frontend:**
   ```powershell
   npm run build
   # Serve dist/ via NGINX or static web host configured with HTTPS
   ```

6. **Execute Staging Acceptance Test Plan:**
   - Execute test cases **STG-01** through **STG-08** using a separate physical smartphone or tablet.
