# VERIPROOF — CRYPTOGRAPHIC VALIDATION & TAMPER DETECTION REPORT

**Generated:** 2026-10-10  
**Status:** VALIDATED (ECDSA P-256 / SHA-256 Manifest Signing & Tamper Proofing)  
**Classification:** PASS  

---

## 1. Cryptographic Specifications

| Parameter | Specification | Implementation Standard |
|---|---|---|
| Document Integrity Hash | SHA-256 (FIPS 180-4) | Python `hashlib.sha256()` |
| Digital Signature Algorithm | ECDSA P-256 (secp256r1) with SHA-256 | Python `cryptography.hazmat.primitives.asymmetric.ec` |
| Canonical Serialization | Deterministic UTF-8 JSON Manifest (`schema_version=1`) | Sort keys, separators=(',', ':'), UTC timestamps |
| Key Management | Organization-scoped ECC PEM Keypairs | Isolated filesystem / Secrets manager |
| QR Code Embedding | PyMuPDF Vector Overlay (PDF) / Pillow (Image) | Pre-hash / Pre-signature embedding |

---

## 2. Canonical Manifest Structure

```json
{
  "document_id": "0d68d418-6c9c-4bd2-9b9f-c7650c9c9dac",
  "public_verification_id": "VP-2026-904-CS",
  "organization_id": 1,
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "issue_date": "2026-05-15",
  "issued_at": 1778803200,
  "expires_at": null,
  "signature_algorithm": "ECDSA-P256-SHA256",
  "signing_key_id": "KEY-APEX-2026-01",
  "schema_version": 1
}
```

---

## 3. Cryptographic Tamper Scenarios & Validation Evidence

| Test Scenario | Test Artifact | Cryptographic Hash Match | Signature Verification | Final Outcome | Verified In Test Suite |
|---|---|---|---|---|---|
| Genuine Issued Document | Exact Final QR-bearing PDF | Match (`True`) | Valid (`True`) | `VERIFIED` | `test_step8_e2e_full.py::test_e2e_02` |
| Text Modification | Modified GPA / Recipient text in PDF | Mismatch (`False`) | Valid historical manifest | `TAMPERED` | `test_qr_and_email.py::test_verify_tampered_document_mismatch` |
| Replaced Photograph / Image | Modified identity image on certificate | Mismatch (`False`) | Valid historical manifest | `TAMPERED` | `test_step8_e2e_full.py::test_e2e_03` |
| Copied Genuine QR Code | Genuine QR pasted onto unauthorized file | Mismatch (`False`) | Invalid for payload | `TAMPERED` | `test_qr_and_email.py::test_copied_qr_code_tamper_detection` |
| Corrupted at Rest in Storage | Byte corruption in backend storage | Mismatch (`False`) | Discrepancy detected | `TAMPERED` (409 on download) | `test_organization_oversight.py::test_register_verify_compare_download_and_revoke` |
| Revoked Document | Document revoked by authorized issuer | Match (`True`) | Valid historical manifest | `REVOKED` | `test_qr_and_email.py::test_email_dispatch_blocked_for_revoked_doc` |
| Unknown Identifier | Document ID not in registry | N/A | Missing | `UNVERIFIED` | `test_step8_e2e_full.py::test_e2e_04` |

---

## 4. Key Security Invariants Verified

1. **No Circular Signing:** The signature covers the canonical JSON manifest containing `sha256_hash` of the exact QR-bearing artifact, not self-referential bytes.
2. **Private Key Non-Exposure:** Private keys are never serialized in API responses, manifest outputs, audit logs, or frontend payloads.
3. **Decoupled ML & Crypto Authority:** An ML prediction cannot override a cryptographic mismatch. If `hash_matches=False`, the authoritative outcome is strictly `TAMPERED`.
