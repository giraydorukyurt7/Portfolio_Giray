from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText
from widgets.icon_picker import IconPicker
from .list_tab import ListEntityTab

class CertificatesTab(ListEntityTab):
    entity_name = "certificates"
    columns = ["name(tr)", "name(en)", "issuer", "start"]

    def build_form(self, parent):
        wrap = self.make_scrollable(parent)

        self.lang = tk.StringVar(value="en")
        lang_box = ttk.Frame(wrap)
        ttk.Label(lang_box, text="Language").pack(side="left")
        ttk.Radiobutton(lang_box, text="TR", variable=self.lang, value="tr").pack(side="left", padx=6)
        ttk.Radiobutton(lang_box, text="EN", variable=self.lang, value="en").pack(side="left")
        lang_box.grid(row=0, column=0, sticky="w", pady=(4, 2))

        self.name_ml = MultiLangEntry(wrap, "Name", lang_var=self.lang)
        self.issuer = LabeledEntry(wrap, "Issuer")
        self.dr = DateRange(wrap)
        self.cred_id = LabeledEntry(wrap, "Credential ID")
        self.cred_url = LabeledEntry(wrap, "Credential URL", 60)
        self.details_ml = MultiLangText(wrap, "Details", height=6, lang_var=self.lang)
        self.icon = IconPicker(
            wrap, public_dir_cb=self.public_dir, tab_key="certificates_tab",
            name_cb=lambda: (self.name_ml.get().get("en") or self.name_ml.get().get("tr") or "certificate"),
            title="Icon (optional)"
        )

        r = 1
        for w in [self.name_ml, self.issuer, self.dr, self.cred_id, self.cred_url, self.details_ml, self.icon]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        wrap.columnconfigure(0, weight=1)
        return wrap

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()
        return {
            "name": self.name_ml.get(),
            "issuer": self.issuer.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "credential_id": self.cred_id.get(),
            "credential_url": self.cred_url.get(),
            "details": self.details_ml.get(),
            "icon": self.icon.get(),
        }

    def set_form(self, rec: Dict[str, Any]):
        self.name_ml.set(rec.get("name"))
        self.issuer.set(rec.get("issuer"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.cred_id.set(rec.get("credential_id"))
        self.cred_url.set(rec.get("credential_url"))
        self.details_ml.set(rec.get("details"))
        self.icon.set(rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name_tr = (rec.get("name", {}) or {}).get("tr", "")
        name_en = (rec.get("name", {}) or {}).get("en", "")
        return [name_tr, name_en, rec.get("issuer", ""), rec.get("start", "")]