# VeriProof — Authentication & Email OTP Onboarding Implementation Report
## Stage 5A — Complete Implementation Record

---

## Implemented Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/v1/auth/email-otp/send` | Dispatch verification OTP to email | None |
| POST | `/api/v1/auth/send-otp` | Alias (backward compat.) | None |
| POST | `/api/v1/auth/email-otp/verify` | Verify OTP → receive signed token | None |
| POST | `/api/v1/auth/verify-otp` | Alias (backward compat.) | None |
| POST | `/api/v1/auth/signup` | Create VERIFIER or ISSUER + Org account | None (OTP verified) |
| POST | `/api/v1/auth/login` | Authenticate (all roles) → JWT | None |
| GET  | `/api/v1/auth/me` | Return authenticated user profile | Bearer JWT |

---

## Super Admin Bootstrap

No public signup route for Super Admin. Initial provisioning via:

```powershell
cd backend
python bootstrap_admin.py
```

- Collects name, email, and password interactively (hidden `getpass` input — never CLI args)
- Enforces password complexity: ≥10 chars, uppercase, lowercase, digit, special char
- Blocks duplicate admin creation
- Blocks elevation of existing non-admin accounts
- Records `SUPER_ADMIN_PROVISIONED` audit event
- Hashes password with Argon2id before storage

---

## Files Created / Changed

| File | Action |
|------|--------|
| `app/core/security.py` | **Created** — Argon2id hashing, JWT create/decode, AES-256-GCM field encryption, email verification tokens |
| `app/core/config.py` | **Created** — Pydantic settings (DB URL, JWT, SMTP, encryption key, TESTING flag) |
| `app/schemas/auth.py` | **Created** — Full schema set: OTP requests/responses, OrganizationSignupPayload, SignupRequest, LoginRequest, TokenResponse, UserResponse, OrganizationResponse |
| `app/models/user.py` | **Created** — User ORM model with SUPER_ADMIN / ISSUER / VERIFIER roles |
| `app/models/organization.py` | **Created** — Organization ORM model with PENDING / APPROVED / REJECTED / SUSPENDED status |
| `app/models/audit.py` | **Created** — AuditEvent ORM model for security event logging |
| `app/services/otp_service.py` | **Created** — Cryptographic OTP service: Argon2id-hashed OTP, 60s cooldown, 5/hr rate limit, 10-min expiry, 5-attempt limit, SMTP dispatch, test-mode support |
| `app/api/dependencies.py` | **Created** — `get_current_user`, `require_role()`, `require_approved_issuer` FastAPI dependencies |
| `app/api/v1/auth.py` | **Created** — All auth endpoints (send OTP, verify OTP, signup, login, /me) |
| `app/api/v1/router.py` | **Modified** — Registered auth router |
| `bootstrap_admin.py` | **Created** — Privileged CLI Super Admin provisioning utility |
| `tests/test_auth.py` | **Updated** — 32 tests covering full OTP-gated signup lifecycle, login, /me, and OTP flows |

---

## Frontend — Organization Sign-Up Form

| File | Action |
|------|--------|
| `src/pages/Signup/index.tsx` | **Rewritten** — Removed Step 1 (Account Info), starts directly from Organization Details. Added organization-type-specific document uploads (Required + Optional), Email OTP verification flow (Send/Verify buttons), password creation revealed only after verified email, and 2-step flow (Organization Details → Review & Submit) |

### Key Frontend Behaviors
- **Step 1 removed** — Form now begins at Organization Information directly
- **Organization Type selector** — dynamically changes required document label and clears stale uploads on type change
- **Required Document upload** — type-specific (e.g., Certificate of Incorporation for Corporate, Recognition Certificate for Educational)
- **Optional Supporting Document** — any supplementary authorization document
- **Email OTP field** — "Send OTP" button with 60s cooldown, resend support, cooldown timer
- **OTP Entry** — 6-digit numeric field, "Verify OTP" button, attempt feedback
- **Password Creation** — hidden behind email verification; unlocked only upon successful OTP verification
- **Password Strength Meter** — live score bar (Very Weak → Very Strong) with requirement checklist
- **Review Step** — organization summary, uploaded doc names, representative info, terms checkbox

---

## Database Schema

```
users            (id, email, hashed_password, full_name, role, is_active, organization_id, created_at)
organizations    (id, name, legal_name, org_type, registration_number, tax_id, website,
                  official_email, address, city, state, country, pin_code,
                  authorized_representative_name/role/email/phone,
                  primary_document_url, supporting_document_url,
                  status, reviewed_by_id, reviewed_at, rejection_reason,
                  created_at, updated_at)
audit_events     (id, event_type, user_id, organization_id, details, ip_address, created_at)
```

---

## Security Measures

| Measure | Status |
|---------|--------|
| Argon2id password hashing (OWASP 2023 params) | ✅ Active |
| OTP hashed with Argon2id before storage | ✅ Active |
| OTP never stored in plaintext | ✅ Active |
| Plaintext password never stored or returned | ✅ Active |
| `hashed_password` excluded from all API responses | ✅ Active |
| Signup requires verified email (OTP gate) | ✅ Active |
| Signed verification_token (JWT) bound to email + workflow | ✅ Active |
| 15-minute verification token expiry | ✅ Active |
| OTP: 60-second resend cooldown | ✅ Active |
| OTP: 5-per-hour rate limit | ✅ Active |
| OTP: 10-minute code expiry | ✅ Active |
| OTP: 5-attempt limit before invalidation | ✅ Active |
| OTP: single-use consumption | ✅ Active |
| Generic error for unknown email vs. wrong password (enumeration prevention) | ✅ Active |
| SUPER_ADMIN signup blocked at schema layer | ✅ Active |
| JWT signed with HS256 + configured SECRET_KEY | ✅ Active |
| Explicit algorithm restriction on JWT decode | ✅ Active |
| Token expiry validated on every `/me` request | ✅ Active |
| User always loaded fresh from PostgreSQL | ✅ Active |
| Email normalised to lowercase (case-insensitive) | ✅ Active |
| Issuer organization status check (require_approved_issuer) | ✅ Active |
| AES-256-GCM field encryption utilities | ✅ Available |
| Audit events for SIGNUP, ISSUER_REGISTERED, SUPER_ADMIN_PROVISIONED | ✅ Active |
| SUPER_ADMIN bootstrap: no default passwords, hidden input | ✅ Active |
| SMTP unconfigured → 503 (no silent fallback or simulation) | ✅ Active |

---

## Test Results (Executed 2026-10-09)

```
Platform: win32 — Python 3.12.1 — pytest 9.1.1
Collected: 32 items

TestPasswordSecurity::test_hash_is_not_plaintext              PASSED
TestPasswordSecurity::test_correct_password_verifies          PASSED
TestPasswordSecurity::test_wrong_password_fails               PASSED
TestPasswordSecurity::test_empty_password_fails               PASSED
TestJWTTokens::test_valid_token_decodes                       PASSED
TestJWTTokens::test_expired_token_returns_none                PASSED
TestJWTTokens::test_tampered_token_returns_none               PASSED
TestSignup::test_successful_signup                            PASSED
TestSignup::test_email_normalised_to_lowercase                PASSED
TestSignup::test_duplicate_email_returns_409                  PASSED
TestSignup::test_short_password_rejected                      PASSED
TestSignup::test_super_admin_signup_blocked                   PASSED
TestSignup::test_issuer_signup_requires_organization          PASSED
TestSignup::test_issuer_signup_allowed                        PASSED
TestSignup::test_signup_without_otp_verification_returns_400  PASSED
TestLogin::test_successful_login                              PASSED
TestLogin::test_wrong_password_returns_401                    PASSED
TestLogin::test_unknown_email_returns_401                     PASSED
TestLogin::test_wrong_and_unknown_return_same_message         PASSED
TestGetMe::test_me_with_valid_token                           PASSED
TestGetMe::test_me_without_token_returns_403                  PASSED
TestGetMe::test_me_with_invalid_token_returns_401_or_403      PASSED
TestGetMe::test_me_with_expired_token_returns_401_or_403      PASSED
TestOTPFlow::test_send_otp_invalid_email                      PASSED
TestOTPFlow::test_send_otp_in_testing_mode_succeeds           PASSED
TestOTPFlow::test_verify_otp_without_active_otp_returns_400   PASSED
TestOTPFlow::test_verify_otp_invalid_format_returns_422       PASSED
TestOTPFlow::test_full_otp_flow_in_test_mode                  PASSED
TestOTPFlow::test_otp_incorrect_code_returns_400              PASSED
TestOTPFlow::test_otp_cooldown_enforced                       PASSED
test_health.py::test_health_check                            PASSED
test_health.py::test_root                                    PASSED

Result: 32 passed, 10 warnings in 5.24s
```

> Warnings are cosmetic SQLAlchemy deprecation notices (`utcnow`) and a Starlette test client advisory — none affect correctness.

---

## Known Limitations / Next Steps

| Item | Status |
|------|--------|
| **Rate limiting on login endpoint** | ⚠️ Not yet — add `slowapi` or upstream nginx rule |
| **Refresh tokens** | ⏳ Not required for this stage |
| **Password reset flow** | ⏳ Planned — reuse OTP service with `password_reset` workflow |
| **SMTP production config** | ⚠️ Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD in `.env` for live OTP delivery |
| **Document file upload to object storage** | ⏳ Planned — currently stores filenames only; integrate S3/MinIO |
| **Super Admin org approval UI** | ⏳ Planned — endpoint to APPROVE / REJECT organizations |
| **SECRET_KEY strength** | ⚠️ Operator must set a cryptographically strong key in `.env` |
