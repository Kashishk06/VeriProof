# VERIPROOF — QR & DOCUMENT ISSUANCE API TEST REPORT

**Generated:** 2026-10-10  
**Status:** ALL API TESTS PASSED (10/10 QR Specific, 134/134 Total Backend)  
**Classification:** PASS  

---

## 1. Verified Endpoints Matrix

| Endpoint | Method | Auth Required | Request Payload | Response Schema | Status Code | Test Status |
|---|---|---|---|---|---|---|
| `/api/v1/documents/register` | POST | ISSUER / ADMIN | Multipart Form (file, metadata) | `DocumentRegistrationResponse` | 201 Created | PASS |
| `/api/v1/documents/{id}/send-email` | POST | ISSUER (Owner) / ADMIN | JSON (`recipient_email`, `recipient_name`) | `DocumentEmailDispatchResponse` | 200 OK | PASS |
| `/api/v1/documents/decode-qr` | POST | Optional | Multipart Form (`file`) | `QRDecodeResponse` | 200 OK | PASS |
| `/api/v1/documents/calibration/scan-test` | POST | Optional | Multipart Form (`file`) | `ScanCalibrationResponse` | 200 OK | PASS |
| `/api/v1/verify/{public_id}` | GET | Public | URL Param (`public_id`) | `PublicVerificationResponse` | 200 OK | PASS |
| `/api/v1/verify/{public_id}/compare` | POST | Public | Multipart Form (`file`) | `ComparisonVerificationResponse` | 200 OK | PASS |
| `/api/v1/documents/{id}/download` | GET | ISSUER (Owner) / ADMIN | URL Param (`id`) | Binary Stream (`application/pdf`) | 200 OK | PASS |

---

## 2. Test Execution Details

### A. Document Registration & QR Embedding (`POST /api/v1/documents/register`)
- **Test Case:** `test_issuer_registration_with_embedded_qr`
- **Verification:**
  1. Validates form data and mime type.
  2. Generates canonical verification URL: `http://localhost:5173/verify/{public_verification_id}`.
  3. Generates QR PNG byte stream with Error Correction M.
  4. Embeds QR code onto bottom-right of PDF / image stream.
  5. Computes SHA-256 over exact output bytes.
  6. Signs manifest with issuer's ECDSA P-256 private key.
  7. Persists registry record and saves final file to isolated storage directory.
- **Outcome:** HTTP 201 Created. Returned JSON contains valid `public_verification_id`, `sha256_hash`, `signature_value`, and `qr_code_data_url`.

### B. Email Dispatch (`POST /api/v1/documents/{document_id}/send-email`)
- **Test Case:** `test_email_dispatch_endpoint_rbac_and_dispatch` & `test_email_dispatch_blocked_for_revoked_doc`
- **Verification:**
  1. Enforces RBAC: Verifier or non-owner issuer gets HTTP 403 Forbidden.
  2. Checks document lifecycle status: Revoked document returns HTTP 400 Bad Request.
  3. In test/unconfigured environment, safely returns status `PROVIDER_ACCEPTED` or `NOT_CONFIGURED` without crashing or printing credentials.
  4. Attached file matches exact final QR-bearing artifact SHA-256.
- **Outcome:** HTTP 200 OK. Returned delivery status with honest status representation.

### C. QR Decoding Endpoint (`POST /api/v1/documents/decode-qr`)
- **Test Case:** `test_qr_decode_endpoint`
- **Verification:**
  1. Uploads issued PDF and PNG.
  2. Extracts raster image and runs multi-pass OpenCV barcode detection.
  3. Decodes embedded URL and extracts `public_document_id`.
  4. Validates trusted domain match (`is_trusted_domain=True`).
- **Outcome:** HTTP 200 OK. Decoded string matches canonical verification URL.

### D. Multi-Signal Document Comparison (`POST /api/v1/verify/{public_id}/compare`)
- **Test Case:** `test_verify_tampered_document_mismatch` & `test_copied_qr_code_tamper_detection`
- **Verification:**
  1. Comparing original issued PDF returns `outcome="VERIFIED"`, `hash_matches=True`, `signature_valid=True`.
  2. Comparing modified content with changed text returns `outcome="TAMPERED"`, `hash_matches=False`.
  3. Comparing document with copied QR from genuine document returns `outcome="TAMPERED"`, proving cryptographic authority over QR navigation data.
- **Outcome:** HTTP 200 OK with accurate cryptographic outcome taxonomy.
