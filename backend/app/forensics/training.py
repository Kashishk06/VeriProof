"""Training and evaluation pipelines for optional forensic ML models."""

import math
import csv
from pathlib import Path
from typing import Any, Mapping, Sequence

from app.forensics.registry import ForensicModelRegistry, model_registry


FEATURE_NAMES = [
    "file_size_bytes",
    "entropy_bits_per_byte",
    "signature_matches_extension",
    "pdf_header_present",
    "pdf_eof_marker_present",
    "sha256_matches_registry",
    "ecdsa_signature_valid",
    "duplicate_registry_matches",
]
BOOLEAN_FEATURES = {
    "signature_matches_extension",
    "pdf_header_present",
    "pdf_eof_marker_present",
    "sha256_matches_registry",
    "ecdsa_signature_valid",
}


def load_training_csv(path: str | Path, require_labels: bool) -> tuple[list[dict[str, Any]], list[int]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as dataset_file:
        reader = csv.DictReader(dataset_file)
        required_columns = set(FEATURE_NAMES) | ({"label"} if require_labels else set())
        if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
            missing = sorted(required_columns - set(reader.fieldnames or []))
            raise ValueError(f"Training CSV is missing required columns: {', '.join(missing)}")

        rows: list[dict[str, Any]] = []
        labels: list[int] = []
        for line_number, csv_row in enumerate(reader, start=2):
            row: dict[str, Any] = {}
            for feature_name in FEATURE_NAMES:
                raw_value = (csv_row.get(feature_name) or "").strip()
                if not raw_value:
                    row[feature_name] = None
                elif feature_name in BOOLEAN_FEATURES:
                    normalized = raw_value.lower()
                    if normalized not in {"true", "false", "1", "0"}:
                        raise ValueError(f"Invalid boolean value for {feature_name} on CSV line {line_number}.")
                    row[feature_name] = normalized in {"true", "1"}
                else:
                    try:
                        row[feature_name] = float(raw_value)
                    except ValueError as exc:
                        raise ValueError(f"Invalid numeric value for {feature_name} on CSV line {line_number}.") from exc
            rows.append(row)

            if require_labels:
                try:
                    label = int(csv_row["label"])
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid label on CSV line {line_number}; expected 0 or 1.") from exc
                if label not in (0, 1):
                    raise ValueError(f"Invalid label on CSV line {line_number}; expected 0 or 1.")
                labels.append(label)
    return rows, labels


def feature_matrix(rows: Sequence[Mapping[str, Any]]) -> list[list[float]]:
    matrix = []
    for row in rows:
        vector = []
        for name in FEATURE_NAMES:
            value = row.get(name)
            if value is None:
                vector.append(float("nan"))
            elif isinstance(value, bool):
                vector.append(float(value))
            else:
                numeric = float(value)
                if not math.isfinite(numeric):
                    raise ValueError(f"Feature {name} must contain a finite number or null.")
                vector.append(numeric)
        matrix.append(vector)
    return matrix


def train_xgboost_classifier(
    rows: Sequence[Mapping[str, Any]],
    labels: Sequence[int],
    registry: ForensicModelRegistry = model_registry,
) -> dict[str, Any]:
    if len(rows) != len(labels):
        raise ValueError("Each feature row must have exactly one label.")
    if len(rows) < 10 or len(set(labels)) != 2 or min(labels.count(label) for label in set(labels)) < 2:
        raise ValueError("XGBoost training requires at least 10 rows and at least two examples in each of two classes.")
    if any(label not in (0, 1) for label in labels):
        raise ValueError("Labels must be 0 (genuine) or 1 (suspicious).")

    try:
        from sklearn.impute import SimpleImputer
        from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
        from xgboost import XGBClassifier
    except ImportError as exc:
        raise RuntimeError("Install backend/requirements-ml.txt before training XGBoost models.") from exc

    features = feature_matrix(rows)
    train_features, test_features, train_labels, test_labels = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels
    )
    evaluation_model = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                XGBClassifier(
                    n_estimators=200,
                    max_depth=4,
                    learning_rate=0.05,
                    subsample=0.9,
                    colsample_bytree=0.9,
                    eval_metric="logloss",
                    random_state=42,
                    n_jobs=1,
                ),
            ),
        ]
    )
    evaluation_model.fit(train_features, train_labels)
    predictions = evaluation_model.predict(test_features)
    metrics = {
        "evaluation_samples": len(test_labels),
        "accuracy": float(accuracy_score(test_labels, predictions)),
        "precision": float(precision_score(test_labels, predictions, zero_division=0)),
        "recall": float(recall_score(test_labels, predictions, zero_division=0)),
        "f1": float(f1_score(test_labels, predictions, zero_division=0)),
        "confusion_matrix": confusion_matrix(test_labels, predictions, labels=[0, 1]).tolist(),
        "evaluation_split_seed": 42,
    }

    final_model = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("classifier", evaluation_model.named_steps["classifier"]),
        ]
    )
    final_model.fit(features, labels)
    return registry.register("xgboost_classifier", final_model, FEATURE_NAMES, metrics)


def train_isolation_forest(
    rows: Sequence[Mapping[str, Any]],
    contamination: float | str = "auto",
    registry: ForensicModelRegistry = model_registry,
) -> dict[str, Any]:
    if len(rows) < 20:
        raise ValueError("Isolation Forest training requires at least 20 feature rows.")
    if contamination != "auto" and not 0.01 <= float(contamination) <= 0.5:
        raise ValueError("Contamination must be 'auto' or between 0.01 and 0.5.")

    try:
        from sklearn.ensemble import IsolationForest
        from sklearn.impute import SimpleImputer
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError as exc:
        raise RuntimeError("Install backend/requirements-ml.txt before training Isolation Forest models.") from exc

    features = feature_matrix(rows)
    model = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            (
                "detector",
                IsolationForest(
                    contamination=contamination,
                    random_state=42,
                    n_estimators=200,
                    n_jobs=1,
                ),
            ),
        ]
    )
    model.fit(features)
    predictions = model.predict(features)
    scores = model.decision_function(features)
    diagnostics = {
        "training_samples": len(rows),
        "estimated_anomaly_fraction": float((predictions == -1).mean()),
        "mean_decision_score": float(scores.mean()),
        "evaluation_note": "Unsupervised training diagnostics only; not a validated fraud-detection performance metric.",
    }
    return registry.register("isolation_forest", model, FEATURE_NAMES, diagnostics)