# VeriProof Stage 2 Backend Audit

Audit date: 2026-10-09

This report covers the Stage 2 requirements visible in the supplied prompt. The pasted prompt ended partway through its database section; requirements beyond the received text were not assessed.

## Execution Summary

- Inspected the existing FastAPI routers, models, schemas, authorization dependencies, document service, Alembic history, tests, configuration, and backend README before editing.
- The project virtual environment's baseline suite passed: 70 tests.
- The final suite passed: 79 tests, using SQLite fixtures from a fresh temporary working directory.
- PostgreSQL migration upgrade and downgrade SQL both rendered offline successfully. No live migration was applied.
- No frontend files, authentication contracts, historical migrations, or existing records were changed.

## Requirement Classification

| Requirement | Classification | Evidence / result |
|---|---|---|
| OTP-backed Issuer signup and direct `ACTIVE` onboarding | Implemented and verified | Existing signup transaction creates user, organization, and audit event; existing test verifies `ACTIVE` and immediate login. |
| Three roles and current trusted identity | Implemented and verified | `get_current_user` loads the user from the database; public signup blocks `SUPER_ADMIN`. |
| Organization listing, filtering, detail, and admin-only access | Implemented and verified | Existing admin router and RBAC; added validated sorting, stable pagination, database-side counts, and associated Issuer summary. |
| Organization profile updates | Previously missing; implemented and tested | Added owner/admin profile read and allowlisted patch routes; Issuer updates require an active organization. Status, ownership, registration number, and official email are not mass-assignable. Profile changes are audited. |
| Issuer ownership and Verifier isolation | Partially defective; corrected and tested | `require_organization_access` previously accepted a Verifier with a matching organization ID. A regression reproduced this; the dependency now permits only Super Admin global access or Issuer own-organization access. |
| Suspend, revoke, restore, and explicit reinstatement | Implemented and hardened | Lifecycle actions use row locks, validate transitions/reasons, commit the status and audit event together, and use UTC-aware timestamps. Standard restore is SUSPENDED-only; revoked reinstatement remains a separate explicit action. |
| Immediate Issuer status enforcement | Partially implemented; completed for available routes | Active organization checks read current database state and lock the organization for mutations. New profile mutations and document operations require an active Issuer. Revoked organizations block existing tokens and new Issuer login. |
| Existing Issuer business-operation route coverage | Blocked by project surface | The current `/api/v1` router contains auth/admin routers but no Issuer document-issuance or other business-operation routers to audit or guard. The existing `require_active_issuer` dependency is available for those future routes. |
| Supporting-document storage and metadata | Previously metadata-only; implemented and tested | Added private streamed PDF/PNG/JPEG upload, signature and size validation, generated storage IDs, PostgreSQL metadata/digest, safe organization-scoped lookup, download, and cleanup if metadata commit fails. Legacy filename references remain honestly marked `METADATA_ONLY`. |
| Audit trail and organization history | Implemented and verified | Lifecycle/profile/document actions reuse `AuditEvent`; organization history is stable and paginated. |
| Database schema and migration | Implemented; live application not performed | Added revision `a73d9f2c1e44` for document metadata, registration uniqueness, and timezone-aware timestamps. Upgrade/downgrade SQL renders offline. Migration preflight refuses duplicate registration numbers; downgrade refuses to discard document metadata. |

## Access And Storage Details

- Super Admin organization oversight remains under `/api/v1/admin/organizations` and is protected at the router boundary.
- Issuer profile and document routes are under `/api/v1/organizations/{organization_id}` and enforce role plus organization ownership from the server-side user record.
- Verifiers cannot obtain organization access by supplying or matching an organization ID.
- Suspension/revocation no longer toggles every associated user's `is_active` flag. Organization status is enforced from current database state; reinstatement cannot accidentally reactivate a separately disabled user.
- Document files are placed in per-organization private directories using generated UUID storage names. Configured storage roots beneath `public` or `src/public` are rejected. Upload names are metadata only; client MIME types are not trusted.
- The existing frontend signup still sends document filenames as JSON references and does not call the new multipart document API. The frontend was left unchanged as required; wiring that client is outside this backend-only stage.

## Database And Verification Limits

- The configured target was identified without displaying credentials: environment `development`, local PostgreSQL database `veriproof`.
- Read-only inspection found Alembic revision `d91a27e43f5b` and zero organization rows/document references at audit time.
- No migration was applied to the configured database. The workspace does not provide a separate isolated PostgreSQL instance, so live PostgreSQL upgrade behavior and concurrent `FOR UPDATE` behavior remain unverified; SQLite tests do not prove PostgreSQL locking semantics.
- Existing legacy enum values and historical migration files were preserved. No data reset, status rewrite, database drop, or truncation was performed.
- The remaining test warnings concern the installed Starlette/httpx compatibility and SQLite's cyclic foreign-key teardown; all tests passed.