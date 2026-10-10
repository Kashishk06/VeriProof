# VeriProof — Neon-Derived Datasets

> **PRIVACY & COMPLIANCE MANDATE:**  
> This directory contains strictly privacy-minimized, read-only exports extracted from the VeriProof Neon PostgreSQL cloud database. In compliance with DPDP and GDPR guidelines, all personal identifiable information (PII), student records, representative names, emails, passwords, hashes, JWTs, and secret keys have been **strictly excluded**. Where database identifiers were exported, irreversible pseudonymization has been applied.

---

## 1. Directory Structure

```
datasets/neon_derived/
├── neon_schema_inventory.csv                  (93 rows — full database schema inventory & classification)
├── issuer_status_cases.csv                    (1 row — sanitized issuer lifecycle state)
├── verification_history_aggregates.csv        (5 rows — hourly aggregated audit event metrics)
├── README.md                                  (This governance and overview document)
└── DATA_DICTIONARY.md                         (Schema, types, and column definitions)
```

---

## 2. Extraction Scope & Status

### A. Full Schema Inventory (`neon_schema_inventory.csv`)
* **Scope:** 93 column records across all 6 public database tables (`registered_documents`, `users`, `organizations`, `organization_documents`, `audit_events`, `forensic_analyses`).
* **Classification:** Every column is classified for nullability, keys, sensitivity, and extraction eligibility.

### B. Issuer Status Cases (`issuer_status_cases.csv`)
* **Scope:** 1 sanitized organization record (`Educational Institution` in India).
* **Minimization:** Internal numeric IDs are pseudonymized (`ISSUER_PSEUDO_...`). Names, contact details, email addresses, and document URLs are completely excluded. Coarse date buckets are utilized.

### C. Verification History Aggregates (`verification_history_aggregates.csv`)
* **Scope:** 5 aggregated event clusters across coarse hourly buckets.
* **Minimization:** IP addresses, individual user IDs, and raw JSON payloads are excluded. Events are grouped at the platform level (`SYSTEM_ADMIN`, `REGISTRATION_LIFECYCLE`).

### D. Unpopulated Tables (`NOT_EXPORTED`)
* `registry_verification_cases.csv`: **NOT_EXPORTED**. The `registered_documents` table in Neon currently contains **0 records** (the platform is at the cold-start deployment stage; no digital certificates have been issued yet). In accordance with strict integrity rules, **no placeholder or fabricated records were created**.
* `forensic_analysis_cases.csv`: **NOT_EXPORTED**. The `forensic_analyses` table contains **0 records**.
