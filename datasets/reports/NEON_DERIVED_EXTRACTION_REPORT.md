# VeriProof — Neon-Derived Dataset Extraction Report

**Phase:** Step 4B — Master Neon-Derived Dataset Extraction  
**Execution Date:** 2026-10-09  
**Auditor / Extractor:** Antigravity AI  
**Database Target:** Neon Serverless PostgreSQL (`public` schema)  
**Access Mode:** `TRANSACTION READ ONLY` (Enforced session-level read-only constraint)  
**Overall Status:** ✅ **EXTRACTION & VALIDATION PASSED**  
**Report File:** `datasets/reports/NEON_DERIVED_EXTRACTION_REPORT.md`  
**Validation Results JSON:** `datasets/reports/neon_extraction_validation.json`  

---

## 1. Executive Summary & Extraction Inventory

A strictly read-only, privacy-minimized extraction was executed against the configured Neon PostgreSQL database. In compliance with security and privacy requirements, zero database objects were modified, zero credentials or secrets were logged or exported, and unpopulated tables were marked as `NOT_EXPORTED` rather than creating fabricated placeholder data.

| Artifact / Dataset Target | Source Table | Row Count | Sensitivity Status | Extraction Status |
|---|---|---|---|---|
| [`neon_schema_inventory.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/neon_derived/neon_schema_inventory.csv) | `information_schema` | **93 columns** | Complete metadata inventory | ✅ **EXPORTED** |
| [`issuer_status_cases.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/neon_derived/issuer_status_cases.csv) | `public.organizations` | **1 record** | Fully anonymized & pseudonymized | ✅ **EXPORTED** |
| [`verification_history_aggregates.csv`](file:///c:/Users/hp/Downloads/VeriProof/datasets/neon_derived/verification_history_aggregates.csv) | `public.audit_events` | **5 groups** | Coarse hourly aggregate metrics | ✅ **EXPORTED** |
| `registry_verification_cases.csv` | `public.registered_documents` | **0 rows** | N/A (0 rows exist in Neon) | ⏸️ **NOT_EXPORTED** (Documented Blocker) |
| `forensic_analysis_cases.csv` | `public.forensic_analyses` | **0 rows** | N/A (0 rows exist in Neon) | ⏸️ **NOT_EXPORTED** (Documented Blocker) |
| `organization_documents.csv` | `public.organization_documents` | **0 rows** | N/A (0 rows exist in Neon) | ⏸️ **NOT_EXPORTED** (Documented Blocker) |

---

## 2. Phase A — Read-Only Database Schema Findings

The database inspection was executed under `SET TRANSACTION READ ONLY;`. The `public` schema contains exactly **6 tables** and **93 columns**:

### Table-Level Audit:
1. **`organizations` (1 row, 26 columns):** Holds tenant and institutional issuer accounts. Contains 1 active organization (`Educational Institution` in MP, India).
2. **`users` (4 rows, 8 columns):** Holds system accounts (admin, issuer, verifier roles). Contains hashed passwords and personal emails.
3. **`audit_events` (5 rows, 7 columns):** Immutable platform event log (event types: `ORGANIZATION_REGISTERED`, `SUPER_ADMIN_PROVISIONED`, `ISSUER_REGISTERED`, `VERIFIER_REGISTERED`).
4. **`registered_documents` (0 rows, 30 columns):** Planned digital certificate registry table. Currently unpopulated.
5. **`forensic_analyses` (0 rows, 13 columns):** Planned automated document tamper scoring table. Currently unpopulated.
6. **`organization_documents` (0 rows, 9 columns):** Planned institutional proof-of-accreditation files. Currently unpopulated.

---

## 3. Phase B — Safe Export Scope & Privacy Minimization

### 3.1 Strict Data Exclusions
The following sensitive columns were identified during schema inventory and **permanently excluded** from all exports:
* **Authentication Credentials:** `users.hashed_password`
* **Contact & PII Identifiers:** `users.email`, `users.full_name`, `organizations.name`, `organizations.official_email`, `organizations.address`, `organizations.pin_code`, `organizations.authorized_representative_name`, `organizations.authorized_representative_email`, `organizations.authorized_representative_phone`
* **Network Tracing:** `audit_events.ip_address`
* **Storage Secrets & Keys:** `registered_documents.storage_key`, `registered_documents.signing_key_id`, `registered_documents.signing_public_key`, `organization_documents.storage_key`

### 3.2 Implemented Anonymization Techniques
1. **Pseudonymization:** Internal database integer `organizations.id` was pseudonymized into a non-reversible hash: `ISSUER_PSEUDO_111b1c55bc`.
2. **Coarse Date Buckets:** Exact event millisecond timestamps were truncated to date-only buckets (`2026-10-09`) or hourly aggregation windows (`2026-10-09 12:00:00+00`).
3. **Aggregated Workflow Metrics:** Audit logs were aggregated by `(event_type, time_bucket_hour)`, ensuring zero individual user journeys are traceable.

---

## 4. Ground-Truth & Label Policy

* **Database Status is Not Ground Truth:** The `organizations.status = "ACTIVE"` field reflects a current administrative state in the database, **not** an independently verified machine learning ground-truth label.
* **Prohibition of Label Collapsing:** Statuses (`ACTIVE`, `PENDING_REVIEW`, `SUSPENDED`, `REJECTED`) are documented separately and must not be collapsed into a binary classification.
* **Cold-Start Reality:** Because `registered_documents` has 0 rows, no production verification decisions (`VERIFIED`, `TAMPERED`, `REVOKED`) exist yet on Neon. Training on production document registries must await operational deployment.

---

## 5. Documented Blockers for Unexported Datasets

Per strict safety guidelines, placeholder or fabricated records were **never** generated:

1. **`registry_verification_cases.csv` — NOT_EXPORTED:**
   * **Reason:** The `registered_documents` table in Neon contains **0 records**.
   * **Resolution:** Re-run export when the platform has registered production certificates.
2. **`forensic_analysis_cases.csv` — NOT_EXPORTED:**
   * **Reason:** The `forensic_analyses` table contains **0 records**.
   * **Resolution:** Re-run export once the automated ML verification service processes live verification requests.

---

## 6. Security & Operational Verification

* **Zero Mutations:** Confirmed 0 `INSERT`, 0 `UPDATE`, 0 `DELETE`, and 0 `ALTER` statements were executed.
* **Zero Secret Exposure:** No connection strings, passwords, or tokens were printed in stdout, logs, or reports.
* **Connection Health:** Neon connection remained stable and performed under standard latency.
