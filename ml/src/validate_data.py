"""Data Validation and Quality Assurance CLI for VeriProof ML Pipeline."""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List
from ml.src.config import load_config
from ml.src.data_registry import DatasetRegistry

def run_validation(config: Dict[str, Any]) -> Dict[str, Any]:
    """Execute rigorous validation across all dataset manifests and splits."""
    root = Path(__file__).resolve().parents[2]
    registry = DatasetRegistry(workspace_root=root)
    
    datasets = registry.list_datasets()
    if not datasets:
        raise RuntimeError("Master split manifest not found or empty.")

    validation_report = {
        "status": "PASSED",
        "datasets_validated": len(datasets),
        "tasks": {},
        "file_existence_errors": 0,
        "group_leakage_detected": False,
        "total_records_checked": 0,
    }

    task_keys = [
        "image_forensics",
        "casia2",
        "idspace",
        "funsd",
        "ocr_consistency",
        "anomaly_detection",
        "crypto_verification"
    ]

    for task in task_keys:
        try:
            records = registry.load_split(task)
        except Exception as exc:
            validation_report["tasks"][task] = {"status": "FAILED", "error": str(exc)}
            validation_report["status"] = "FAILED"
            continue

        task_info = {
            "total_records": len(records),
            "splits": {},
            "missing_files": 0,
            "status": "PASSED"
        }

        # Check partitions and file existence
        group_sets: Dict[str, set] = {}
        for r in records:
            sp = r.get("split", "unassigned")
            task_info["splits"][sp] = task_info["splits"].get(sp, 0) + 1
            validation_report["total_records_checked"] += 1
            
            # Check group overlap if group_id exists
            grp_id = r.get("source_group_id") or r.get("cluster_group_id") or r.get("entity_id")
            if grp_id:
                if sp not in group_sets:
                    group_sets[sp] = set()
                group_sets[sp].add(grp_id)

            # Check physical file existence if absolute path is set
            abs_p = r.get("absolute_path")
            if abs_p and not os.path.exists(abs_p):
                task_info["missing_files"] += 1
                validation_report["file_existence_errors"] += 1

        # Check cross-split group overlap
        splits_list = list(group_sets.keys())
        for i in range(len(splits_list)):
            for j in range(i + 1, len(splits_list)):
                s1, s2 = splits_list[i], splits_list[j]
                if s1 == "demo_holdout" or s2 == "demo_holdout":
                    continue
                overlap = group_sets[s1].intersection(group_sets[s2])
                if overlap:
                    task_info["group_leakage"] = list(overlap)
                    validation_report["group_leakage_detected"] = True
                    task_info["status"] = "FAILED_LEAKAGE"
                    validation_report["status"] = "FAILED"

        if task_info["missing_files"] > 0:
            task_info["status"] = "FAILED_MISSING_FILES"
            validation_report["status"] = "FAILED"

        validation_report["tasks"][task] = task_info

    return validation_report

def main():
    parser = argparse.ArgumentParser(description="Validate VeriProof Dataset Splits & Integrity")
    parser.add_argument("--config", type=str, default=None, help="Path to YAML/JSON configuration file")
    args = parser.parse_args()

    cfg = load_config(args.config)
    report = run_validation(cfg)

    print(json.dumps(report, indent=2))
    
    if report["status"] != "PASSED":
        print("\n[!] Data validation FAILED. See report above for details.", file=sys.stderr)
        sys.exit(1)
    else:
        print("\n[+] All dataset splits, group boundaries, and files PASSED validation successfully.")
        sys.exit(0)

if __name__ == "__main__":
    main()
