# widgets/i18n_fields.py
from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Optional, Dict, List, Any

# ---- internal helper frame ---------------------------------------------------
class _LangFrame(ttk.LabelFrame):
    def __init__(self, master, title: str, is_text=False, height=4):
        super().__init__(master, text=title)
        if is_text:
            self.widget = tk.Text(self, height=height)
            self.widget.pack(fill="both", expand=True, padx=6, pady=6)
        else:
            self.widget = ttk.Entry(self)
            self.widget.pack(fill="x", padx=6, pady=6)

    def get_text(self) -> str:
        if isinstance(self.widget, tk.Text):
            return self.widget.get("1.0", "end-1c")
        return self.widget.get()

    def set_text(self, val: Optional[str]):
        if isinstance(self.widget, tk.Text):
            self.widget.delete("1.0", "end")
            if val:
                self.widget.insert("1.0", val)
        else:
            self.widget.delete(0, "end")
            if val:
                self.widget.insert(0, val)

    def set_visible(self, visible: bool):
        self.pack_forget()
        if visible:
            self.pack(fill="both", expand=True)


# ---- TR/EN toggle mixin ------------------------------------------------------
def _bind_lang_toggle(widget, lang_var: Optional[tk.StringVar], tr_frame: _LangFrame, en_frame: _LangFrame):
    if lang_var is None:
        tr_frame.set_visible(True)
        en_frame.set_visible(True)
        return

    def refresh(*_):
        v = (lang_var.get() or "en").lower()
        tr_frame.set_visible(v == "tr")
        en_frame.set_visible(v == "en")

    lang_var.trace_add("write", refresh)
    refresh()


# ---- i18n Entry --------------------------------------------------------------
class MultiLangEntry(ttk.Frame):
    def __init__(self, master, label: str, lang_var: Optional[tk.StringVar] = None):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.tr = _LangFrame(self, "TR", is_text=False)
        self.en = _LangFrame(self, "EN", is_text=False)
        _bind_lang_toggle(self, lang_var, self.tr, self.en)

    def get(self) -> Dict[str, str]:
        return {"tr": self.tr.get_text(), "en": self.en.get_text()}

    def set(self, data: Optional[Dict[str, str]]):
        data = data or {}
        self.tr.set_text(data.get("tr", ""))
        self.en.set_text(data.get("en", ""))


# ---- i18n Text ---------------------------------------------------------------
class MultiLangText(ttk.Frame):
    def __init__(self, master, label: str, height=6, lang_var: Optional[tk.StringVar] = None):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.tr = _LangFrame(self, "TR", is_text=True, height=height)
        self.en = _LangFrame(self, "EN", is_text=True, height=height)
        _bind_lang_toggle(self, lang_var, self.tr, self.en)

    def get(self) -> Dict[str, str]:
        return {"tr": self.tr.get_text(), "en": self.en.get_text()}

    def set(self, data: Optional[Dict[str, str]]):
        data = data or {}
        self.tr.set_text(data.get("tr", ""))
        self.en.set_text(data.get("en", ""))


# ---- i18n List (one item per line) ------------------------------------------
class MultiLangList(ttk.Frame):
    """
    Çok satırlı alan; her satır bir madde.
    JSON karşılığı:
      { "tr": ["...","..."], "en": ["...","..."] }
    """
    def __init__(self, master, label: str, height=6, lang_var: Optional[tk.StringVar] = None):
        super().__init__(master)
        ttk.Label(self, text=label).pack(anchor="w", padx=2, pady=(4, 0))
        self.tr = _LangFrame(self, "TR (one per line)", is_text=True, height=height)
        self.en = _LangFrame(self, "EN (one per line)", is_text=True, height=height)
        _bind_lang_toggle(self, lang_var, self.tr, self.en)

    @staticmethod
    def _to_lines(val: Any) -> List[str]:
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
        if isinstance(val, str):
            return [x.strip() for x in val.splitlines() if x.strip()]
        return []

    @staticmethod
    def _from_lines(lines: List[str]) -> str:
        return "\n".join(lines)

    def get(self) -> Dict[str, List[str]]:
        tr_lines = self._to_lines(self.tr.get_text())
        en_lines = self._to_lines(self.en.get_text())
        return {"tr": tr_lines, "en": en_lines}

    def set(self, data: Optional[Dict[str, Any]]):
        data = data or {}
        self.tr.set_text(self._from_lines(self._to_lines(data.get("tr", []))))
        self.en.set_text(self._from_lines(self._to_lines(data.get("en", []))))