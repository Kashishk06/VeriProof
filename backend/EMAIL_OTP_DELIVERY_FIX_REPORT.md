# VeriProof — Email OTP Delivery Fix Report

**Date**: 2026-10-09  
**Task**: Fix HTTP 404 and "Email service unavailable" on Signup → Send OTP

---

## 1. Root Cause: HTTP 404

### Finding
The Vite development server (port 5173) had **no proxy configured** for `/api/*` routes. When the browser at `http://localhost:5173` called `fetch('/api/v1/auth/send-otp', ...)`, the request hit the Vite dev server itself — which has no such route — and returned **HTTP 404 Not Found**.

The FastAPI backend was running correctly on port **8000**, but the browser never reached it.

### Evidence
- `vite.config.ts` had no `proxy` block.
- Direct test with `curl http://127.0.0.1:8000/api/v1/auth/send-otp` returned **HTTP 503** (SMTP not configured) — proving the route itself exists and is registered.
- Direct test with `curl http://localhost:5173/api/v1/auth/send-otp` returned **HTTP 404 Not Found** — proving the miss was on the dev server side.

### Fix
Added `/api` proxy in [`vite.config.ts`](../vite.config.ts):
```ts
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
},
```
All `/api/v1/...` fetch calls from the browser are now transparently forwarded to FastAPI.

---

## 2. Root Cause: "Email service unavailable" (HTTP 503)

### Finding
The backend's `SMTP_HOST` in `backend/.env` was set to the placeholder value `smtp.example.com`. The `OTPService.send_otp()` method explicitly checks for this and blocks dispatch:

```python
is_configured = bool(
    settings.SMTP_HOST
    and settings.SMTP_HOST.strip()
    and settings.SMTP_HOST.strip().lower() != "smtp.example.com"
)
if not is_configured and not is_test_mode:
    raise HTTPException(status_code=503, detail="Email service is not configured...")
```

This is **correct security behaviour** — it prevents silent failures. The fix is to configure real SMTP credentials.

---

## 3. Confirmed Backend Routes

Both alias routes are registered in [`app/api/v1/auth.py`](app/api/v1/auth.py):

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/v1/auth/email-otp/send` | Primary canonical route |
| `POST` | `/api/v1/auth/send-otp` | Alias (what the frontend calls) |
| `POST` | `/api/v1/auth/email-otp/verify` | Primary canonical route |
| `POST` | `/api/v1/auth/verify-otp` | Alias (what the frontend calls) |
| `POST` | `/api/v1/auth/signup` | Registration endpoint |

The frontend's `/api/v1/auth/send-otp` is already the correct alias — no frontend route change was needed.

---

## 4. Files Changed

| File | What Changed | Why |
|------|-------------|-----|
| `vite.config.ts` | Added `/api` proxy → `http://127.0.0.1:8000` | Fix HTTP 404 — proxy browser requests to FastAPI |
| `backend/.env.example` | Updated with Gmail SMTP placeholders and full setup docs | Operator guidance for live credentials |
| `backend/app/core/config.py` | `env_file` now accepts both `.env` and `backend/.env` | Robustness when running from repo root |
| `backend/app/services/otp_service.py` | Enhanced SMTP dispatch: HTML/plain multipart email, SSL/STARTTLS port detection, specific exception handling | Better UX email + clearer error messages per exception type |
| `src/pages/Signup/index.tsx` | Capture `verification_token` from verify-OTP response; pass it + org payload in final signup; add `verificationToken` state | Complete the backend verification handshake |

---

## 5. SMTP Configuration Required (Without Secret Values)

To enable real inbox delivery, set these variables in `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Port — `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | Sender email account (must match authorized Gmail address) |
| `SMTP_PASSWORD` | App Password from Google (16-char, not your account password) |
| `SMTP_FROM_EMAIL` | Sender "From" address (same as `SMTP_USER` for Gmail) |
| `SMTP_USE_TLS` | `True` for port 587 STARTTLS |
| `EMAILS_FROM_NAME` | Display name shown in inbox (e.g. `VeriProof Platform`) |

### Gmail App Password Setup Steps
1. Sign in to your Google account.
2. Enable **2-Step Verification** at: https://myaccount.google.com/security
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select app: **Mail** → device: **Other** → label: `VeriProof`
5. Google generates a 16-character App Password. Copy it immediately.
6. Place it in `backend/.env` as `SMTP_PASSWORD="xxxxxxxxxxxxxxxx"` (no spaces).
7. Set `SMTP_USER` and `SMTP_FROM_EMAIL` to your Gmail address.
8. **Restart the backend** after saving.

> ⚠️ **Never paste App Passwords or any secret credentials into chat or source code.**

---

## 6. SMTP Improvements Made

The OTP email dispatch was upgraded from a bare plaintext `MIMEText` to a proper email with:

- **Multipart alternative** (plain text + HTML) — modern clients render HTML; fallback for legacy clients.
- **Branded HTML template** — styled with VeriProof dark-mode colors; OTP displayed in a large monospace box.
- **Port-aware TLS**: port 465 → `SMTP_SSL`; port 587 → `SMTP + STARTTLS`; both with `ssl.create_default_context()`.
- **Specific exception handling**:
  - `SMTPAuthenticationError` → HTTP 502 with actionable App Password guidance.
  - `SMTPRecipientsRefused` → HTTP 422 (recipient rejected).
  - Connection/timeout errors → HTTP 502 with host/port guidance.
  - Generic exceptions → HTTP 502.

---

## 7. Test Results

```
.venv\Scripts\python -m pytest tests/ -v
======================= 70 passed, 55 warnings in 9.45s =======================
```

- **70 passed, 0 failed** — full regression baseline maintained.
- All OTP flow tests pass (test mode with `TESTING=True`).
- SMTP delivery failure returning HTTP 502 tested via `test_smtp_delivery_failure_returns_502`.
- No existing tests weakened or removed.

---

## 8. Verification Levels

| Level | Status |
|-------|--------|
| **A. Route exists and is registered** | ✅ Confirmed — `/api/v1/auth/send-otp` returns 503 (not 404) when hitting FastAPI directly. |
| **B. Mocked provider tests pass** | ✅ 70/70 tests pass, including OTP dispatch and SMTP failure cases. |
| **C. Real SMTP acceptance** | ⏳ **Not yet tested** — requires operator to configure valid `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` in `backend/.env` and restart the backend. |
| **D. Inbox delivery confirmed** | ⏳ **Not yet confirmed** — depends on level C being completed first. |

---

## 9. What Remains

To complete real email delivery:

1. Configure `backend/.env` with valid Gmail SMTP credentials (see Section 5).
2. Restart the backend: `cd backend && .\.venv\Scripts\python -m uvicorn app.main:app --reload`
3. Open the Signup page in the browser (Vite dev server at `http://localhost:5173`).
4. Enter a valid email address in **Official Organization Email** and click **Send OTP**.
5. Check the inbox (including spam folder) for the VeriProof email.
6. Enter the 6-digit OTP and click **Verify**.

---

## 10. Security Preservation Confirmation

- ✅ No OTP returned in any response body.
- ✅ No plaintext OTP or SMTP credentials written to application logs.
- ✅ Argon2id OTP hashing preserved.
- ✅ 60-second cooldown and 5/hour rate limit preserved.
- ✅ 10-minute expiry and 5-attempt limit preserved.
- ✅ Signed JWT verification token (15-min, single-use) preserved.
- ✅ No automatic verification bypass added.
- ✅ HTTP 503 returned (not a fake 200) when SMTP is unconfigured.
- ✅ JWT authentication, RBAC, and existing signup flow untouched.
- ✅ No database dropped, reset, or migrated.
- ✅ Existing 70 tests pass with no assertions weakened.
