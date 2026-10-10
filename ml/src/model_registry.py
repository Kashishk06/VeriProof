"""Secure Model Registry and Artifact Versioning Engine for VeriProof."""

import os
import re
import json
import uuid
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

class ModelRegistry:
    """Manages versioned, checksum-verified machine learning artifacts and metadata."""

    def __init__(self, registry_dir: Optional[str | Path] = None):
        if registry_dir is None:
            self.registry_dir = Path(__file__).resolve().parents[1] / "artifacts" / "models"
        else:
            self.registry_dir = Path(registry_dir)

        self.registry_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.registry_dir / "registry.json"

    def _calculate_sha256(self, file_path: Path) -> str:
        """Compute SHA-256 digest of a saved model artifact."""
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()

    def list_models(self, task_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all models registered in the registry."""
        if not self.manifest_path.exists():
            return []
        try:
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                models = json.load(f)
        except Exception:
            return []

        if task_type:
            return [m for m in models if m.get("task_type") == task_type]
        return models

    def get_latest_model(self, task_type: str, status: str = "validated") -> Optional[Dict[str, Any]]:
        """Retrieve the latest registered model metadata for a task with specified status."""
        models = self.list_models(task_type=task_type)
        matching = [m for m in models if m.get("status") == status or status == "all"]
        if not matching:
            return None
        # Sort by creation timestamp descending
        matching.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return matching[0]

    def register_model(
        self,
        task_type: str,
        model_object: Any,
        metrics: Dict[str, Any],
        config: Dict[str, Any],
        dataset_version: str,
        feature_names: List[str],
        license_restriction: str = "internal_veriproof_permissive",
        status: str = "validated",
        notes: str = ""
    ) -> Dict[str, Any]:
        """Serialize model, compute SHA-256 checksum, and register versioned metadata."""
        import joblib

        now_str = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        run_uid = uuid.uuid4().hex[:8]
        version = f"v{now_str}-{run_uid}"
        model_id = f"{task_type}-{version}"
        artifact_filename = f"{model_id}.joblib"
        artifact_path = self.registry_dir / artifact_filename

        # Save artifact with joblib
        joblib.dump(model_object, str(artifact_path))
        checksum = self._calculate_sha256(artifact_path)

        metadata = {
            "model_id": model_id,
            "version": version,
            "task_type": task_type,
            "artifact_path": str(artifact_path),
            "artifact_filename": artifact_filename,
            "sha256_checksum": checksum,
            "dataset_version": dataset_version,
            "feature_names": feature_names,
            "metrics": metrics,
            "config": config,
            "license_restriction": license_restriction,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "notes": notes
        }

        # Update registry.json
        models = self.list_models()
        models.append(metadata)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(models, f, indent=2)

        return metadata

    def load_model(self, model_id_or_metadata: Union[str, Dict[str, Any]]) -> Tuple[Any, Dict[str, Any]]:
        """Safely load model artifact verifying SHA-256 integrity."""
        import joblib

        if isinstance(model_id_or_metadata, str):
            models = self.list_models()
            matched = [m for m in models if m.get("model_id") == model_id_or_metadata]
            if not matched:
                raise FileNotFoundError(f"Model ID '{model_id_or_metadata}' not found in registry.")
            meta = matched[0]
        else:
            meta = model_id_or_metadata

        artifact_p = Path(meta["artifact_path"])
        if not artifact_p.exists():
            # Try resolving relative to registry dir
            artifact_p = self.registry_dir / meta["artifact_filename"]

        if not artifact_p.exists():
            raise FileNotFoundError(f"Model artifact file missing at: {artifact_p}")

        # Verify checksum
        actual_checksum = self._calculate_sha256(artifact_p)
        expected_checksum = meta.get("sha256_checksum")
        if expected_checksum and actual_checksum != expected_checksum:
            raise ValueError(f"SECURITY ALERT: Model checksum mismatch for {meta['model_id']}. Expected {expected_checksum}, found {actual_checksum}")

        model_obj = joblib.load(str(artifact_p))
        return model_obj, meta
