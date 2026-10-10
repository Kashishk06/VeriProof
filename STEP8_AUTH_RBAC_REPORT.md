# STEP 8: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) REPORT

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Scope:** Authentication, OTP lifecycle, JWT token security, role boundaries, tenant isolation, and privilege escalation prevention.  
**Auditor:** Senior Security & QA Engineering Team  
**Date:** 2026-10-10  
**Status:** **PASS**

---

## 1. Authentication & RBAC Test Matrix (16 Scenarios)

| ID | Scenario | Target API / Resource | Role / Context | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Valid Login | `POST /api/v1/auth/login` | Registered User | HTTP 200 + valid JWT token | HTTP 200 + JWT issued | **PASS** |
| **AUTH-02** | Invalid Password | `POST /api/v1/auth/login` | Registered User | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **AUTH-03** | Unknown User | `POST /api/v1/auth/login` | Non-existent Email | HTTP 401 (Generic error) | HTTP 401 "Invalid credentials" | **PASS** |
| **AUTH-04** | Missing Required Fields | `POST /api/v1/auth/login` | Incomplete JSON | HTTP 422 Unprocessable Entity | HTTP 422 Unprocessable Entity | **PASS** |
| **AUTH-05** | User Logout | Client Session / LocalStorage | Active Session | Clear token & redirect to login | Token purged from storage | **PASS** |
| **AUTH-06** | Expired Session | Protected API Endpoints | Expired JWT | HTTP 401 Unauthorized | HTTP 401 "Invalid or expired token" | **PASS** |
| **AUTH-07** | Tampered / Invalid JWT | Protected API Endpoints | Modified signature | HTTP 401 Unauthorized | HTTP 401 Signature verification failed | **PASS** |
| **AUTH-08** | Missing Bearer Token | `GET /api/v1/documents/my` | Unauthenticated | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **AUTH-09** | Direct Page Navigation | `/admin` route | Verifier / Guest | Redirect to unauthorized/login | Guard prevents unauthorized render | **PASS** |
| **AUTH-10** | Backend API Protection | `POST /api/v1/documents/register` | Unauthenticated | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **AUTH-11** | Insufficient Role Privileges | `POST /api/v1/documents/register` | Verifier User | HTTP 403 Forbidden | HTTP 403 "Insufficient permissions" | **PASS** |
| **AUTH-12** | Super Admin Enforcement | `GET /api/v1/admin/organizations` | Issuer User | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **AUTH-13** | Page Refresh Persistence | `/issuer` dashboard | Active JWT in Storage | Re-populates auth context | Re-authenticated via `/auth/me` | **PASS** |
| **AUTH-14** | Role Escalation Attempt | `POST /api/v1/auth/signup` | Payload with `SUPER_ADMIN` | Default to VERIFIER / error | Rejects self-assigned admin | **PASS** |
| **AUTH-15** | Cross-Tenant Data Access (IDOR)| `GET /api/v1/documents/{other_org_id}` | Issuer A vs Issuer B | HTTP 403 Forbidden | HTTP 403 "Cannot access this document"| **PASS** |
| **AUTH-16** | Anti-Replay / Duplicate Token | `POST /api/v1/auth/signup/verify` | Reused OTP Proof | HTTP 400 / 401 Token invalid | HTTP 400 "Token already used" | **PASS** |

---

## 2. Server-Side Authorization Authority

All authorization checks are enforced authoritatively on the FastAPI backend:
1. **JWT Verification:** HMAC-SHA256 signatures are decoded with backend secret key. Expired, altered, or unsigned tokens are rejected at the dependency layer (`get_current_user`).
2. **Organization Status Enforcement:** If an organization is marked `SUSPENDED` or `REVOKED` in PostgreSQL, all active sessions for that organization are instantly blocked server-side upon their next request, regardless of unexpired JWT validity.
3. **Role Checks:** `require_role(UserRole.ISSUER)` and `require_active_issuer` verify that only active issuers belonging to approved institutions can issue, sign, or revoke certificates.
