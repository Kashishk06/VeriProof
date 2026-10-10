"""Local, versioned registry for trusted forensic model artifacts."""

import hashlib
import json
import os
import re
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Any


_ALGORITHMS = {"xgboost_classifier", "isolation_forest"}
_MODEL_ID = re.compile(r"^(xgboost_classifier|isolation_forest)-v[0-9TZ-]+-[a-f0-9]{8}$")
_REGISTRY_LOCK = RLock()


class ForensicModelRegistry:
    def __init__(self, storage_dir: str | Path | None = None):
        default_dir = Path(__file__).resolve().parents[2] / "storage" / "forensic_models"
        self.storage_dir = Path(storage_dir or os.environ.get("VERIPROOF_MODEL_DIR", default_dir)).resolve()
        workspace_root = Path(__file__).resolve().parents[3]
        public_roots = (workspace_root / "public", workspace_root / "src" / "public")
        if any(self._is_within(self.storage_dir, root.resolve()) for root in public_roots):
            raise ValueError("Forensic model artifacts must not be stored in a public frontend directory.")
        self.registry_path = self.storage_dir / "registry.json"

    @staticmethod
    def _is_within(path: Path, parent: Path) -> bool:
        try:
            path.relative_to(parent)
            return True
        except ValueError:
            return False

    def list_models(self) -> list[dict[str, Any]]:
        if not self.registry_path.exists():
            return []
        try:
            content = json.loads(self.registry_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise RuntimeError("Forensic model registry could not be read.") from exc
        if not isinstance(content, list) or any(not isinstance(item, dict) for item in content):
            raise RuntimeError("Forensic model registry has an invalid format.")
        return content

    def register(
        self,
        algorithm: str,
        model: Any,
        feature_names: list[str],
        metrics: dict[str, Any],
    ) -> dict[str, Any]:
        if algorithm not in _ALGORITHMS:
            raise ValueError("Unsupported forensic model algorithm.")

        try:
            import joblib
        except ImportError as exc:
            raise RuntimeError("Install backend/requirements-ml.txt to manage ML model artifacts.") from exc

        version = f"v{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}-{uuid.uuid4().hex[:8]}"
        model_id = f"{algorithm}-{version}"
        artifact_name = f"{model_id}.joblib"
        self.storage_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        temporary_artifact = self.storage_dir / f".{model_id}.tmp"
        artifact_path = self.storage_dir / artifact_name
        try:
            joblib.dump(model, temporary_artifact)
            os.replace(temporary_artifact, artifact_path)
        finally:
            temporary_artifact.unlink(missing_ok=True)

        artifact_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
        metadata = {
            "model_id": model_id,
            "algorithm": algorithm,
            "version": version,
            "artifact": artifact_name,
            "artifact_sha256": artifact_hash,
            "feature_names": feature_names,
            "metrics": metrics,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        with _REGISTRY_LOCK:
            registry = self.list_models()
            registry.append(metadata)
            self._write_registry(registry)
        return metadata

    def load(self, model_id: str) -> Any:
        if not _MODEL_ID.fullmatch(model_id):
            raise ValueError("Invalid forensic model identifier.")
        metadata = next((item for item in self.list_models() if item.get("model_id") == model_id), None)
        if metadata is None:
            raise KeyError("Forensic model version was not found.")
        artifact_name = metadata.get("artifact")
        if not isinstance(artifact_name, str) or Path(artifact_name).name != artifact_name:
            raise RuntimeError("Forensic model registry contains an invalid artifact path.")
        artifact_path = (self.storage_dir / artifact_name).resolve()
        if artifact_path.parent != self.storage_dir:
            raise RuntimeError("Forensic model artifact path is outside the configured registry.")
        try:
            artifact_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
        except OSError as exc:
            raise RuntimeError("Forensic model artifact is unavailable.") from exc
        if artifact_hash != metadata.get("artifact_sha256"):
            raise RuntimeError("Forensic model artifact integrity check failed.")
        try:
            import joblib
        except ImportError as exc:
            raise RuntimeError("Install backend/requirements-ml.txt to load ML model artifacts.") from exc
        return joblib.load(artifact_path)

    def _write_registry(self, registry: list[dict[str, Any]]) -> None:
        self.storage_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=self.storage_dir, prefix=".registry-", delete=False
            ) as temporary_file:
                temporary_path = Path(temporary_file.name)
                json.dump(registry, temporary_file, sort_keys=True, separators=(",", ":"))
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_path, self.registry_path)
        finally:
            if temporary_path:
                temporary_path.unlink(missing_ok=True)


model_registry = ForensicModelRegistry()