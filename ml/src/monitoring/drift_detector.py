"""Statistical Drift Detection for VeriProof Model Features and Risk Scores."""

import math
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np


def calculate_psi(baseline: Union[List[float], np.ndarray], current: Union[List[float], np.ndarray], num_buckets: int = 10) -> Dict[str, Any]:
    """Calculate the Population Stability Index (PSI) between baseline and current distributions."""
    base = np.array(baseline, dtype=np.float64)
    curr = np.array(current, dtype=np.float64)

    if len(base) == 0 or len(curr) == 0:
        return {"psi": 0.0, "status": "INSUFFICIENT_DATA", "alert": False}

    # Generate quantile bin edges from baseline
    quantiles = np.linspace(0, 100, num_buckets + 1)
    bin_edges = np.percentile(base, quantiles)
    bin_edges = np.unique(bin_edges)  # ensure monotonic increasing
    
    if len(bin_edges) < 2:
        bin_edges = np.array([np.min(base) - 1e-5, np.max(base) + 1e-5])

    # Extend edge boundaries
    bin_edges[0] = -np.inf
    bin_edges[-1] = np.inf

    base_counts, _ = np.histogram(base, bins=bin_edges)
    curr_counts, _ = np.histogram(curr, bins=bin_edges)

    # Convert to proportions with smoothing epsilon to prevent division by zero or log(0)
    eps = 1e-4
    base_pct = (base_counts + eps) / (len(base) + eps * len(base_counts))
    curr_pct = (curr_counts + eps) / (len(curr) + eps * len(curr_counts))

    psi_values = (curr_pct - base_pct) * np.log(curr_pct / base_pct)
    total_psi = float(np.sum(psi_values))

    # Determine status according to industrial standard thresholds
    if total_psi < 0.10:
        status = "STABLE"
        alert = False
        message = "No significant distribution change detected (PSI < 0.10)."
    elif total_psi < 0.25:
        status = "MODERATE_SHIFT"
        alert = True
        message = "Moderate distribution drift detected (0.10 <= PSI < 0.25). Monitor score trends."
    else:
        status = "SIGNIFICANT_DRIFT"
        alert = True
        message = "Significant distribution shift detected (PSI >= 0.25). Investigation recommended."

    return {
        "psi": round(total_psi, 4),
        "status": status,
        "alert": alert,
        "message": message,
        "baseline_samples": len(base),
        "current_samples": len(curr),
        "num_bins": len(bin_edges) - 1
    }


def calculate_feature_drift_ks(baseline: Union[List[float], np.ndarray], current: Union[List[float], np.ndarray]) -> Dict[str, Any]:
    """Calculate 2-sample Kolmogorov-Smirnov statistic without mandatory external dependencies."""
    base = np.sort(np.array(baseline, dtype=np.float64))
    curr = np.sort(np.array(current, dtype=np.float64))

    n1 = len(base)
    n2 = len(curr)
    if n1 == 0 or n2 == 0:
        return {"ks_statistic": 0.0, "p_value_approx": 1.0, "drift_detected": False}

    all_vals = np.concatenate([base, curr])
    cdf1 = np.searchsorted(base, all_vals, side="right") / n1
    cdf2 = np.searchsorted(curr, all_vals, side="right") / n2

    ks_stat = float(np.max(np.abs(cdf1 - cdf2)))
    
    # Asymptotic critical value approximation for alpha = 0.05
    c_alpha = 1.36
    crit_val = c_alpha * math.sqrt((n1 + n2) / (n1 * n2))
    drift_detected = ks_stat > crit_val

    return {
        "ks_statistic": round(ks_stat, 4),
        "critical_value_05": round(crit_val, 4),
        "drift_detected": drift_detected,
        "status": "DRIFT_DETECTED" if drift_detected else "STABLE"
    }


class ModelDriftMonitor:
    """Monitors live telemetry and validation features against baseline distribution distributions."""

    def __init__(self, baseline_scores: Optional[Dict[str, List[float]]] = None):
        self.baseline_scores = baseline_scores or {}

    def set_baseline(self, task_name: str, scores: List[float]):
        self.baseline_scores[task_name] = list(scores)

    def check_score_drift(self, task_name: str, live_scores: List[float]) -> Dict[str, Any]:
        baseline = self.baseline_scores.get(task_name, [])
        if not baseline:
            return {"status": "NO_BASELINE", "message": f"No baseline recorded for {task_name}"}
        return calculate_psi(baseline, live_scores)
