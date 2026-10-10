"""Production Inference Services for VeriProof Document Intelligence."""

import os
import io
import time
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from PIL import Image

import numpy as np

from ml.src.config import load_config
from ml.src.model_registry import ModelRegistry
from ml.src.features.image_forensics import ImageForensicsExtractor
from ml.src.features.ocr_features import OCRConsistencyEngine
from ml.src.features.anomaly_features import AnomalyFeatureExtractor
from ml.src.monitoring.metrics_collector import get_metrics_collector

class ImageForensicsService:
    """Inference service for image manipulation detection, noise consistency, and ELA localization."""

    def __init__(self, model_registry: Optional[ModelRegistry] = None, config: Optional[Dict[str, Any]] = None):
        root = Path(__file__).resolve().parents[2]
        self.model_reg = model_registry or ModelRegistry(registry_dir=root / "ml" / "artifacts" / "models")
        self.config = config or load_config()
        self.extractor = ImageForensicsExtractor(
            ela_quality=self.config.get("tasks", {}).get("image_forensics", {}).get("ela_quality", 90),
            max_dimension=self.config.get("tasks", {}).get("image_forensics", {}).get("max_image_dimension", 2048)
        )
        self._model = None
        self._meta = None
        self._load_model()

    def _load_model(self):
        meta = self.model_reg.get_latest_model("image_forensics")
        if meta:
            self._model, self._meta = self.model_reg.load_model(meta)

    def analyze_image(self, image_input: Union[str, Path, bytes, Image.Image]) -> Dict[str, Any]:
        """Perform comprehensive forensic analysis returning scores, features, and localized bounding regions."""
        start_t = time.time()
        
        # 1. Feature Extraction
        features = self.extractor.extract_features(image_input)
        localization = self.extractor.localize_tampering(image_input)

        # 2. Model Inference
        if self._model is None:
            self._load_model()

        model_version = self._meta.get("version", "baseline_v1") if self._meta else "rule_heuristic_fallback"
        model_id = self._meta.get("model_id", "image_forensics_baseline") if self._meta else "heuristic"

        if self._model and self._meta:
            feature_names = self._meta.get("feature_names", list(features.keys()))
            vec = np.array([[features.get(k, 0.0) for k in feature_names]], dtype=np.float32)
            if hasattr(self._model, "predict_proba"):
                tamper_prob = float(self._model.predict_proba(vec)[0][1])
            else:
                tamper_prob = float(self._model.predict(vec)[0])
        else:
            # Fallback heuristic using ELA and noise measures
            tamper_prob = min(max(features["ela_mean_diff"] / 15.0 + (1.0 if features["resampling_indicator"] > 3.0 else 0.0) * 0.3, 0.05), 0.95)

        is_suspicious = tamper_prob >= self.config.get("tasks", {}).get("image_forensics", {}).get("decision_threshold", 0.50)
        
        warnings = []
        if is_suspicious:
            warnings.append(f"Elevated tampering anomaly probability ({tamper_prob:.2f}) detected by forensic classifier")
        if localization.get("has_tampering_regions"):
            warnings.append(f"Pixel-level ELA localization highlighted {localization['tampered_area_percent']}% of document area as potential splice/inpainting")
        if features.get("noise_snr_db", 30) < 15:
            warnings.append("Low signal-to-noise ratio in scanned document; high background compression noise")

        duration_ms = round((time.time() - start_t) * 1000, 2)

        try:
            get_metrics_collector().record_inference(
                task="image_forensics",
                duration_ms=duration_ms,
                score=tamper_prob
            )
        except Exception:
            pass

        return {
            "task": "image_forensics",
            "model_id": model_id,
            "model_version": model_version,
            "tamper_score": round(tamper_prob, 4),
            "is_suspicious": is_suspicious,
            "forensic_features": features,
            "localization": localization,
            "warnings": warnings,
            "duration_ms": duration_ms,
            "disclaimer": "Forensic scores represent statistical image-manipulation anomalies and must be corroborated by authoritative cryptographic verification."
        }

class FieldConsistencyService:
    """Inference service for OCR field-level cross-validation and chronological consistency."""

    def __init__(self, model_registry: Optional[ModelRegistry] = None, config: Optional[Dict[str, Any]] = None):
        root = Path(__file__).resolve().parents[2]
        self.model_reg = model_registry or ModelRegistry(registry_dir=root / "ml" / "artifacts" / "models")
        self.config = config or load_config()
        self.engine = OCRConsistencyEngine(
            fuzzy_threshold=self.config.get("tasks", {}).get("field_consistency", {}).get("hyperparameters", {}).get("fuzzy_match_threshold", 0.82)
        )
        self._model = None
        self._meta = None
        self._load_model()

    def _load_model(self):
        meta = self.model_reg.get_latest_model("field_consistency")
        if meta:
            self._model, self._meta = self.model_reg.load_model(meta)

    def verify_field(
        self,
        field_name: str,
        expected_value: str,
        extracted_value: str,
        ocr_confidence: float = 0.90,
        passing_year: Optional[int | str] = None,
        issue_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validate an individual field extraction against ground-truth and business logic."""
        start_t = time.time()
        eval_result = self.engine.evaluate_consistency(
            field_name=field_name,
            ground_truth_val=expected_value,
            ocr_extracted_val=extracted_value,
            ocr_confidence=ocr_confidence
        )

        # Cross-field chronological date check if provided
        if issue_date and passing_year:
            is_chrono_ok, chrono_msg = self.engine.validate_date_chronology(passing_year, issue_date)
            if not is_chrono_ok:
                eval_result["warnings"].append(chrono_msg)
                eval_result["is_consistent"] = False
                eval_result["classification"] = "INCONSISTENT_SUSPECT_TAMPERING"

        model_version = self._meta.get("version", "rule_engine_v1") if self._meta else "rule_engine"

        duration_ms = round((time.time() - start_t) * 1000, 2)
        eval_result["duration_ms"] = duration_ms
        eval_result["model_version"] = model_version

        try:
            get_metrics_collector().record_inference(
                task="field_consistency",
                duration_ms=duration_ms,
                score=1.0 if eval_result.get("is_consistent") else 0.0
            )
        except Exception:
            pass

        return eval_result

class AnomalyDetectionService:
    """Inference service for platform event velocity, brute-force bursts, and credential tampering."""

    def __init__(self, model_registry: Optional[ModelRegistry] = None, config: Optional[Dict[str, Any]] = None):
        root = Path(__file__).resolve().parents[2]
        self.model_reg = model_registry or ModelRegistry(registry_dir=root / "ml" / "artifacts" / "models")
        self.config = config or load_config()
        self.extractor = AnomalyFeatureExtractor()
        self._model = None
        self._meta = None
        self._load_model()

    def _load_model(self):
        meta = self.model_reg.get_latest_model("anomaly_detection")
        if meta:
            self._model, self._meta = self.model_reg.load_model(meta)

    def score_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Score a platform telemetry verification event."""
        start_t = time.time()
        vec = self.extractor.extract_event_features(event_data)
        rule_eval = self.extractor.evaluate_rule_heuristics(event_data)

        if self._model is None:
            self._load_model()

        model_version = self._meta.get("version", "heuristic_v1") if self._meta else "rule_heuristic"
        model_id = self._meta.get("model_id", "isolation_forest") if self._meta else "rule_heuristic"

        if self._model:
            score = float(self._model.decision_function(vec.reshape(1, -1))[0])
            pred = int(self._model.predict(vec.reshape(1, -1))[0]) # -1 = outlier, 1 = inlier
            is_anomaly = (pred == -1) or rule_eval["has_rule_flags"]
        else:
            score = -0.2 if rule_eval["has_rule_flags"] else 0.5
            is_anomaly = rule_eval["has_rule_flags"]

        duration_ms = round((time.time() - start_t) * 1000, 2)

        tier = "tier_0_normal"
        if score < -0.22:
            tier = "tier_4_escalate"
        elif score < -0.15:
            tier = "tier_3_rate_limit"
        elif score < -0.08:
            tier = "tier_2_risk_check"
        elif score < -0.02:
            tier = "tier_1_log"

        try:
            get_metrics_collector().record_inference(
                task="anomaly_detection",
                duration_ms=duration_ms,
                score=score,
                graduated_tier=tier if tier != "tier_0_normal" else None
            )
        except Exception:
            pass

        return {
            "task": "anomaly_detection",
            "model_id": model_id,
            "model_version": model_version,
            "anomaly_score": round(score, 4),
            "is_anomalous": is_anomaly,
            "graduated_tier": tier,
            "rule_flags": rule_eval["triggered_rules"],
            "severity": rule_eval["severity"] if is_anomaly else "NORMAL",
            "duration_ms": duration_ms,
            "disclaimer": "Anomaly scores represent verification behavioral deviations and do not constitute legal proof of malicious action."
        }

class CryptographicVerificationService:
    """Deterministic cryptographic validation service for SHA-256 and ECDSA signatures."""

    @staticmethod
    def verify_document_digest(document_bytes: bytes, expected_sha256: str) -> Dict[str, Any]:
        """Compute SHA-256 digest of document bytes and compare against expected hash."""
        computed_hash = hashlib.sha256(document_bytes).hexdigest()
        is_match = (computed_hash.lower() == expected_sha256.strip().lower())
        
        return {
            "task": "cryptographic_digest_verification",
            "expected_sha256": expected_sha256.lower(),
            "calculated_sha256": computed_hash.lower(),
            "is_valid": is_match,
            "status": "VERIFIED" if is_match else "TAMPERED_HASH_MISMATCH",
            "algorithm": "SHA-256"
        }
