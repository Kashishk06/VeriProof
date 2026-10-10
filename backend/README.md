# VeriProof Backend API

This is the Python FastAPI backend for the VeriProof platform.

## Architecture
- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL 18 (SQLAlchemy 2.x, Psycopg 3)
- **Migrations**: Alembic
- **Authentication**: JWT (HS256), Argon2id Password Hashing
- **Security**: RBAC dependencies, ECDSA Signatures, SHA-256 Hashing

## Directory Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── dependencies.py   # get_current_user, require_role() RBAC deps
│   │   └── v1/
│   │       ├── router.py     # Main API router
│   │       └── auth.py       # signup, login, /me endpoints
│   ├── core/
│   │   ├── config.py         # Pydantic Settings (reads .env)
│   │   └── security.py       # Argon2id hashing + JWT utilities
│   ├── db/
│   │   ├── base.py           # Imports all models for Alembic
│   │   └── session.py        # SQLAlchemy engine + get_db dependency
│   ├── models/
│   │   └── user.py           # User model + UserRole enum
│   ├── schemas/
│   │   └── auth.py           # Signup/Login/Token/UserResponse schemas
│   └── main.py               # FastAPI app entry point
├── alembic/                  # Alembic migration environment
├── tests/
│   ├── test_health.py        # Health endpoint tests
│   └── test_auth.py          # 21 authentication tests
├── requirements.txt          # Core Python dependencies
├── requirements-ml.txt       # Optional ML/AI dependencies
├── alembic.ini               # Alembic config
├── .env.example              # Template (copy to .env, fill in secrets)
└── README.md
```

## Setup Instructions (Windows PowerShell)

### 1. Create and Activate Virtual Environment
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```powershell
Copy-Item .env.example .env
```
Then open `.env` and set these required values:
```env
DATABASE_URL="postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/veriproof"
SECRET_KEY="your-very-long-random-secret-key"
```

### 4. Generate a Secure JWT Secret Key
```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_hex(64))"
```
Copy the output into `SECRET_KEY` in your `.env` file. Never use the default.

### 6. Provision Initial Super Admin (CLI Bootstrap)
Super Admin accounts cannot be created via public signups. Provision the initial platform administrator using the privileged CLI bootstrap utility:
```powershell
cd backend
.\.venv\Scripts\python.exe bootstrap_admin.py
```
This utility:
- Prompts for Administrator Full Name and Email interactively.
- Collects Password via secure hidden input (`getpass`) and confirms it.
- Enforces complexity: >=10 characters, uppercase, lowercase, digit, and special character.
- Hashes credentials using Argon2id.
- Blocks duplicate Super Admin provisioning.
- Prevents elevation of existing ordinary users.
- Commits a `SUPER_ADMIN_PROVISIONED` security audit event.

### 7. Run Database Migrations
```powershell
.\.venv\Scripts\alembic upgrade head
```

### 8. Start the Backend Server
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Server starts at: http://localhost:8000

### 9. Run Tests
```powershell
.\.venv\Scripts\pytest tests/ -v
```

---

## API Documentation
| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/api/v1/openapi.json | OpenAPI JSON schema |
| http://localhost:8000/api/v1/health | Health check |

---

## Authentication Endpoints

### POST /api/v1/auth/signup
Create a new VERIFIER or ISSUER account.

**Request body:**
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "password": "MySecurePass1",
  "role": "VERIFIER"
}
```
**Safe response (201):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "full_name": "Jane Smith",
  "role": "VERIFIER",
  "is_active": true
}
```

### POST /api/v1/auth/login
Authenticate and receive a JWT.

**Request body:**
```json
{ "email": "jane@example.com", "password": "MySecurePass1" }
```
**Response (200):**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

### GET /api/v1/auth/me
Get the current authenticated user's profile.

**Header:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "full_name": "Jane Smith",
  "role": "VERIFIER",
  "is_active": true
}
```

## Organization Management & Super Admin Oversight

All routes under `/api/v1/admin/organizations` require a current `SUPER_ADMIN` account.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/organizations` | Paginated list; supports `page`, `limit`, `status`, `org_type`, `search`, `sort_by`, and `sort_order`. |
| `GET` | `/api/v1/admin/organizations/{id}` | Organization detail, associated users, and supporting-document metadata. |
| `POST` | `/api/v1/admin/organizations/{id}/suspend` | Suspend an `ACTIVE` organization; body requires `reason`. |
| `POST` | `/api/v1/admin/organizations/{id}/revoke` | Revoke an `ACTIVE` or `SUSPENDED` organization; body requires `reason`. |
| `POST` | `/api/v1/admin/organizations/{id}/restore` | Restore a `SUSPENDED` organization; body requires `reason`. |
| `POST` | `/api/v1/admin/organizations/{id}/reinstate` | Explicitly reinstate a `REVOKED` organization; body requires a detailed `reason`. |
| `GET` | `/api/v1/admin/organizations/{id}/history` | Paginated, read-only organization audit history. |

Issuers can read and update only their own organization profile at `/api/v1/organizations/{id}`. Profile updates accept an explicit allowlist; ownership, registration number, official email, and lifecycle status are not editable there. Profile changes require an active organization and create an audit event.

Issuers can list, upload, and download documents only for their own active organization. Uploads use `multipart/form-data` with `document_type` set to `PRIMARY` or `SUPPORTING` and a `file` part. The backend streams supported PDF, PNG, and JPEG files to private storage, validates the signature and configured size limit, and stores generated storage IDs and metadata in PostgreSQL. Super Admin document inspection remains available through the existing `/api/v1/admin/organizations/{id}/documents` endpoints. Legacy filename-only references are reported as `METADATA_ONLY` when no private file exists.

Set `STORAGE_DIR` to a private directory outside frontend/static roots when using a mounted storage volume. `MAX_ORGANIZATION_DOCUMENT_SIZE_BYTES` defaults to `10485760` (10 MiB). The Stage 2 schema migration is `a73d9f2c1e44`; inspect the configured database and resolve any duplicate organization registration numbers before applying `alembic upgrade head`.

---

## Required Environment Variables

| Variable | Description | Default (unsafe) |
|----------|-------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string (Psycopg 3) | local dev URL |
| `SECRET_KEY` | JWT signing secret (minimum 32 chars recommended) | **Change this!** |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` |
| `CORS_ORIGINS` | JSON array of allowed frontend origins | `["http://localhost:5173"]` |

---

## Security Measures Implemented
- ✅ Argon2id password hashing (OWASP 2023 parameters)
- ✅ Plaintext password never stored or returned
- ✅ Generic error for unknown email vs. wrong password (user-enumeration prevention)
- ✅ SUPER_ADMIN registration blocked on public signup
- ✅ JWT signed with configurable secret (HS256)
- ✅ Algorithm restriction on JWT decode
- ✅ User loaded fresh from PostgreSQL on every request (never from token claims)
- ✅ Email normalised to lowercase

## Known Limitations
- ⚠️ Login throttling is in-memory and per-process; use a distributed limiter or upstream rate limiting for multi-worker deployments.
- ⏳ Email OTP is implemented. Refresh tokens and password reset are outside the current backend scope.
