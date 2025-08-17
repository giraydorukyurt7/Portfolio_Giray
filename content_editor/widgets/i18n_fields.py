# widgets/i18n_fields.py
from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Optional, Dict, List, Any

# ---------- EN-only Entry ----------
class EnOnlyEntry(ttk.Frame):
    def __init__(self, master, label: str):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.entry = ttk.Entry(self)
        self.entry.pack(fill="x", padx=6, pady=6)

    def get(self) -> Dict[str, str]:
        return {"en": self.entry.get()}

    def set(self, data: Optional[Any]):
        # Eski veriler dict olabilir -> en ya da tr'yi al
        val = ""
        if isinstance(data, dict):
            val = data.get("en") or data.get("tr") or ""
        elif isinstance(data, str):
            val = data
        self.entry.delete(0, "end")
        if val:
            self.entry.insert(0, val)


# ---------- EN-only Text ----------
class EnOnlyText(ttk.Frame):
    def __init__(self, master, label: str, height=6):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.text = tk.Text(self, height=height)
        self.text.pack(fill="both", expand=True, padx=6, pady=6)

    def get(self) -> Dict[str, str]:
        return {"en": self.text.get("1.0", "end-1c")}

    def set(self, data: Optional[Any]):
        val = ""
        if isinstance(data, dict):
            val = data.get("en") or data.get("tr") or ""
        elif isinstance(data, str):
            val = data
        self.text.delete("1.0", "end")
        if val:
            self.text.insert("1.0", val)


# ---------- EN-only List (one per line) ----------
class EnOnlyList(ttk.Frame):
    """
    Çok satırlı alan; her satır bir madde.
    JSON: { "en": ["...", "..."] }
    """
    def __init__(self, master, label: str, height=6):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.text = tk.Text(self, height=height)
        self.text.pack(fill="both", expand=True, padx=6, pady=6)

    @staticmethod
    def _to_lines(val: Any) -> List[str]:
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
        if isinstance(val, str):
            return [x.strip() for x in val.splitlines() if x.strip()]
        return []

    def get(self) -> Dict[str, List[str]]:
        lines = [x.strip() for x in self.text.get("1.0", "end-1c").splitlines() if x.strip()]
        return {"en": lines}

    def set(self, data: Optional[Any]):
        # dict -> en (yoksa tr), list -> birleştir, str -> direkt
        if isinstance(data, dict):
            val = data.get("en") or data.get("tr") or []
            if isinstance(val, list):
                s = "\n".join([str(x) for x in val])
            else:
                s = str(val)
        elif isinstance(data, list):
            s = "\n".join([str(x) for x in data])
        else:
            s = str(data or "")
        self.text.delete("1.0", "end")
        if s:
            self.text.insert("1.0", s)
