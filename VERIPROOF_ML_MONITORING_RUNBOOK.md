# VeriProof Production ML Monitoring & Operational Runbook

**Platform:** VeriProof Secure Digital Document Verification Platform  
**Operational Status:** Active Production Monitoring  
**Target Audience:** Site Reliability Engineers, ML Engineers, Security Operations Center (SOC)  
**Security Invariant:** Cryptographic verification is decoupled from and strictly precedes ML diagnostic telemetry.

---

## 1. Monitored Signals & Metrics Architecture

| Component | Monitored Metric | Normal Operational Range | Alert Threshold | Remediation / Action |
|---|---|---|---|---|
| **Image Forensics** | Inference Latency (p95) | < 150 ms | > 500 ms | Scale inference workers or enable cached thumbnail downscaling |
| **Image Forensics** | Feature Distribution PSI | < 0.10 (Stable) | PSI >= 0.25 (Significant Drift) | Review recent input document formats & scan resolutions |
| **Field Consistency** | Inconsistency Flag Rate | 5.0% - 15.0% | > 40.0% of verifications | Inspect upstream OCR engine quality & character noise |
| **Anomaly Scorer** | Challenge Rate / 1k Normal | < 5.0 / 1,000 | > 25.0 / 1,000 | Calibrate Tier 3 challenge threshold (-0.15 to -0.22) |
| **System Reliability** | ML Model Error Rate | 0.0% | > 1.0% | Inspect server memory, disk space, and corrupt file inputs |

---

## 2. Privacy & Data Protection Safeguards

- **Zero Document Storage in Telemetry:** Inference metrics collector buffers *only* numerical latencies, anonymized model scores, and error flags.
- **Redaction of PII:** Student names, registration IDs, and document byte payloads are NEVER logged or exported to observability collectors.
- **Key Safety:** Cryptographic signing keys, JWT tokens, and Neon DB credentials are strictly excluded from monitoring buffers.

---

## 3. Incident Investigation & Escalation Playbook

### Incident A: Sudden Spike in Image Forensics Tampering Scores
1. **Verify Authoritative Verification Outcome:**  
   Check if documents are failing SHA-256 hash or ECDSA signature checks. If hashes match and signatures are valid, the document is mathematically authentic.
2. **Check Image Noise & Resolution:**  
   Inspect if users are uploading heavily compressed social-media screenshots or scanned camera photos with low lighting (which trigger high ELA gradients).
3. **Drift Assessment:**  
   Execute `calculate_psi()` against the baseline distribution in `ml/reports/ml_evaluation_manifest_v2.json`.

### Incident B: ML Service Outage or Missing Model File
1. **Impact Assessment:**  
   Core platform continues to verify certificates using deterministic SHA-256 and ECDSA cryptographic checks.
2. **Recovery:**  
   Restore validated model artifacts from `ml/artifacts/models/registry.json` and verify SHA-256 checksums using `ModelRegistry.verify_checksum()`.
