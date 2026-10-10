"""Tests for ML Production Monitoring, Statistical Drift (PSI/KS), and Privacy Guarantees."""

import numpy as np
import pytest

from ml.src.monitoring.drift_detector import calculate_psi, calculate_feature_drift_ks, ModelDriftMonitor
from ml.src.monitoring.metrics_collector import ProductionMLMetricsCollector, get_metrics_collector


def test_psi_stable_distribution():
    """Verify PSI reports STABLE when current distribution matches baseline."""
    np.random.seed(42)
    baseline = np.random.normal(0.5, 0.1, 1000)
    current = np.random.normal(0.5, 0.1, 1000)

    res = calculate_psi(baseline, current, num_buckets=10)
    assert res["status"] == "STABLE"
    assert res["alert"] is False
    assert res["psi"] < 0.10


def test_psi_detects_significant_drift():
    """Verify PSI flags SIGNIFICANT_DRIFT when distribution shifts drastically."""
    np.random.seed(42)
    baseline = np.random.normal(0.2, 0.05, 1000)
    current = np.random.normal(0.8, 0.05, 1000)  # Large shift

    res = calculate_psi(baseline, current, num_buckets=10)
    assert res["status"] == "SIGNIFICANT_DRIFT"
    assert res["alert"] is True
    assert res["psi"] >= 0.25


def test_ks_feature_drift():
    """Verify 2-sample Kolmogorov-Smirnov test detects shifted distributions."""
    np.random.seed(42)
    baseline = np.random.uniform(0, 10, 500)
    current_shifted = np.random.uniform(5, 15, 500)

    ks_res = calculate_feature_drift_ks(baseline, current_shifted)
    assert ks_res["drift_detected"] is True
    assert ks_res["status"] == "DRIFT_DETECTED"


def test_metrics_collector_zero_pii_exposure_and_latency():
    """Verify metrics collector aggregates latencies and errors without storing PII or document content."""
    collector = ProductionMLMetricsCollector()
    collector.reset()

    # Record simulated inferences
    collector.record_inference(task="image_forensics", duration_ms=45.2, score=0.12)
    collector.record_inference(task="image_forensics", duration_ms=52.8, score=0.88)
    collector.record_inference(task="image_forensics", duration_ms=40.0, is_error=False)
    collector.record_inference(task="anomaly_detection", duration_ms=12.1, score=-0.18, graduated_tier="tier_3_rate_limit")

    summary = collector.get_metrics_summary()

    assert summary["collector_status"] == "HEALTHY"
    assert summary["privacy_invariants_verified"] is True
    assert summary["pii_captured"] is False

    # Forensics task stats
    forensics_stats = summary["tasks"]["image_forensics"]
    assert forensics_stats["total_invocations"] == 3
    assert forensics_stats["total_errors"] == 0
    assert 40.0 <= forensics_stats["latency_ms"]["p50"] <= 52.8

    # Graduated challenges
    assert summary["graduated_challenges"]["tier_3_rate_limit"] == 1
