# VeriProof — Neon-Derived Datasets Data Dictionary

This document details the schema, data types, allowable values, and minimization transformations for all exported Neon datasets.

---

## 1. `neon_schema_inventory.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `schema_name` | `string` | Database namespace | `public` |
| `table_name` | `string` | Table name in PostgreSQL | `organizations`, `users`, `registered_documents`, `audit_events`, `forensic_analyses`, `organization_documents` |
| `column_name` | `string` | Field name in schema | e.g. `status`, `created_at`, `org_type` |
| `data_type` | `string` | PostgreSQL SQL data type | `VARCHAR(100)`, `INTEGER`, `TIMESTAMP`, `BOOLEAN`, `JSONB` |
| `is_primary_key` | `string` | Flag denoting primary key | `True`, `False` |
| `foreign_key_target` | `string` | Referenced parent table.column | e.g. `organizations.id` or empty string |
| `is_nullable` | `string` | Column nullability constraint | `True`, `False` |
| `table_row_count` | `string` | Current row count in table | e.g. `1`, `4`, `5`, `0` |
| `table_relevance` | `string` | Platform architectural domain | `issuer_registry`, `audit_workflow`, `verification_case`, `general_operational` |
| `is_sensitive_field` | `string` | Flag for credentials / PII | `True`, `False` |
| `extraction_eligibility` | `string` | Governance classification | `ELIGIBLE`, `EXCLUDED_SENSITIVE`, `ELIGIBLE_PSEUDONYMIZED`, `REVIEW_REQUIRED` |
| `eligibility_reason` | `string` | Rationale for extraction or exclusion | Privacy and security reasoning |

---

## 2. `issuer_status_cases.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `pseudonymized_issuer_id` | `string` | One-way salted hash of internal ID | `ISSUER_PSEUDO_<10 hex chars>` |
| `org_type` | `string` | Type of institutional entity | `Educational Institution`, `Government Agency`, `Corporate Entity` |
| `country` | `string` | Operating country | `India` |
| `state_region` | `string` | State or administrative region | `MP` |
| `issuer_status` | `string` | VeriProof lifecycle status | `ACTIVE`, `PENDING_REVIEW`, `SUSPENDED`, `REJECTED` |
| `status_reason` | `string` | Recorded reason for status | e.g. "Standard registration" |
| `effective_date_bucket` | `string` | Coarse registration date (day) | `YYYY-MM-DD` |
| `last_updated_date_bucket`| `string` | Coarse last update date (day) | `YYYY-MM-DD` |
| `consistency_status` | `string` | Status-lifecycle coherence check | `CONSISTENT_ACTIVE`, `PENDING_REVIEW` |
| `label_provenance` | `string` | Ground truth evidence source | `Explicitly stored database organization.status column` |
| `is_neon_derived` | `string` | Provenance marker | `True` |
| `extraction_timestamp` | `string` | UTC extraction timestamp | `YYYY-MM-DD HH:MM:SS` |

---

## 3. `verification_history_aggregates.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `time_bucket_hour` | `string` | Coarse hourly aggregation window | `YYYY-MM-DD HH:00:00+00` |
| `event_type` | `string` | Audit event classification | `ORGANIZATION_REGISTERED`, `SUPER_ADMIN_PROVISIONED`, `ISSUER_REGISTERED`, `VERIFIER_REGISTERED` |
| `event_count` | `integer` | Number of events in bucket | `1`, `2`, `5`, etc. |
| `workflow_category` | `string` | Platform workflow subsystem | `SYSTEM_ADMIN`, `REGISTRATION_LIFECYCLE` |
| `anonymized_scope` | `string` | Aggregation domain level | `PLATFORM_AGGREGATE` |
| `is_neon_derived` | `string` | Provenance marker | `True` |
| `extraction_timestamp` | `string` | UTC extraction timestamp | `YYYY-MM-DD HH:MM:SS` |
