# Stage 3: Document Registry and Protection Report

## 1. Repository Audit

The repository already contained a substantial document-registry implementation. The `RegisteredDocument` SQLAlchemy model, registry migration, private file-storage service, ECDSA manifest service, issuer/public/admin FastAPI endpoints, and React registry pages were present. Rebuilding these would have duplicated existing code, so this stage validated and completed the existing path.

The workspace root has no `.git` directory, so `git status`/diff inspection was unavailable. No existing database records were reset or deleted. Tests used isolated SQLite databases and temporary file storage.

## 2. Files Changed

- `backend/app/core/config.py`: added optional trusted public-key ring setting.
- `backend/app/services/document_crypto_service.py`: resolve verification keys by configured key ID; verify the active public-key configuration matches the signing key before returning a signature.
- `backend/app/api/v1/documents.py`: verify records with a trusted key rather than trusting the key stored in the same database record; report missing trust/filesystem evidence as inconclusive; preserve nullable hash/signature results.
- `backend/app/schemas/documents.py`: allow nullable integrity-check fields for inconclusive verification.
- `backend/.env.example`: documented the optional public-key ring for key rotation.
- `backend/tests/test_organization_oversight.py`: added forged-record-key coverage and corrected the cross-organization list assertion for inactive-organization lifecycle behavior.
- `src/utils/documentRegistryApi.ts`: updated integrity result types to preserve inconclusive states.
- `src/context/AppContext.tsx`: authenticated issuer/admin document state no longer falls back to cached demo records when the API fails; it exposes load state/errors and backend totals.
- `src/hooks/useIssuerDocuments.ts`: fetches all pages from the paginated issuer registry endpoint.
- `src/pages/Issuer/OverviewPage.tsx`: uses backend registry totals and surfaces loading/errors.
- `src/pages/Issuer/DocumentProtectionPage.tsx`: displays P-256 accurately and reports hash/signature states from the API instead of hardcoding a successful hash match.
- `src/pages/PublicVerification/index.tsx`: shows an explicit loading state before presenting a verdict.
- `src/pages/SuperAdmin/DashboardPage.tsx` and `src/pages/SuperAdmin/OverviewPage.tsx`: document totals now come from the registry API; unsupported forensic flag counts are not fabricated.
- `backend/STAGE_3_DOCUMENT_REGISTRY_PROTECTION_REPORT.md`: this report.

## 3. Existing Implementation Reused

- `User`, `Organization`, `RegisteredDocument`, and `AuditEvent` ORM models and their ownership relationships.
- Existing authentication, JWT, `require_active_issuer`, and Super Admin role enforcement.
- Private document storage and upload validation in `app/services/document_service.py`.
- ECDSA/QR utilities in `app/services/document_crypto_service.py`.
- Existing document APIs and `admin/documents` oversight endpoint.
- Existing React API client, AuthContext, issuer document pages, public-verification page, and Super Admin oversight pages.

## 4. Model and Migration

`RegisteredDocument` already persists an internal UUID, unique public verification ID, title/type, organization and issuer ownership, recipient metadata, private storage key, content type and size, SHA-256, ECDSA signature, signing key ID, public key, canonical manifest, status, issue/expiry/revocation data, version linkage, and timestamps. It has foreign keys, public-ID/storage-key uniqueness, hash/organization/issuer/status indexes, and status/version/size/hash/expiry checks. Binary document contents are stored outside PostgreSQL.

No new schema migration was necessary for this completion pass: the required registry schema was already introduced by revision `cc341afe9c2a` and the current changes do not add database columns. The revision chain is continuous, with `cc341afe9c2a` as the only head. Against the configured local PostgreSQL target, `alembic upgrade head` completed, `alembic current` reported `cc341afe9c2a (head)`, and the live `registered_documents` table, columns, indexes, and uniqueness constraints were inspected.

The existing downgrade refuses to drop registry records when rows exist, preserving data rather than silently deleting issued credentials. Downgrade was not run against the configured database.

## 5. API Contract

All routes are under `/api/v1`:

- `POST /documents/register`: authenticated ACTIVE-organization issuer; multipart metadata plus `file`; server validates/stores/hashes/signs and commits the record and audit event before returning its internal ID, public ID, status, verification URL, QR data URL, and integrity results.
- `GET /documents/my`: issuer organization-scoped list with status filter and page/limit pagination.
- `GET /documents/{document_id}`: authorized issuer/admin details.
- `GET /documents/{document_id}/download`: authorized download after stored-byte hash and signature checks.
- `POST /documents/{document_id}/revoke`: authorized issuer/admin revocation with required reason and audit event.
- `GET /documents/{document_id}/history`: authorized persisted document audit history.
- `GET /verify/{public_verification_id}`: public registry verification.
- `POST /verify/{public_verification_id}/compare`: public multipart comparison; the server hashes the uploaded bytes.
- `GET /admin/documents`: Super Admin registry search, filtering, pagination, and status counts.

Private responses omit filesystem paths and storage keys. Public verification omits recipient contact data, issuer notes, revocation reasons, and internal audit data. Unknown IDs return `UNVERIFIED`; status revocation returns `REVOKED`; a trusted record with demonstrably mismatched bytes or invalid cryptographic evidence returns `TAMPERED`; missing evidence/trusted key returns `UNVERIFIED`; expiry is checked against the stored expiry policy.

## 6. Manifest and Key Trust

The manifest is schema version 1. It binds the internal document ID, public verification ID, organization ID, SHA-256, issue date/time, expiry, signature algorithm, and signing key ID. It is serialized as UTF-8 JSON with sorted keys and compact separators before ECDSA P-256/SHA-256 signing.

Verification now resolves the public key by `signing_key_id`. `DOCUMENT_SIGNING_PUBLIC_KEYS_JSON` can hold a JSON map of key IDs to PEM public keys for retained keys/rotation. Without a key ring, the configured active key ID resolves from the existing persistent private key; an unknown key ID is not trusted merely because a matching public key was stored in the record. A mismatched active public-key configuration fails signing rather than reporting a valid protection result.

The private key is never returned to the frontend. The existing development behavior may create one persistent local key if absent; non-development environments fail when the private key is missing. Production KMS/HSM integration and key custody policy are not implemented here and remain deployment responsibilities.

## 7. Storage, QR, and Public Verification

Uploads are stored under the private backend storage root (configurable with `STORAGE_DIR`, defaulting to `backend/storage/documents`), outside frontend public assets. Storage uses generated UUID keys, organization isolation, temporary-file replacement/cleanup, byte streaming, and extension plus file-signature validation. Supported content is PDF, PNG, and JPEG; `MAX_DOCUMENT_SIZE_BYTES` defaults to 15 MiB. No uploaded file is exposed through static hosting.

QR codes point to `${PUBLIC_FRONTEND_URL}/verify/{public_verification_id}` and contain only the public verification URL. The QR is a lookup aid, not proof by itself. Public verification rereads and hashes the stored file, reconstructs the canonical manifest, resolves the trusted key, verifies the signature, and checks registry state. Comparison uploads are hashed server-side and are size/type validated. Public endpoints use the existing per-process rate limiter; it is not distributed across multiple workers.

## 8. Frontend Integration

- Issuer registration sends multipart data to the live registration API and presents success only after a successful response.
- Issuer documents, history, protection, and revoke workflows use persisted registry APIs; the shared hook consumes all issuer pages.
- Super Admin document oversight and Trusted Registry document views use the protected, paginated database endpoint.
- Issuer and Super Admin overview document totals come from API totals; authenticated context no longer restores demo document records on an API failure.
- Public verification consumes the public API and displays an explicit loading state. A browser smoke test reached the API and rendered an unknown identifier as `UNVERIFIED`.
- The email-delivery button remains explicitly unavailable because no protected-document email endpoint exists.
- Unrelated verifier forensic/demo pages, organization demo analytics, and localStorage features were not broadly removed or rebuilt.

## 9. Validation Results

- Backend full suite: `84 passed, 4 warnings` in 51.60s. These tests use isolated SQLite databases; they are not PostgreSQL integration tests.
- Focused registry suite: `5 passed, 2 warnings` in 2.46s, including the attacker-controlled embedded-key regression.
- Frontend: `npm run build` succeeded (TypeScript and Vite). Vite reports the existing large-chunk warning (>500 kB).
- PostgreSQL: connectivity check returned `SELECT 1`; `alembic upgrade head` completed; `alembic current` and `alembic heads` both reported `cc341afe9c2a`; the live registry table and indexes were inspected. Functional document registration tests were not run against the configured PostgreSQL database to avoid writing test records there.
- Browser smoke: public verification route loaded and displayed the API result `UNVERIFIED` for an unknown ID. The alternate test origin needed a process-only CORS override; no `.env` credentials or settings were changed.
- No frontend unit-test script or dedicated PostgreSQL pytest suite is defined in `package.json`/the backend test setup.

Warnings observed: Starlette’s `httpx` TestClient deprecation and SQLite foreign-key-cycle `drop_all` warnings in existing test fixtures.

## 10. Configuration and Local Commands

Backend PowerShell commands (from repository root):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -c "from sqlalchemy import create_engine, text; from app.core.config import settings; c=create_engine(settings.DATABASE_URL).connect(); print(c.execute(text('SELECT 1')).scalar()); c.close()"
python -m alembic upgrade head
```

Bootstrap an administrator only if one does not already exist:

```powershell
.\.venv\Scripts\python.exe bootstrap_admin.py
```

Start the backend and run tests:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
.\.venv\Scripts\python.exe -m pytest -q
```

In a second PowerShell terminal, from the repository root, start the frontend:

```powershell
npm install
npm run dev
```

The current Vite proxy targets `http://127.0.0.1:8000`; the default CORS origins include the standard local frontend ports. For a different direct frontend origin, configure `CORS_ORIGINS` in the backend environment to that exact origin. For example, a temporary test process can use:

```powershell
$env:CORS_ORIGINS='["http://127.0.0.1:5175"]'
```

Relevant configuration: `DATABASE_URL`, `CORS_ORIGINS`, `PUBLIC_FRONTEND_URL`, `STORAGE_DIR`, `MAX_DOCUMENT_SIZE_BYTES`, `DOCUMENT_SIGNING_PRIVATE_KEY_PATH`, `DOCUMENT_SIGNING_KEY_ID`, `DOCUMENT_SIGNING_PUBLIC_KEYS_JSON`, and public verification/comparison rate limits. Keep private signing keys and `.env` files out of source control.

## 11. Remaining Limitations

- PostgreSQL schema/migration state was verified, but functional registration/revocation was not written to the configured PostgreSQL database; functional pytest coverage used SQLite.
- Production key management is still a persistent PEM file/configuration concern rather than a KMS/HSM integration.
- The rate limiter is in-process and must be replaced/shared for multi-worker production deployments.
- Forensic/AI flags are not supplied by the registry API and are deliberately not presented as registry-backed verification evidence.
- Email delivery for protected documents is not implemented; the UI states that limitation.
