from __future__ import annotations
import json, os
from typing import Any


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def read_json(path: str, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except json.JSONDecodeError:
        return default


def atomic_write_json(path: str, data: Any) -> None:
    ensure_dir(os.path.dirname(path))
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if os.path.exists(path):
        bak = path + ".bak"
        try:
            if os.path.exists(bak):
                os.remove(bak)
        except Exception:
            pass
        try:
            os.replace(path, bak)
        except Exception:
            pass
    os.replace(tmp, path)