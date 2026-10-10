"""Inference against locally registered models, separate from rule scores."""

from typing import Any

from app.forensics.registry import ForensicModelRegistry, model_registry
from app.forensics.training import feature_matrix


def infer_registered_models(
    features: dict[str, Any],
    registry: ForensicModelRegistry | None = None,
) -> dict[str, Any]:
    registry = registry or model_registry
    available = registry.list_models()
    selected: dict[str, dict[str, Any]] = {}
    for metadata in available:
        algorithm = metadata.get("algorithm")
        if algorithm in {"xgboost_classifier", "isolation_forest"}:
            previous = selected.get(algorithm)
            if previous is None or metadata.get("created_at", "") > previous.get("created_at", ""):
                selected[algorithm] = metadata

    if not selected:
        return {}

    vector = feature_matrix([features])
    signals: dict[str, Any] = {}
    for algorithm, metadata in selected.items():
        model = registry.load(metadata["model_id"])
        if algorithm == "xgboost_classifier":
            estimator = model.named_steps["classifier"]
            class_index = list(estimator.classes_).index(1)
            probability = float(model.predict_proba(vector)[0][class_index])
            signals[algorithm] = {
                "model_id": metadata["model_id"],
                "suspicious_probability": probability,
                "interpretation": "Model output only; not a document authenticity determination.",
            }
        else:
            prediction = int(model.predict(vector)[0])
            decision_score = float(model.decision_function(vector)[0])
            signals[algorithm] = {
                "model_id": metadata["model_id"],
                "is_anomaly": prediction == -1,
                "decision_score": decision_score,
                "interpretation": "Unsupervised anomaly signal; not a fraud probability.",
            }
    return signals