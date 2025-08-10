from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, LabeledText, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText
from .list_tab import ListEntityTab

class CertificatesTab(ListEntityTab):
    entity_name = "certificates"
    columns = ["name(tr)", "name(en)", "issuer", "start"]
    def build_form(self, parent):
        f = ttk.Frame(parent)
        self.name_ml = MultiLangEntry(f, "Name")
        self.issuer = LabeledEntry(f, "Issuer")
        self.dr = DateRange(f)
        self.cred_id = LabeledEntry(f, "Credential ID")
        self.cred_url = LabeledEntry(f, "Credential URL", 60)
        self.details_ml = MultiLangText(f, "Details", height=4)
        self.name_ml.grid(row=0, column=0, sticky="ew", pady=6)
        self.issuer.grid(row=1, column=0, sticky="ew", pady=6)
        self.dr.grid(row=2, column=0, sticky="w", pady=6)
        self.cred_id.grid(row=3, column=0, sticky="ew", pady=6)
        self.cred_url.grid(row=4, column=0, sticky="ew", pady=6)
        self.details_ml.grid(row=5, column=0, sticky="nsew", pady=6)
        f.columnconfigure(0, weight=1); f.rowconfigure(5, weight=1)
        return f
    def record_from_form(self):
        dr = self.dr.get()
        return {
            "name": self.name_ml.get(),
            "issuer": self.issuer.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "credential_id": self.cred_id.get(),
            "credential_url": self.cred_url.get(),
            "details": self.details_ml.get(),
        }
    def set_form(self, rec: Dict[str, Any]):
        self.name_ml.set(rec.get("name")); self.issuer.set(rec.get("issuer"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.cred_id.set(rec.get("credential_id")); self.cred_url.set(rec.get("credential_url"))
        self.details_ml.set(rec.get("details"))
    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name_tr = (rec.get("name", {}) or {}).get("tr", "")
        name_en = (rec.get("name", {}) or {}).get("en", "")
        return [name_tr, name_en, rec.get("issuer", ""), rec.get("start", "")]