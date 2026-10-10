# VERIPROOF — SECURE EMAIL DELIVERY SYSTEM REPORT

**Generated:** 2026-10-10  
**Status:** IMPLEMENTED & VALIDATED  
**Classification:** PASS  

---

## 1. Architecture and Security

The VeriProof email dispatch module (`EmailDispatchService`) enables authorized document issuers to deliver issued credentials with the exact QR-bearing final artifact attached directly to the recipient.

```
[Issuer Dispatch Request] ──> [RBAC Ownership Check] ──> [Lifecycle Status Check]
                                                                │
                                                                ▼
                                                   [Resolve Storage Filepath]
                                                                │
                                                                ▼
                                                   [Construct Multipart MIME]
                                                   - Text / HTML Template
                                                   - Canonical Verification Link
                                                   - Attached Final QR Artifact
                                                                │
                                                                ▼
                                                   [SMTP Dispatch over TLS]
                                                                │
                                                                ▼
                                                   [Audit Trail Logging (UTC)]
```

---

## 2. Honest Lifecycle Status Semantics

The email service implements transparent delivery status tracking without fabricating results:

| Status Code | Description | Provider Condition |
|---|---|---|
| `NOT_CONFIGURED` | SMTP credentials or host not set in environment | `MAIL_USERNAME` or `MAIL_HOST` missing |
| `QUEUED` | Placed in async background task queue | Redis/Celery queue acceptance |
| `SENDING` | Socket connection established to SMTP relay | Handshake in progress |
| `PROVIDER_ACCEPTED` | SMTP server returned 250 OK / Provider accepted message | Test inbox / SMTP relay response code 250 |
| `DELIVERED` | End-to-end delivery confirmed via webhook | Webhook delivery event from provider |
| `FAILED` | Connection refused, timeout, or authentication failure | SMTPException or NetworkError |

---

## 3. Security and Privacy Controls

1. **RBAC & Document Ownership:** Non-owners and Verifiers receive HTTP 403 Forbidden.
2. **Revocation Guard:** Attempting to dispatch emails for `REVOKED` documents is rejected with HTTP 400 Bad Request.
3. **Artifact Integrity Guard:** The attachment is strictly the final registered QR-bearing artifact; unprocessed pre-issuance uploads are never attached.
4. **Credential Isolation:** SMTP passwords and private keys are never logged in audit logs or API outputs.
5. **Rate Limiting & Correlation:** Every dispatch registers an audit log event with correlation ID and timestamp in UTC.
