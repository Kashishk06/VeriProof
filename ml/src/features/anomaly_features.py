"""Behavioral and telemetry anomaly feature engineering module."""

from typing import Any, Dict, List, Optional
import numpy as np

class AnomalyFeatureExtractor:
    """Extracts privacy-minimized behavioral feature vectors from platform events."""

    FEATURE_NAMES = [
        "verification_requests_last_hour",
        "consecutive_failed_checks",
        "burst_request_rate_per_sec",
        "time_of_day_anomaly_score",
        "metadata_tampering_score",
    ]

    def extract_event_features(self, event_data: Dict[str, Any]) -> np.ndarray:
        """Transform raw event payload into a standardized numerical feature vector."""
        req_last_hour = float(event_data.get("verification_requests_last_hour", 0.0))
        failed_checks = float(event_data.get("consecutive_failed_checks", 0.0))
        burst_rate = float(event_data.get("burst_request_rate_per_sec", 0.0))
        time_anomaly = float(event_data.get("time_of_day_anomaly_score", 0.0))
        meta_tamper = float(event_data.get("metadata_tampering_score", 0.0))

        vec = np.array([
            req_last_hour,
            failed_checks,
            burst_rate,
            time_anomaly,
            meta_tamper
        ], dtype=np.float32)
        
        return vec

    def evaluate_rule_heuristics(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply transparent rule-based heuristics for baseline anomaly flagging."""
        triggered_rules = []
        is_suspicious = False

        req_last_hour = float(event_data.get("verification_requests_last_hour", 0.0))
        failed_checks = int(event_data.get("consecutive_failed_checks", 0))
        burst_rate = float(event_data.get("burst_request_rate_per_sec", 0.0))
        issuer_status = str(event_data.get("issuer_revocation_status", "active")).lower()

        if issuer_status == "revoked":
            triggered_rules.append("CRITICAL: Verification requested against revoked issuing authority")
            is_suspicious = True

        if failed_checks >= 5:
            triggered_rules.append(f"HIGH: Rapid failure threshold exceeded ({failed_checks} consecutive failed checks)")
            is_suspicious = True

        if burst_rate > 10.0:
            triggered_rules.append(f"MEDIUM: High burst velocity detected ({burst_rate:.1f} req/sec)")
            is_suspicious = True

        if req_last_hour > 200.0:
            triggered_rules.append(f"LOW: Unusual hourly volume spike ({int(req_last_hour)} requests/hr)")

        return {
            "has_rule_flags": is_suspicious,
            "triggered_rules": triggered_rules,
            "severity": "HIGH" if failed_checks >= 5 or issuer_status == "revoked" else ("MEDIUM" if burst_rate > 10.0 else "LOW")
        }
