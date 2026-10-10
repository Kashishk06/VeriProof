# VeriProof — Synthetic Datasets Data Dictionary

This document details the exact schema, data types, allowable values, and semantic definitions for all generated synthetic CSV files.

---

## 1. `document_forensics_features.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `document_id` | `string` | Unique synthetic document identifier | `SYNTH_DOC_00001` – `SYNTH_DOC_01500` |
| `source_group_id` | `string` | Template/institution grouping ID | `GRP_001` – `GRP_150` (10 docs per group) |
| `institution_name` | `string` | Fictional educational institution | e.g. "Apex Institute of Advanced Technology (Fictional)" |
| `document_category` | `string` | Academic certificate classification | `degree_certificate`, `provisional_certificate`, `consolidated_marksheet`, `diploma_certificate` |
| `manipulation_category`| `string` | Exact synthetic manipulation type | `genuine_pristine`, `benign_scan_resample`, `benign_jpeg_compression`, `copy_move_seal`, `spliced_signature`, `grade_text_replacement`, `qr_code_substitution` |
| `label` | `string` | Binary forensic authenticity label | `authentic`, `tampered` |
| `label_reason` | `string` | Narrative explanation of forensic condition | e.g. "Localized copy-move forgery: gold institutional seal duplicated across coordinates" |
| `width` | `integer` | Image width in pixels | `2480` |
| `height` | `integer` | Image height in pixels | `3508` |
| `aspect_ratio` | `float` | Aspect ratio (`width / height`) | `0.7069` |
| `estimated_jpeg_quality`| `integer`| Estimated compression quality | `70` – `98` |
| `resampling_indicator` | `float` | Estimated periodic interpolation index | `0.0` – `1.0` |
| `blur_laplacian_var` | `float` | Variance of Laplacian edge filter | `110.0` – `560.0` |
| `noise_snr_db` | `float` | Estimated signal-to-noise ratio in decibels | `15.0` – `48.0` dB |
| `ela_mean_diff` | `float` | Mean absolute error under 90% recompression | `1.0` – `22.0` |
| `ela_max_diff` | `float` | Peak localized error under recompression | `8.0` – `95.0` |
| `edge_density` | `float` | Canny/Sobel edge pixel fraction | `0.04` – `0.12` |
| `color_channel_var_ratio`| `float`| Ratio of RGB channel variance | `0.92` – `1.45` |
| `exif_metadata_consistency`| `string`| EXIF metadata integrity status | `consistent`, `stripped`, `inconsistent_editor_signature` |
| `feature_measurement_type`| `string`| Measurement provenance | `simulated_forensic_profile` |
| `is_synthetic` | `boolean` | Flag denoting synthetic data | `True` |
| `provenance_marker` | `string` | Traceable generation identifier | `VeriProof_Synthetic_v1_Seed_42071` |
| `generation_seed` | `integer` | Random seed used for generation | `42071` |

---

## 2. `ocr_field_consistency.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `case_id` | `string` | Unique test case identifier | `OCR_CASE_00001` – `OCR_CASE_01200` |
| `document_id` | `string` | Reference to synthetic document | `SYNTH_DOC_00001` – `SYNTH_DOC_01500` |
| `source_group_id` | `string` | Template grouping identifier | `GRP_001` – `GRP_150` |
| `field_name` | `string` | Extracted certificate field | `student_name`, `roll_number`, `cgpa_score`, `passing_year`, `issue_date` |
| `ground_truth_value`| `string` | Fictional ground truth text | e.g. "Aarav Sharma", "VU-2023-14921", "8.74" |
| `ocr_extracted_value`| `string`| Simulated raw OCR reading | e.g. "A@r@v Sh@rm@.", "VU-2O23-I492I", "9.95" |
| `ocr_confidence` | `float` | Model confidence score (0.0 to 1.0) | `0.40` – `0.99` |
| `ocr_error_type` | `string` | Type of character/parsing distortion | `none`, `character_substitution`, `punctuation_noise`, `segmentation_noise`, `deliberate_forgery` |
| `field_format_valid`| `string` | Regex format match | `True`, `False` |
| `date_logical_consistency`| `string`| Chronological integrity check | `consistent`, `inconsistent_issued_before_passing`, `not_applicable` |
| `cross_field_consistency`| `string`| Agreement across document fields | `consistent`, `cgpa_total_mismatch`, `roll_year_conflict`, `passing_issue_date_conflict`, `cross_field_name_mismatch` |
| `consistency_classification`| `string`| Multi-class audit category | `CONSISTENT`, `BENIGN_OCR_NOISE`, `AMBIGUOUS`, `INCONSISTENT_SUSPECT_TAMPERING` |
| `label_reason` | `string` | Narrative explanation of classification | e.g. "Benign character substitution noise due to stylized font; document remains authentic" |
| `is_synthetic` | `boolean` | Synthetic marker | `True` |
| `provenance_marker` | `string` | Generation provenance | `VeriProof_Synthetic_v1_Seed_42071` |
| `generation_seed` | `integer` | Seed number | `42072` |

---

## 3. `image_forensics_features.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `image_id` | `string` | Unique image identifier | `synth_img_0001` – `synth_img_0120` |
| `relative_path` | `string` | Relative path to image file | `image_forensics/images/<filename>.png` |
| `source_group_id` | `string` | Template/institution group | `IMG_GRP_001` – `IMG_GRP_020` |
| `document_category` | `string` | Document type | `academic_certificate` |
| `manipulation_type` | `string` | Exact transformation applied | `genuine_pristine`, `genuine_distorted_blur`, `genuine_distorted_jpeg`, `tampered_copy_move_seal`, `tampered_spliced_signature`, `tampered_grade_text_replace` |
| `label` | `string` | Binary forensic label | `authentic`, `tampered` |
| `width` | `integer` | Width in pixels | `1000` |
| `height` | `integer` | Height in pixels | `700` |
| `file_size_bytes` | `integer` | File size on disk | `~50,000` – `~150,000` bytes |
| `file_extension` | `string` | File extension | `png` |
| `has_groundtruth_mask`| `string` | Presence of pixel mask | `True`, `False` |
| `mask_relative_path`| `string` | Relative path to binary mask | `image_forensics/masks/<id>_mask.png` or empty string |
| `tampered_pixel_count`| `integer`| Number of altered pixels (from mask) | `0` (authentic) or `10,000` – `35,000` |
| `tamper_area_percent`| `float` | Percentage of altered area | `0.0%` (authentic) or `1.5%` – `5.0%` |
| `measured_mean_intensity`| `float`| Mean grayscale intensity (measured) | `~245.0` – `~252.0` |
| `measured_laplacian_var`| `float` | Edge Laplacian variance (measured) | `~120.0` – `~420.0` |
| `is_synthetic` | `boolean` | Synthetic marker | `True` |
| `provenance_marker` | `string` | Generation provenance | `VeriProof_Synthetic_v1_Seed_42071` |
| `note` | `string` | Qualitative forensic description | Specific details of transformation |

---

## 4. `anomaly_detection_features.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `event_id` | `string` | Verification event identifier | `ANOM_EVT_00001` – `ANOM_EVT_01000` |
| `entity_id` | `string` | Fictional verifier organization ID | `VERIFIER_ORG_001` – `VERIFIER_ORG_040` |
| `document_id` | `string` | Fictional target document ID | `SYNTH_DOC_00001` – `SYNTH_DOC_01500` |
| `verification_requests_last_hour`| `integer`| Rolling hourly verification volume | `1` – `900` |
| `consecutive_failed_checks`| `integer`| Consecutive verification failures | `0` – `35` |
| `ip_geolocation_country_switch`| `string`| Geo-IP anomaly detected | `True`, `False` |
| `burst_request_rate_per_sec`| `float` | Peak queries per second | `0.05` – `45.0` |
| `time_of_day_anomaly_score`| `float` | Deviation from organization operating hours | `0.0` – `1.0` |
| `issuer_revocation_status`| `string`| Status of issuer authority key | `active`, `compromised_key` |
| `metadata_tampering_score`| `float` | Document metadata anomaly score | `0.01` – `0.94` |
| `cryptographic_proof_valid`| `string`| Signature / Merkle proof outcome | `True`, `False` |
| `behavior_classification`| `string`| Behavioral profile classification | `NORMAL_VERIFICATION`, `BENIGN_HIGH_VOLUME`, `SUSPICIOUS_BRUTE_FORCE`, `ANOMALOUS_ISSUER_STATUS` |
| `anomaly_reason` | `string` | Narrative explanation of event context | e.g. "Authorized scheduled batch background verification during corporate hiring audit" |

---

## 5. `cryptographic_verification_cases.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `case_id` | `string` | Unique test case identifier | `CRYPTO_CASE_001` – `CRYPTO_CASE_100` |
| `scenario_name` | `string` | Cryptographic scenario tested | `valid_hash_and_signature`, `byte_alteration_hash_mismatch`, `corrupted_signature_bytes`, `wrong_authority_public_key`, `revoked_issuer_key`, `unknown_registry_record`, `expired_validity_record` |
| `payload_bytes_len` | `integer`| Payload byte length | `56` – `70` bytes |
| `recorded_sha256` | `string` | Staged ledger SHA-256 hash | 64-char hex string |
| `calculated_sha256` | `string` | Computed SHA-256 hash | 64-char hex string |
| `hash_match` | `string` | Hash comparison result | `True`, `False` |
| `key_algorithm` | `string` | Elliptic curve algorithm | `ECDSA_SECP256R1` |
| `signature_valid` | `string` | Mathematical ECDSA verification result | `True`, `False` |
| `issuer_registry_status`| `string`| Status in simulated trust registry | `active`, `revoked_key`, `unknown_unregistered`, `expired_validity` |
| `expected_policy_outcome`| `string`| Expected test result | `VERIFIED`, `HASH_MISMATCH`, `INVALID_SIGNATURE`, `KEY_MISMATCH`, `REVOKED_ISSUER`, `UNKNOWN_REGISTRY`, `EXPIRED_RECORD` |
| `actual_policy_outcome`| `string`| Observed test result | Identical to expected outcome |
| `test_assertion_result`| `string`| Executable assertion outcome | `PASS` (100% of cases) |

---

## 6. `model_evaluation_cases.csv`

| Column | Type | Description | Allowed / Example Values |
|---|---|---|---|
| `eval_case_id` | `string` | Unique held-out evaluation ID | `EVAL_CASE_0001` – `EVAL_CASE_0500` |
| `eval_group_id` | `string` | Held-out group ID (strictly disjoint from train) | `EVAL_GRP_001` – `EVAL_GRP_050` |
| `subsystem_target` | `string` | Target VeriProof subsystem evaluated | `pixel_forensics`, `ocr_field_consistency`, `behavioral_anomaly` |
| `document_category` | `string` | Document category | `degree_certificate`, `marksheet`, `provisional_diploma` |
| `ground_truth_label`| `string` | Subsystem target label | Task-specific labels |
| `ground_truth_reason`| `string`| Narrative justification | e.g. "Held-out evaluation: authentic certificate template with unseen seal layout" |
| `evaluation_split` | `string` | Split marker | `HELD_OUT_TEST_EVALUATION` |
| `generation_seed` | `integer` | Separate evaluation seed | `98123` |
| `provenance_marker` | `string` | Provenance identifier | `VeriProof_Synthetic_v1_EvalSeed_98123` |
