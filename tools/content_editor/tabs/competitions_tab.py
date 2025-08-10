from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, LabeledText, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from .list_tab import ListEntityTab

class CompetitionsTab(ListEntityTab):
    entity_name = "competitions"
    columns = ["name(tr)", "name(en)", "start", "end/present"]
    def build_form(self, parent):
        f = ttk.Frame(parent)
        self.name_ml = MultiLangEntry(f, "Name")
        self.role_ml = MultiLangEntry(f, "Role")
        self.org = LabeledEntry(f, "Organization")
        self.dr = DateRange(f)
        self.result = LabeledEntry(f, "Result")
        self.details_ml = MultiLangText(f, "Details", height=4)
        self.highlights_ml = MultiLangList(f, "Highlights", height=4)
        self.name_ml.grid(row=0, column=0, sticky="ew", pady=6)
        self.role_ml.grid(row=1, column=0, sticky="ew", pady=6)
        self.org.grid(row=2, column=0, sticky="ew", pady=6)
        self.dr.grid(row=3, column=0, sticky="w", pady=6)
        self.result.grid(row=4, column=0, sticky="ew", pady=6)
        self.details_ml.grid(row=5, column=0, sticky="nsew", pady=6)
        self.highlights_ml.grid(row=6, column=0, sticky="nsew", pady=6)
        f.columnconfigure(0, weight=1); f.rowconfigure(5, weight=1); f.rowconfigure(6, weight=1)
        return f
    def record_from_form(self):
        dr = self.dr.get()
        return {
            "name": self.name_ml.get(),
            "role": self.role_ml.get(),
            "organization": self.org.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "result": self.result.get(),
            "details": self.details_ml.get(),
            "highlights": self.highlights_ml.get(),
        }
    def set_form(self, rec: Dict[str, Any]):
        self.name_ml.set(rec.get("name")); self.role_ml.set(rec.get("role"))
        self.org.set(rec.get("organization"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.result.set(rec.get("result"))
        self.details_ml.set(rec.get("details")); self.highlights_ml.set(rec.get("highlights"))
    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        end = rec.get("end") or ("Present" if rec.get("present") else "")
        name_tr = (rec.get("name", {}) or {}).get("tr", "")
        name_en = (rec.get("name", {}) or {}).get("en", "")
        return [name_tr, name_en, rec.get("start", ""), end]