"""Configuration management for VeriProof AI/ML Pipeline."""

import os
import json
import re
from pathlib import Path
from typing import Any, Dict

def load_yaml_fallback(content: str) -> Dict[str, Any]:
    """Lightweight fallback YAML parser for standard dictionary/list YAML configurations."""
    result: Dict[str, Any] = {}
    stack = [(0, result)]
    
    for line in content.splitlines():
        # Remove comments
        if "#" in line:
            line = line[:line.index("#")]
        if not line.strip():
            continue
            
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()
        
        # Pop stack if indent is smaller
        while stack and stack[-1][0] >= indent and len(stack) > 1:
            stack.pop()
            
        current_dict = stack[-1][1]
        
        if ":" in stripped:
            key, val = stripped.split(":", 1)
            key = key.strip().strip("'\"")
            val = val.strip()
            
            if not val:
                new_dict: Dict[str, Any] = {}
                current_dict[key] = new_dict
                stack.append((indent + 2, new_dict))
            else:
                # Parse value
                if val.lower() == "true":
                    v: Any = True
                elif val.lower() == "false":
                    v = False
                elif val.lower() in ("null", "none"):
                    v = None
                elif re.match(r"^-?\d+$", val):
                    v = int(val)
                elif re.match(r"^-?\d+\.\d+$", val):
                    v = float(val)
                else:
                    v = val.strip("'\"")
                current_dict[key] = v
        elif stripped.startswith("- "):
            val = stripped[2:].strip().strip("'\"")
            if not isinstance(current_dict, list):
                # If current container isn't a list yet, adapt
                pass

    return result

def load_config(config_path: str | Path | None = None) -> Dict[str, Any]:
    """Load configuration from YAML or JSON file."""
    if config_path is None:
        default_p = Path(__file__).resolve().parents[1] / "configs" / "default.yaml"
        config_path = default_p
    else:
        config_path = Path(config_path)

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    content = config_path.read_text(encoding="utf-8")
    
    try:
        import yaml
        return yaml.safe_load(content)
    except ImportError:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return load_yaml_fallback(content)
