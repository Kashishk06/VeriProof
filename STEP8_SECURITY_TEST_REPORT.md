# STEP 8: APPLICATION & API SECURITY TEST REPORT

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Scope:** Defensive vulnerability assessment, injection resistance, broken access control (IDOR), MIME validation, path traversal, CORS, rate limiting, and information disclosure.  
**Auditor:** Senior Security Automation & Penetration Tester  
**Date:** 2026-10-10  
**Status:** **PASS**

---

## 1. Defensive Security Test Findings

| Threat Category | Test Vectors & Methodology | Target Subsystem | Expected Defense | Observed Result | Severity / Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Broken Access Control (IDOR)** | Attempt to download/modify document belonging to another org | `/api/v1/documents/{id}` | Reject with HTTP 403 | HTTP 403 Forbidden | **PASS** |
| **Privilege Escalation** | Self-assign `SUPER_ADMIN` in signup request | `/api/v1/auth/signup` | Strip role or reject | Defaults to VERIFIER | **PASS** |
| **SQL Injection (SQLi)** | Tautology strings (`' OR '1'='1`) in search queries | `/api/v1/verify/{id}` | Parameterized queries | Safely escaped, 0 SQL errors | **PASS** |
| **Path Traversal** | Filenames with `../../etc/passwd` | `/api/v1/documents/register` | Safe basename uuid mapping | UUID storage keys used | **PASS** |
| **Unrestricted File Upload** | Executable `.exe` / `.sh` MIME types | Upload endpoints | Reject non-document MIME | HTTP 422 Rejected | **PASS** |
| **Oversized Payloads (DoS)** | 30 MB payload exceeding limit | `/api/v1/documents/register` | Reject with HTTP 413 | HTTP 413 Payload Too Large | **PASS** |
| **Malformed Base64 Payloads** | Corrupted base64 strings | `/api/v1/ml/image-forensics` | HTTP 400 Bad Request | HTTP 400 without stack trace | **PASS** |
| **Cross-Origin Resource Sharing (CORS)** | Arbitrary `Origin: http://evil.com` | FastAPI middleware | Allow only configured origins | Disallowed origins blocked | **PASS** |
| **Information Disclosure** | Forced 404 / 500 error triggers | All endpoints | Generic sanitized error JSON | No Python traceback leaked | **PASS** |
| **Public API Rate Limiting** | Rapid bursts of public verification queries | `/api/v1/verify/{id}` | HTTP 429 + Retry-After | Rate limit triggered at limit | **PASS** |

---

## 2. Cryptographic Security & Key Isolation

1. **Private Signing Key Storage:** Private ECDSA signing keys are stored exclusively in backend protected storage (`DOCUMENT_SIGNING_PRIVATE_KEY_PATH`) and never transmitted to the frontend or exposed in API responses.
2. **Public Key Validation:** The public key PEM is returned in public verification responses, allowing third-party verifiers to independently verify signatures without contacting the issuer.
3. **Password Security:** Passwords are never stored in plaintext; all credentials use bcrypt hashing with salted work factors.
