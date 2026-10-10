import math

import pytest

from app.forensics.inference import infer_registered_models
from app.forensics.registry import ForensicModelRegistry
from app.forensics.training import (
    FEATURE_NAMES,
    feature_matrix,
    load_training_csv,
    train_isolation_forest,
    train_xgboost_classifier,
)


def test_feature_matrix_uses_stable_order_and_missing_values():
    matrix = feature_matrix([{"file_size_bytes": 125, "signature_matches_extension": True}])

    assert len(matrix[0]) == len(FEATURE_NAMES)
    assert matrix[0][0] == 125.0
    assert matrix[0][2] == 1.0
    assert math.isnan(matrix[0][1])


def test_feature_matrix_rejects_infinite_values():
    with pytest.raises(ValueError, match="finite number"):
        feature_matrix([{"entropy_bits_per_byte": float("inf")}])


def test_supervised_training_requires_matching_rows_and_labels(tmp_path):
    registry = ForensicModelRegistry(tmp_path / "models")
    with pytest.raises(ValueError, match="exactly one label"):
        train_xgboost_classifier([{}], [], registry)


def test_isolation_forest_requires_minimum_baseline_size(tmp_path):
    registry = ForensicModelRegistry(tmp_path / "models")
    with pytest.raises(ValueError, match="at least 20"):
        train_isolation_forest([{}] * 19, registry=registry)


def test_registry_and_inference_start_empty(tmp_path):
    registry = ForensicModelRegistry(tmp_path / "models")

    assert registry.list_models() == []
    assert infer_registered_models({}, registry=registry) == {}


def test_training_csv_parses_nullable_features_and_labels(tmp_path):
    columns = FEATURE_NAMES + ["label"]
    values = ["120", "6.5", "true", "false", "", "true", "true", "0", "1"]
    dataset = tmp_path / "reviewed.csv"
    dataset.write_text(",".join(columns) + "\n" + ",".join(values) + "\n", encoding="utf-8")

    rows, labels = load_training_csv(dataset, require_labels=True)

    assert rows[0]["file_size_bytes"] == 120.0
    assert rows[0]["signature_matches_extension"] is True
    assert rows[0]["pdf_eof_marker_present"] is None
    assert labels == [1]


def test_training_csv_rejects_missing_required_features(tmp_path):
    dataset = tmp_path / "incomplete.csv"
    dataset.write_text("file_size_bytes,label\n12,0\n", encoding="utf-8")

    with pytest.raises(ValueError, match="missing required columns"):
        load_training_csv(dataset, require_labels=True)