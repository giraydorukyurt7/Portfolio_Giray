from __future__ import annotations
import json
from pathlib import Path
from typing import Any
from settings import PROJECT_ROOT, autodetect_content_root


def _jsonify(obj: Any) -> Any:
    """
    Veriyi JSON'a uygun tipe dönüştür.
    - tkinter Variable (.get()) desteklenir
    - Path -> str
    - set/tuple -> list
    - dict/list içi özyinelemeli dönüştürülür
    - tanınmayan tipler -> str(obj)
    """
    # Primitifler
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj

    # tkinter Variable (BooleanVar, StringVar, vb.)
    try:
        from tkinter import Variable  # type: ignore
        if isinstance(obj, Variable):  # type: ignore
            try:
                return _jsonify(obj.get())  # type: ignore
            except Exception:
                return str(obj)
    except Exception:
        pass

    # pathlib.Path
    if isinstance(obj, Path):
        return str(obj)

    # list/tuple/set
    if isinstance(obj, (list, tuple, set)):
        return [_jsonify(x) for x in obj]

    # dict
    if isinstance(obj, dict):
        return {str(k): _jsonify(v) for k, v in obj.items()}

    # fallback
    return str(obj)


class Repository:
    """
    Tüm JSON IO işlemleri burada. content_root:
    - Mutlak verildiyse direkt kullanılır
    - Göreli verildiyse PROJECT_ROOT'a göre çözülür (örn. 'frontend/public/content')
    """

    def __init__(self, content_root: str | Path | None = None):
        self.set_content_root(content_root or autodetect_content_root())

    # --- root normalize ---
    def _normalize_root(self, root: str | Path) -> Path:
        p = Path(root)
        if not p.is_absolute():
            p = (PROJECT_ROOT / p).resolve()
        return p

    def set_content_root(self, root: str | Path):
        self.content_root: Path = self._normalize_root(root)

    # --- path helpers ---
    def path_for(self, name: str) -> str:
        return str(self.content_root / f"{name}.json")

    # --- IO ---
    def load(self, name: str) -> Any:
        p = Path(self.path_for(name))
        if not p.exists():
            return {} if name == "info" else []
        with p.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save(self, name: str, data: Any) -> str:
        """Veriyi güvenli biçimde JSON'a dönüştürerek yazar."""
        p = Path(self.path_for(name))
        p.parent.mkdir(parents=True, exist_ok=True)
        json_ready = _jsonify(data)

        tmp = p.with_suffix(".json.tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(json_ready, f, ensure_ascii=False, indent=2)
        tmp.replace(p)
        return str(p)
