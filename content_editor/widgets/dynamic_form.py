# widgets/dynamic_form.py
# -*- coding: utf-8 -*-
"""
JSON -> otomatik form
- i18n dict'leri ({"en": "...", "tr": "..."}) otomatik algılar ve EnOnlyEntry/EnOnlyText ile render eder.
- str/int/float/bool/None alanlar oluşturulur; list/dict gibi karmaşık tipler UI'da gösterilmez (passthrough).
- export(): UI'dan değerleri okuyarak orijinal tipe sadık kalır (i18n bileşenleri dict döner).
"""
from __future__ import annotations
from typing import Any, Dict, Tuple, Optional, List
import tkinter as tk
from tkinter import ttk

from widgets.fields import LabeledEntry, LabeledText  # mevcut dosyaların
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText

# hedeften çok görülen anahtarlar için öncelik
PREFERRED_ORDER = [
    "full_name", "name", "title", "headline",
    "email", "phone", "location",
    "university", "department", "graduation_year",
    "summary", "about", "bio",
]
MULTILINE_KEYS = {"summary", "about", "bio"}

def _titleize(key: str) -> str:
    return key.replace("_", " ").strip().title()

def _is_i18n_scalar(v: Any) -> bool:
    """{'en': str?, 'tr': str?} gibi sözlükleri tek satır/çok satır alan olarak kabul et."""
    if not isinstance(v, dict):
        return False
    keys = set(k.lower() for k in v.keys())
    if not (("en" in keys) or ("tr" in keys)):
        return False
    # değerler string ya da None olsun
    for val in v.values():
        if val is not None and not isinstance(val, str):
            return False
    return True

def _is_scalar(v: Any) -> bool:
    return isinstance(v, (str, int, float, bool)) or v is None or _is_i18n_scalar(v)

class DynamicForm(ttk.Frame):
    """
    Bir sözlüğü forma çevirir.
    - root form: kök seviyedeki skaler alanlar
    - group form: kökteki dict alanların içindeki skaler alanlar
    """
    def __init__(self, master):
        super().__init__(master)
        self._widgets: Dict[Tuple[str, str], Any] = {}  # (group, key) -> widget
        self._types: Dict[Tuple[str, str], str] = {}    # "entry"|"text"|"bool"|"i18n_entry"|"i18n_text"
        self._groups: Dict[str, Dict[str, Any]] = {}    # for export
        self._root_fields: Dict[str, Any] = {}

    # -------- build API --------
    def build_root(self, fields: Dict[str, Any]):
        """Kök scalar alanlar."""
        self._root_fields = dict(fields)
        keys = list(fields.keys())
        ordered = [k for k in PREFERRED_ORDER if k in keys] + [k for k in keys if k not in PREFERRED_ORDER]

        # container
        self.general = ttk.LabelFrame(self, text="Genel Bilgiler", padding=12)
        self.general.grid(row=0, column=0, sticky="ew", padx=12, pady=8)
        self.general.columnconfigure(1, weight=1)

        r = 0
        for k in ordered:
            self._place_field(self.general, "__root__", k, fields.get(k), r)
            r += 1

    def build_group(self, group_name: str, fields: Dict[str, Any], row: int):
        """Alt dict alanları için ayrı bölüm."""
        self._groups[group_name] = dict(fields)
        frame = ttk.LabelFrame(self, text=_titleize(group_name), padding=12)
        frame.grid(row=row, column=0, sticky="ew", padx=12, pady=8)
        frame.columnconfigure(1, weight=1)

        keys = list(fields.keys())
        ordered = [k for k in PREFERRED_ORDER if k in keys] + [k for k in keys if k not in PREFERRED_ORDER]
        r = 0
        for k in ordered:
            self._place_field(frame, group_name, k, fields.get(k), r)
            r += 1
        return frame

    # -------- export API --------
    def export_root(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for (grp, key), w in self._widgets.items():
            if grp != "__root__": continue
            typ = self._types[(grp, key)]
            out[key] = self._read_widget(w, typ)
        return out

    def export_groups(self) -> Dict[str, Dict[str, Any]]:
        out: Dict[str, Dict[str, Any]] = {}
        for grp, fields in self._groups.items():
            g: Dict[str, Any] = {}
            for key in fields.keys():
                w = self._widgets.get((grp, key))
                if not w: continue
                typ = self._types[(grp, key)]
                g[key] = self._read_widget(w, typ)
            out[grp] = g
        return out

    # -------- internals --------
    def _place_field(self, parent, group, key, value, row):
        ttk.Label(parent, text=_titleize(key)+":").grid(row=row, column=0, sticky="w", padx=(0,8), pady=4)

        # i18n?
        if _is_i18n_scalar(value):
            if key in MULTILINE_KEYS:
                w = EnOnlyText(parent, "")
                w.pack_forget()  # we will grid
                w.grid(row=row, column=1, sticky="ew")
                w.set(value)
                self._types[(group, key)] = "i18n_text"
            else:
                w = EnOnlyEntry(parent, "")
                w.pack_forget()
                w.grid(row=row, column=1, sticky="ew")
                w.set(value)
                self._types[(group, key)] = "i18n_entry"
            self._widgets[(group, key)] = w
            return

        # bool?
        if isinstance(value, bool):
            var = tk.BooleanVar(value=value)
            w = ttk.Checkbutton(parent, variable=var)
            w.var = var
            w.grid(row=row, column=1, sticky="w", pady=4)
            self._widgets[(group, key)] = w
            self._types[(group, key)] = "bool"
            return

        # multiline?
        if key in MULTILINE_KEYS or (isinstance(value, str) and "\n" in value):
            w = LabeledText(parent, "", height=5, width=60)
            w.grid(row=row, column=1, sticky="ew", pady=4)
            w.set(value if isinstance(value, str) else "")
            self._widgets[(group, key)] = w
            self._types[(group, key)] = "text"
            return

        # numeric heuristic
        typ = "entry"
        init = ""
        if isinstance(value, (int, float)): init = str(value); typ = "num"
        elif isinstance(value, str): init = value
        w = LabeledEntry(parent, "", width=60)
        w.grid(row=row, column=1, sticky="ew", pady=4)
        w.set(init)
        self._widgets[(group, key)] = w
        self._types[(group, key)] = "num" if typ == "num" else "entry"

    @staticmethod
    def _read_widget(w, typ: str):
        if typ == "bool":
            return bool(w.var.get())
        if typ == "text":
            return w.get()
        if typ == "entry":
            return w.get()
        if typ == "num":
            raw = w.get().strip()
            if raw == "": return ""
            try:
                return float(raw) if "." in raw else int(raw)
            except Exception:
                return raw
        if typ == "i18n_entry" or typ == "i18n_text":
            return w.get()   # {"en": "..."}
        return None
