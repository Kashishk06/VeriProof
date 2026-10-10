"""Unit and integration tests for Dataset Registry and leakage validation."""

import pytest
from pathlib import Path
from ml.src.data_registry import DatasetRegistry
from ml.src.validate_data import run_validation
from ml.src.config import load_config

def test_registry_lists_all_manifests():
    root = Path(__file__).resolve().parents[2]
    registry = DatasetRegistry(workspace_root=root)
    datasets = registry.list_datasets()
    assert len(datasets) >= 6
    names = [d["dataset_name"] for d in datasets]
    assert "CASIA 2.0" in names
    assert "FUNSD" in names
    assert "Synthetic Image Forensics" in names

def test_data_validation_runs_cleanly():
    cfg = load_config()
    report = run_validation(cfg)
    assert report["status"] == "PASSED"
    assert report["file_existence_errors"] == 0
    assert report["group_leakage_detected"] is False
    assert report["total_records_checked"] > 10000

def test_synthetic_forensics_split_isolation():
    root = Path(__file__).resolve().parents[2]
    registry = DatasetRegistry(workspace_root=root)
    
    train_recs = registry.load_split("image_forensics", split_type="train")
    val_recs = registry.load_split("image_forensics", split_type="val")
    test_recs = registry.load_split("image_forensics", split_type="test")
    
    train_groups = {r["source_group_id"] for r in train_recs}
    val_groups = {r["source_group_id"] for r in val_recs}
    test_groups = {r["source_group_id"] for r in test_recs}
    
    assert len(train_groups.intersection(val_groups)) == 0
    assert len(train_groups.intersection(test_groups)) == 0
    assert len(val_groups.intersection(test_groups)) == 0
