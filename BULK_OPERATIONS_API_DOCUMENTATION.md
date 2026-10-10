# VeriProof — Bulk Operations API Documentation

**Module:** High-Throughput Bulk Operations & Ingestion API  
**Version:** 1.0.0  
**Base Path:** `/api/v1/bulk`  
**Authentication:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Overview & Architecture

The VeriProof Bulk Operations API provides enterprise issuers and verifiers with asynchronous, high-throughput batch processing for credential registration and cryptographic/forensic verification.

### Core Guarantees:
- **Asynchronous Execution:** Batches are accepted with immediate `202 Accepted` or `200 OK` status, returning a batch identifier (`batch_id`) for non-blocking progress polling.
- **Fail-Safe Processing:** Failure of an individual document item does not abort the entire batch; all items are processed and individual errors are recorded.
- **Strict Role-Based Access Control:** Registration endpoints require verified `ISSUER` or `SUPER_ADMIN` credentials; verification endpoints are available to all authenticated platform users.

---

## 2. API Endpoints Reference

### 2.1 Preview & Validate Registration Metadata
Validates batch registration parameters and metadata rows prior to committing to an asynchronous batch.

- **URL:** `POST /api/v1/bulk/validate-registration`
- **Method:** `POST`
- **Role Required:** `ISSUER`, `SUPER_ADMIN`
- **Content-Type:** `multipart/form-data`

#### Parameters:
| Name | Type | In | Required | Description |
|---|---|---|---|---|
| `metadata_csv` | File | Form | No | CSV metadata file containing document headers and rows |
| `metadata_json` | String | Form | No | Raw JSON string containing document rows |

#### Success Response (`200 OK`):
```json
{
  "total_rows": 3,
  "valid_rows": 3,
  "invalid_rows": 0,
  "can_proceed": true,
  "errors": [],
  "sample_rows": [
    {
      "row_index": 1,
      "document_title": "Master of Science in Computer Science Degree",
      "document_type": "degree",
      "recipient_name": "Alexandra Chen",
      "recipient_identifier": "STF-STU-88219",
      "recipient_email": "alex.chen@alumni.stanford.edu",
      "issue_date": "2026-06-15",
      "expiry_date": null,
      "filename": "degree_alex_chen.pdf",
      "is_valid": true,
      "validation_errors": []
    }
  ]
}
```

---

### 2.2 Initiate Bulk Document Registration Batch
Uploads a ZIP archive of documents alongside metadata (CSV or JSON) to initiate asynchronous cryptographic registration and ledger anchoring.

- **URL:** `POST /api/v1/bulk/register`
- **Method:** `POST`
- **Role Required:** `ISSUER`, `SUPER_ADMIN`
- **Content-Type:** `multipart/form-data`

#### Parameters:
| Name | Type | In | Required | Description |
|---|---|---|---|---|
| `zip_file` | File | Form | Yes | ZIP archive containing documents matching filenames in metadata |
| `metadata_csv` | File | Form | No | CSV file with columns: `RecipientName`, `RecipientId`, `DocumentTitle`, `DocumentType`, `IssueDate`, `ExpiryDate`, `Filename`, `RecipientEmail` |
| `metadata_json` | String | Form | No | JSON array of metadata objects |
| `enable_watermark` | Boolean | Form | No | Whether to apply dynamic cryptographic watermarking (Default: `false`) |
| `notify_recipients` | Boolean | Form | No | Whether to send automated issuance confirmation emails (Default: `false`) |

#### Success Response (`202 Accepted`):
```json
{
  "batch_id": "b7c2a114-180e-436d-9653-569d67b7f1e2",
  "batch_type": "REGISTRATION",
  "status": "QUEUED",
  "total_items": 3,
  "processed_items": 0,
  "successful_items": 0,
  "failed_items": 0,
  "progress_percentage": 0.0,
  "created_at": "2026-10-10T01:20:00Z",
  "completed_at": null,
  "error_summary": null
}
```

---

### 2.3 Initiate Bulk Document Verification Batch
Uploads multiple individual document files or a ZIP archive to execute parallel cryptographic integrity checks and AI/ML forensic model evaluations.

- **URL:** `POST /api/v1/bulk/verify`
- **Method:** `POST`
- **Role Required:** `VERIFIER`, `ISSUER`, `ADMIN`, `SUPER_ADMIN`
- **Content-Type:** `multipart/form-data`

#### Parameters:
| Name | Type | In | Required | Description |
|---|---|---|---|---|
| `files` | Array[File] | Form | No | List of individual document files (PDF/PNG/JPG) |
| `zip_file` | File | Form | No | ZIP archive containing candidate documents |

#### Success Response (`202 Accepted`):
```json
{
  "batch_id": "d4e5f6a7-291f-547e-0764-670e78c8a2f3",
  "batch_type": "VERIFICATION",
  "status": "QUEUED",
  "total_items": 2,
  "processed_items": 0,
  "successful_items": 0,
  "failed_items": 0,
  "progress_percentage": 0.0,
  "created_at": "2026-10-10T01:22:00Z",
  "completed_at": null,
  "error_summary": null
}
```

---

### 2.4 Get Batch Processing Status
Polls the execution status, progress counters, and overall summary of an active or completed batch.

- **URL:** `GET /api/v1/bulk/batches/{batch_id}`
- **Method:** `GET`
- **Role Required:** Authenticated User (Tenant-restricted)

#### Success Response (`200 OK`):
```json
{
  "batch_id": "b7c2a114-180e-436d-9653-569d67b7f1e2",
  "batch_type": "REGISTRATION",
  "status": "COMPLETED",
  "total_items": 3,
  "processed_items": 3,
  "successful_items": 3,
  "failed_items": 0,
  "progress_percentage": 100.0,
  "created_at": "2026-10-10T01:20:00Z",
  "completed_at": "2026-10-10T01:20:03Z",
  "error_summary": null
}
```

---

### 2.5 Get Paginated Batch Items
Retrieves detailed per-item processing outcomes, cryptographic hashes, verification verdicts, and ML signals.

- **URL:** `GET /api/v1/bulk/batches/{batch_id}/items`
- **Method:** `GET`
- **Role Required:** Authenticated User (Tenant-restricted)
- **Query Parameters:**
  - `page` (int, default: 1): Page number.
  - `limit` (int, default: 50): Items per page (max: 200).
  - `status_filter` (string, optional): Filter by item status (`PENDING`, `SUCCESS`, `FAILED`).
  - `verification_filter` (string, optional): Filter by verification verdict (`VERIFIED`, `TAMPERED`, `UNVERIFIED`).

#### Success Response (`200 OK`):
```json
{
  "batch_id": "b7c2a114-180e-436d-9653-569d67b7f1e2",
  "total_items": 3,
  "page": 1,
  "limit": 50,
  "total_pages": 1,
  "items": [
    {
      "id": "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
      "item_index": 1,
      "original_filename": "degree_alex_chen.pdf",
      "document_title": "Master of Science in Computer Science Degree",
      "document_type": "degree",
      "recipient_name": "Alexandra Chen",
      "recipient_identifier": "STF-STU-88219",
      "recipient_email": "alex.chen@alumni.stanford.edu",
      "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "status": "SUCCESS",
      "verification_outcome": "VERIFIED",
      "registered_document_id": "8f3b21c4-11e0-4a8b-90e2-123456789abc",
      "public_verification_id": "VP-2026-STF-9021",
      "error_message": null,
      "error_code": null,
      "retry_count": 0,
      "ml_signals": {
        "tamper_detected": false,
        "tamper_risk_score": 0.02,
        "anomaly_score": 0.01,
        "overall_verdict": "GENUINE"
      },
      "processing_time_ms": 42.5
    }
  ]
}
```

---

### 2.6 List User/Organization Batches
Lists all historical and in-progress batches with filtering and pagination.

- **URL:** `GET /api/v1/bulk/batches`
- **Method:** `GET`
- **Role Required:** Authenticated User
- **Query Parameters:**
  - `batch_type` (string, optional): `REGISTRATION` or `VERIFICATION`.
  - `status` (string, optional): Filter by batch status.
  - `page` (int, default: 1)
  - `limit` (int, default: 20)

---

### 2.7 Cancel In-Progress Batch
Terminates an ongoing batch and marks pending items as `CANCELLED`.

- **URL:** `POST /api/v1/bulk/batches/{batch_id}/cancel`
- **Method:** `POST`
- **Role Required:** `ISSUER`, `ADMIN`, `SUPER_ADMIN`

---

### 2.8 Retry Failed Batch Items
Retries only failed or retry-eligible items within a completed or partial batch without reprocessing successful items.

- **URL:** `POST /api/v1/bulk/batches/{batch_id}/retry`
- **Method:** `POST`
- **Role Required:** `ISSUER`, `ADMIN`, `SUPER_ADMIN`

---

### 2.9 Export Batch Results CSV
Downloads a comprehensive audit CSV report of all items and verification verdicts, fully escaped against spreadsheet formula injection.

- **URL:** `GET /api/v1/bulk/batches/{batch_id}/export`
- **Method:** `GET`
- **Role Required:** Authenticated User
- **Response:** Content-Type `text/csv; charset=utf-8` with attachment header.

---

## 3. Example `cURL` Commands

### Bulk Registration
```bash
curl -X POST "http://localhost:8000/api/v1/bulk/register" \
  -H "Authorization: Bearer <ISSUER_JWT_TOKEN>" \
  -F "zip_file=@documents_batch.zip;type=application/zip" \
  -F "metadata_csv=@manifest.csv;type=text/csv" \
  -F "notify_recipients=true"
```

### Bulk Verification
```bash
curl -X POST "http://localhost:8000/api/v1/bulk/verify" \
  -H "Authorization: Bearer <VERIFIER_JWT_TOKEN>" \
  -F "files=@diploma_alex.pdf" \
  -F "files=@cert_marcus.pdf"
```

### Poll Status
```bash
curl -X GET "http://localhost:8000/api/v1/bulk/batches/b7c2a114-180e-436d-9653-569d67b7f1e2" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Download Sanitized Export
```bash
curl -X GET "http://localhost:8000/api/v1/bulk/batches/b7c2a114-180e-436d-9653-569d67b7f1e2/export" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -o "batch_export_results.csv"
```
