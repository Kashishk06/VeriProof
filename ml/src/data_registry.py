"""Dataset Registry and Governance Layer for VeriProof AI/ML Pipeline."""

import os
import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

class DatasetRegistry:
    """Manages versioned dataset manifests, split partitions, and validation rules."""

    def __init__(self, workspace_root: Optional[str | Path] = None):
        if workspace_root is None:
            self.root = Path(__file__).resolve().parents[2]
        else:
            self.root = Path(workspace_root)
            
        self.splits_dir = self.root / "datasets" / "splits"
        self.reports_dir = self.root / "datasets" / "reports"
        self.manifest_file = self.splits_dir / "master_split_manifest.csv"

    def list_datasets(self) -> List[Dict[str, Any]]:
        """List all registered dataset components and their split paths."""
        if not self.manifest_file.exists():
            return []
            
        records = []
        with open(self.manifest_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(row)
        return records

    def load_split(self, task_name: str, split_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load split records for a specific task and partition (train, val, test)."""
        file_map = {
            "image_forensics": self.splits_dir / "synthetic_image_forensics_splits.csv",
            "casia2": self.splits_dir / "casia2_splits.csv",
            "idspace": self.splits_dir / "idspace_splits.csv",
            "funsd": self.splits_dir / "funsd_splits.csv",
            "ocr_consistency": self.splits_dir / "synthetic_ocr_splits.csv",
            "anomaly_detection": self.splits_dir / "synthetic_anomaly_splits.csv",
            "crypto_verification": self.splits_dir / "synthetic_crypto_splits.csv",
        }
        
        target_csv = file_map.get(task_name)
        if not target_csv or not target_csv.exists():
            raise FileNotFoundError(f"Split manifest for '{task_name}' not found at {target_csv}")

        rows = []
        with open(target_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if split_type is None or r.get("split") == split_type:
                    # Resolve absolute path for relative image paths if present
                    if "relative_path" in r:
                        if task_name == "casia2":
                            r["absolute_path"] = str(self.root / "datasets" / "public" / "CASIA2" / r["relative_path"])
                        elif task_name == "idspace":
                            r["absolute_path"] = str(self.root / "datasets" / "public" / "IDSpace" / r["relative_path"])
                        else:
                            r["absolute_path"] = str(self.root / "datasets" / "synthetic" / r["relative_path"])
                    elif "image_path" in r:
                        r["absolute_path"] = str(self.root / "datasets" / "public" / "FUNSD" / r["image_path"])
                    rows.append(r)
        return rows

    def get_dataset_metadata(self, task_name: str) -> Dict[str, Any]:
        """Fetch metadata, license restrictions, and provenance for a task."""
        manifests = self.list_datasets()
        for m in manifests:
            if task_name.lower() in m.get("target_task", "").lower() or task_name.lower() in m.get("dataset_name", "").lower():
                return m
        return {"dataset_name": task_name, "status": "UNKNOWN"}
