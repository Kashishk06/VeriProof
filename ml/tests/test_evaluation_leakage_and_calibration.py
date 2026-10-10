"""Tests for Leakage Detection, Wilson Confidence Intervals, and Calibration Utilities."""

import tempfile
import csv
from pathlib import Path
import numpy as np
import pytest
from sklearn.ensemble import RandomForestClassifier

from ml.src.evaluation.leakage_analysis import DatasetLeakageAuditor
from ml.src.evaluation.forensics_evaluator import wilson_score_interval, ImageForensicsEvaluator
from ml.src.evaluation.field_consistency_evaluator import FieldConsistencyEvaluator
from ml.src.evaluation.anomaly_evaluator import AnomalyChronologicalEvaluator


def test_leakage_auditor_detects_group_overlap():
    """Verify that DatasetLeakageAuditor flags overlapping group IDs between train and test splits."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_file = Path(tmp_dir) / "leaky_split.csv"
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["split", "source_group_id", "image_id"])
            writer.writeheader()
            writer.writerow({"split": "train", "source_group_id": "GRP_001", "image_id": "img_1"})
            writer.writerow({"split": "train", "source_group_id": "GRP_002", "image_id": "img_2"})
            # Leakage: GRP_001 in test!
            writer.writerow({"split": "test", "source_group_id": "GRP_001", "image_id": "img_3"})
            writer.writerow({"split": "test", "source_group_id": "GRP_003", "image_id": "img_4"})

        auditor = DatasetLeakageAuditor(workspace_root=Path(tmp_dir))
        res = auditor.audit_csv_group_leakage(csv_file)
        
        assert res["status"] == "LEAKAGE_DETECTED"
        assert res["is_leakage_free"] is False
        assert "test_vs_train" in res["overlapping_groups"]
        assert "GRP_001" in res["overlapping_groups"]["test_vs_train"]


def test_leakage_auditor_passes_clean_splits():
    """Verify that clean, disjoint groups pass group leakage checks."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_file = Path(tmp_dir) / "clean_split.csv"
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["split", "source_group_id", "image_id"])
            writer.writeheader()
            writer.writerow({"split": "train", "source_group_id": "GRP_001", "image_id": "img_1"})
            writer.writerow({"split": "val", "source_group_id": "GRP_002", "image_id": "img_2"})
            writer.writerow({"split": "test", "source_group_id": "GRP_003", "image_id": "img_3"})

        auditor = DatasetLeakageAuditor(workspace_root=Path(tmp_dir))
        res = auditor.audit_csv_group_leakage(csv_file)
        
        assert res["status"] == "PASSED"
        assert res["is_leakage_free"] is True
        assert len(res["overlapping_groups"]) == 0


def test_wilson_confidence_interval():
    """Verify Wilson score confidence interval mathematical bounds."""
    # 18 out of 18 correct
    ci_low, ci_high = wilson_score_interval(18, 18, confidence=0.95)
    assert 0.80 <= ci_low <= 0.85
    assert ci_high == 1.0

    # 50 out of 100
    ci_low, ci_high = wilson_score_interval(50, 100, confidence=0.95)
    assert 0.40 <= ci_low <= 0.45
    assert 0.55 <= ci_high <= 0.61

    # Edge cases
    assert wilson_score_interval(0, 0) == (0.0, 0.0)


def test_field_consistency_threshold_calibration_on_validation_data():
    """Verify offline threshold calibration sweeps and selects optimal candidate under precision constraint."""
    # Create synthetic validation features
    np.random.seed(42)
    n_samples = 100
    X_val = np.random.uniform(0.0, 1.0, size=(n_samples, 4))
    y_val = (X_val[:, 0] < 0.5).astype(int)  # 1 = tampered

    clf = RandomForestClassifier(n_estimators=10, random_state=42)
    clf.fit(X_val, y_val)

    evaluator = FieldConsistencyEvaluator(clf)
    calibration_res = evaluator.calibrate_threshold(X_val, y_val, min_precision=0.80)

    assert "calibrated_recommended_threshold" in calibration_res
    assert len(calibration_res["candidate_curves"]) > 0
    assert 0.10 <= calibration_res["calibrated_recommended_threshold"] <= 0.95
