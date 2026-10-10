# VeriProof — Bulk Operations Demo Runbook & User Guide

**Target Audience:** Hackathon Judges, Enterprise Issuers, Credential Verifiers, QA Teams  
**Module:** High-Throughput Bulk Processing & Ingestion Engine  
**Platform Version:** VeriProof v2.0 Production-Ready  
**Date:** October 10, 2026

---

## 1. Demo Scenario Overview

This runbook guides presenters through two primary enterprise workflows:
1. **Workflow A: Enterprise Issuer Bulk Registration** — Issuing, signing, and ledger-anchoring a batch of student diplomas/certificates with automated email dispatch.
2. **Workflow B: Credential Verifier Bulk Audit** — Batch-verifying incoming applicant documents against the cryptographic ledger while executing live AI/ML tampering and forensic analysis.

---

## 2. Workflow A: Bulk Document Registration (Issuer Flow)

### Step 1: Login as Authorized Issuer
1. Navigate to the VeriProof Login page (`http://localhost:5173/login`).
2. Log in using authorized issuer credentials:
   - **Email:** `sarah.chen@techcorp.com` (or demo issuer account)
   - **Role:** `ISSUER` (Organization: TechCorp / Stanford University)

### Step 2: Navigate to Bulk Registration
1. In the sidebar navigation under Issuer tools, click **"Bulk Registration"** (`/issuer/bulk-registration`).
2. The page displays the three-step batch issuance workflow:
   - **Step 1:** Download CSV Template or Prepare Batch Metadata.
   - **Step 2:** Upload Metadata CSV & Document ZIP Archive.
   - **Step 3:** Validate, Preview, and Execute Batch Issuance.

### Step 3: Download Template & Inspect Metadata
1. Click **"Download Sample CSV Template"**.
2. Open the downloaded CSV file (`veriproof_bulk_registration_template.csv`) to view the standard columns:
   ```csv
   RecipientName,RecipientId,RecipientEmail,DocumentTitle,DocumentType,IssueDate,ExpiryDate,Filename
   Alexandra Chen,STF-STU-88219,alex.chen@alumni.stanford.edu,Master of Science in Computer Science Degree,degree,2026-06-15,,degree_alex_chen.pdf
   Marcus Vance,MED-LIC-90924,m.vance@centralhealth.org,Certified Medical Practitioner License,license,2026-01-10,2028-01-10,lic_marcus_vance.pdf
   ```

### Step 4: Upload & Server Validation Preview
1. Drag and drop the metadata CSV and the corresponding document ZIP archive into the upload zone.
2. The system executes immediate server-side validation (`/api/v1/bulk/validate-registration`).
3. View the interactive preview table showing:
   - Valid rows vs invalid rows counter.
   - Per-row data validation badges.
   - Recipient email delivery preview status.

### Step 5: Execute Async Batch Registration
1. Click **"Start Batch Processing"**.
2. Watch the live progress bar advance in real-time as background workers:
   - Calculate SHA-256 digests.
   - Sign each document with ECDSA P-256 private keys.
   - Anchor records to the Neon PostgreSQL ledger.
   - Generate unique public verification IDs (`VP-2026-XXXXX`).
3. Review the completed summary with one-click export to CSV.

---

## 3. Workflow B: Bulk Document Verification (Verifier Flow)

### Step 1: Login as Credential Verifier
1. Navigate to `http://localhost:5173/login`.
2. Log in with verifier credentials:
   - **Email:** `marcus.verifier@globalverify.io`
   - **Role:** `VERIFIER`

### Step 2: Navigate to Bulk Verification
1. Click **"Bulk Verification"** in the sidebar navigation (`/verifier/bulk-verification`).
2. The batch verification dashboard displays overall verification metrics and the multi-document upload dropzone.

### Step 3: Ingest Verification Batch
1. Drag and drop candidate document files or upload a batch ZIP containing mixed documents (genuine diplomas, modified certificates, and unregistered files).
2. Click **"Execute Batch Verification"**.

### Step 4: Real-Time Multi-Signal Results Inspection
1. The batch results table displays real-time item status:
   - **`VERIFIED` (Green):** Cryptographic signature and SHA-256 hash match genesis ledger.
   - **`TAMPERED` (Red):** Hash divergence detected; ML forensic analysis flags localized manipulation artifacts.
   - **`UNVERIFIED` (Yellow):** Document signature not found in registry.
2. Click on any individual row to view the detailed **Document DNA & Forensic Breakdown** (tamper risk score, anomaly index, issuer identity, issuance timestamp).

### Step 5: Export Audit Report
1. Click **"Export Audit CSV"** to download the sanitized verification audit trail for enterprise record-keeping.

---

## 4. Troubleshooting & FAQ for Demo Presenters

- **Q: What happens if an invalid file is included in a ZIP?**
  - **A:** VeriProof processes all valid items and marks the invalid entry with clear error diagnostic codes without halting the batch.
- **Q: Are email notifications sent automatically?**
  - **A:** When enabled, the email dispatch service asynchronously delivers issuance notifications and verification links to recipient email addresses.
