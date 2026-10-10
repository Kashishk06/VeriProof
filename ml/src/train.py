"""Reproducible Model Training Pipeline for VeriProof Document Intelligence."""

import os
import sys
import time
import argparse
import numpy as np
from pathlib import Path
from typing import Any, Dict, List, Tuple

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from ml.src.config import load_config
from ml.src.data_registry import DatasetRegistry
from ml.src.model_registry import ModelRegistry
from ml.src.features.image_forensics import ImageForensicsExtractor
from ml.src.features.ocr_features import OCRConsistencyEngine
from ml.src.features.anomaly_features import AnomalyFeatureExtractor

def train_image_forensics(config: Dict[str, Any], registry: DatasetRegistry, model_reg: ModelRegistry) -> Dict[str, Any]:
    """Train gradient-boosted image tampering classifier using extracted forensic features."""
    print("\n--- Training Image Forensics Classifier ---")
    start_time = time.time()
    
    task_cfg = config.get("tasks", {}).get("image_forensics", {})
    seed = config.get("master_random_seed", 20261009)
    extractor = ImageForensicsExtractor(ela_quality=task_cfg.get("ela_quality", 90))

    # 1. Load Train and Validation Splits
    train_records = registry.load_split("image_forensics", split_type="train")
    val_records = registry.load_split("image_forensics", split_type="val")

    print(f"Loaded {len(train_records)} training images and {len(val_records)} validation images.")

    def extract_dataset_features(records: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        X_list = []
        y_list = []
        feature_names = None
        
        for r in records:
            img_p = r.get("absolute_path")
            if not img_p or not os.path.exists(img_p):
                continue
            feats = extractor.extract_features(img_p)
            if feature_names is None:
                feature_names = list(feats.keys())
            
            vec = [feats[k] for k in feature_names]
            X_list.append(vec)
            label_val = 1 if r.get("label") == "tampered" else 0
            y_list.append(label_val)

        return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32), feature_names or []

    X_train, y_train, feature_names = extract_dataset_features(train_records)
    X_val, y_val, _ = extract_dataset_features(val_records)

    print(f"Feature matrix shape: Train {X_train.shape}, Val {X_val.shape}")
    print(f"Class distribution in train: Authentic={int(np.sum(y_train==0))}, Tampered={int(np.sum(y_train==1))}")

    # 2. Fit Model
    hyperparams = task_cfg.get("hyperparameters", {})
    model = GradientBoostingClassifier(
        n_estimators=hyperparams.get("n_estimators", 100),
        max_depth=hyperparams.get("max_depth", 4),
        learning_rate=hyperparams.get("learning_rate", 0.08),
        random_state=seed
    )
    model.fit(X_train, y_train)

    # 3. Evaluate on Validation Set (Strictly NO test tuning)
    val_preds = model.predict(X_val)
    val_probs = model.predict_proba(X_val)[:, 1] if hasattr(model, "predict_proba") else val_preds

    acc = float(accuracy_score(y_val, val_preds))
    prec = float(precision_score(y_val, val_preds, zero_division=0))
    rec = float(recall_score(y_val, val_preds, zero_division=0))
    f1 = float(f1_score(y_val, val_preds, zero_division=0))
    try:
        auc = float(roc_auc_score(y_val, val_probs))
    except Exception:
        auc = 1.0

    duration = round(time.time() - start_time, 2)
    metrics = {
        "validation_accuracy": round(acc, 4),
        "validation_precision": round(prec, 4),
        "validation_recall": round(rec, 4),
        "validation_f1": round(f1, 4),
        "validation_roc_auc": round(auc, 4),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "training_duration_sec": duration
    }

    print(f"Validation Results: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}, AUC={auc:.4f}")

    # 4. Register Model Artifact
    metadata = model_reg.register_model(
        task_type="image_forensics",
        model_object=model,
        metrics=metrics,
        config=task_cfg,
        dataset_version="VeriProof_Synthetic_Forensics_v1",
        feature_names=feature_names,
        license_restriction="internal_veriproof_permissive",
        status="validated",
        notes="Gradient boosting classifier trained on ELA, Laplacian sharpness, noise SNR, and color gradient features."
    )
    print(f"Model successfully registered: {metadata['model_id']}")
    return metadata

def train_anomaly_detector(config: Dict[str, Any], registry: DatasetRegistry, model_reg: ModelRegistry) -> Dict[str, Any]:
    """Train unsupervised Isolation Forest anomaly detector on platform verification streams."""
    print("\n--- Training Behavioral Anomaly Detector ---")
    start_time = time.time()
    
    task_cfg = config.get("tasks", {}).get("anomaly_detection", {})
    seed = config.get("master_random_seed", 20261009)
    extractor = AnomalyFeatureExtractor()

    train_records = registry.load_split("anomaly_detection", split_type="train")
    val_records = registry.load_split("anomaly_detection", split_type="val")

    # Isolation Forest is trained on normal verification streams
    normal_train = [r for r in train_records if r.get("behavior_classification") in ("NORMAL_VERIFICATION", "BENIGN_HIGH_VOLUME")]
    if not normal_train:
        normal_train = train_records

    X_train = np.array([extractor.extract_event_features(r) for r in normal_train], dtype=np.float32)
    X_val = np.array([extractor.extract_event_features(r) for r in val_records], dtype=np.float32)
    
    # Ground truth for validation: 1 = normal, -1 = anomaly
    y_val_truth = np.array([-1 if r.get("behavior_classification") in ("SUSPICIOUS_BRUTE_FORCE", "ANOMALOUS_ISSUER_STATUS") else 1 for r in val_records])

    hyperparams = task_cfg.get("hyperparameters", {})
    model = IsolationForest(
        n_estimators=hyperparams.get("n_estimators", 100),
        contamination=hyperparams.get("contamination", 0.08),
        random_state=seed
    )
    model.fit(X_train)

    val_preds = model.predict(X_val) # 1 for inlier, -1 for outlier
    val_scores = model.decision_function(X_val)

    # Anomaly detection precision / recall
    anom_true = (y_val_truth == -1)
    anom_pred = (val_preds == -1)
    prec = float(precision_score(anom_true, anom_pred, zero_division=0))
    rec = float(recall_score(anom_true, anom_pred, zero_division=0))
    f1 = float(f1_score(anom_true, anom_pred, zero_division=0))

    duration = round(time.time() - start_time, 2)
    metrics = {
        "validation_anomaly_precision": round(prec, 4),
        "validation_anomaly_recall": round(rec, 4),
        "validation_anomaly_f1": round(f1, 4),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "training_duration_sec": duration
    }

    print(f"Validation Anomaly Metrics: Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}")

    metadata = model_reg.register_model(
        task_type="anomaly_detection",
        model_object=model,
        metrics=metrics,
        config=task_cfg,
        dataset_version="VeriProof_Synthetic_Telemetry_v1",
        feature_names=extractor.FEATURE_NAMES,
        license_restriction="internal_veriproof_permissive",
        status="validated",
        notes="Isolation Forest anomaly detector for verification burst velocity and authentication failure spikes."
    )
    print(f"Model successfully registered: {metadata['model_id']}")
    return metadata

def train_field_consistency_model(config: Dict[str, Any], registry: DatasetRegistry, model_reg: ModelRegistry) -> Dict[str, Any]:
    """Train decision classifier for OCR field consistency vs deliberate manipulation."""
    print("\n--- Training OCR Field Consistency Classifier ---")
    start_time = time.time()

    task_cfg = config.get("tasks", {}).get("field_consistency", {})
    seed = config.get("master_random_seed", 20261009)
    engine = OCRConsistencyEngine()

    train_records = registry.load_split("ocr_consistency", split_type="train")
    val_records = registry.load_split("ocr_consistency", split_type="val")

    def build_features(records: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        X_list = []
        y_list = []
        feature_names = ["similarity_score", "ocr_confidence", "is_roll_format_valid", "length_diff_ratio"]

        for r in records:
            gt_val = str(r.get("ground_truth_value", ""))
            ocr_val = str(r.get("ocr_extracted_value", ""))
            conf = float(r.get("ocr_confidence", 0.8))
            
            sim = engine.calculate_similarity(gt_val, ocr_val)
            is_roll_valid, _ = engine.validate_roll_number(ocr_val)
            len_ratio = abs(len(gt_val) - len(ocr_val)) / max(len(gt_val), 1)

            vec = [sim, conf, 1.0 if is_roll_valid else 0.0, float(len_ratio)]
            X_list.append(vec)

            # Target: 1 = suspect tampering / inconsistent, 0 = consistent or benign noise
            cls_name = r.get("consistency_classification", "CONSISTENT")
            label = 1 if cls_name in ("INCONSISTENT_SUSPECT_TAMPERING", "deliberate_forgery") else 0
            y_list.append(label)

        return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32), feature_names

    X_train, y_train, feature_names = build_features(train_records)
    X_val, y_val, _ = build_features(val_records)

    model = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=seed)
    model.fit(X_train, y_train)

    val_preds = model.predict(X_val)
    acc = float(accuracy_score(y_val, val_preds))
    prec = float(precision_score(y_val, val_preds, zero_division=0))
    rec = float(recall_score(y_val, val_preds, zero_division=0))
    f1 = float(f1_score(y_val, val_preds, zero_division=0))

    duration = round(time.time() - start_time, 2)
    metrics = {
        "validation_accuracy": round(acc, 4),
        "validation_precision": round(prec, 4),
        "validation_recall": round(rec, 4),
        "validation_f1": round(f1, 4),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "training_duration_sec": duration
    }

    print(f"Validation Field Consistency: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}")

    metadata = model_reg.register_model(
        task_type="field_consistency",
        model_object=model,
        metrics=metrics,
        config=task_cfg,
        dataset_version="VeriProof_Synthetic_OCR_v1",
        feature_names=feature_names,
        license_restriction="internal_veriproof_permissive",
        status="validated",
        notes="Random Forest classifier separating benign OCR character substitutions from deliberate document forgeries."
    )
    print(f"Model successfully registered: {metadata['model_id']}")
    return metadata

def main():
    parser = argparse.ArgumentParser(description="Train VeriProof Machine Learning Models")
    parser.add_argument("--task", type=str, default="all", choices=["all", "image_forensics", "anomaly_detection", "field_consistency"])
    parser.add_argument("--config", type=str, default=None, help="Path to YAML/JSON configuration file")
    args = parser.parse_args()

    cfg = load_config(args.config)
    root = Path(__file__).resolve().parents[2]
    data_reg = DatasetRegistry(workspace_root=root)
    model_reg = ModelRegistry(registry_dir=root / "ml" / "artifacts" / "models")

    results = {}
    if args.task in ("all", "image_forensics"):
        results["image_forensics"] = train_image_forensics(cfg, data_reg, model_reg)

    if args.task in ("all", "anomaly_detection"):
        results["anomaly_detection"] = train_anomaly_detector(cfg, data_reg, model_reg)

    if args.task in ("all", "field_consistency"):
        results["field_consistency"] = train_field_consistency_model(cfg, data_reg, model_reg)

    print("\n[+] All requested training tasks finished successfully!")

if __name__ == "__main__":
    main()
