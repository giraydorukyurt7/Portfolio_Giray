from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from .list_tab import ListEntityTab

class ExperienceTab(ListEntityTab):
    entity_name = "experience"
    columns = ["title(tr)", "title(en)", "organization", "start"]
    def build_form(self, parent):
        f = ttk.Frame(parent)
        self.title_ml = MultiLangEntry(f, "Title")
        self.org = LabeledEntry(f, "Organization")
        self.loc = LabeledEntry(f, "Location")
        self.dr = DateRange(f)
        self.details_ml = MultiLangText(f, "Details", height=4)
        self.highlights_ml = MultiLangList(f, "Highlights", height=4)
        self.tech = MultiLangList(f, "Tech (comma-separated per line) – plain export uses TR only", height=3)
        self.title_ml.grid(row=0, column=0, sticky="ew", pady=6)
        self.org.grid(row=1, column=0, sticky="ew", pady=6)
        self.loc.grid(row=2, column=0, sticky="ew", pady=6)
        self.dr.grid(row=3, column=0, sticky="w", pady=6)
        self.details_ml.grid(row=4, column=0, sticky="nsew", pady=6)
        self.highlights_ml.grid(row=5, column=0, sticky="nsew", pady=6)
        f.columnconfigure(0, weight=1); f.rowconfigure(4, weight=1); f.rowconfigure(5, weight=1)
        return f
    def record_from_form(self):
        dr = self.dr.get()
        return {
            "title": self.title_ml.get(),
            "organization": self.org.get(),
            "location": self.loc.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "details": self.details_ml.get(),
            "highlights": self.highlights_ml.get(),
            "tech": [],
        }
    def set_form(self, rec: Dict[str, Any]):
        self.title_ml.set(rec.get("title"))
        self.org.set(rec.get("organization")); self.loc.set(rec.get("location"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.details_ml.set(rec.get("details")); self.highlights_ml.set(rec.get("highlights"))
    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title_tr = (rec.get("title", {}) or {}).get("tr", "")
        title_en = (rec.get("title", {}) or {}).get("en", "")
        return [title_tr, title_en, rec.get("organization", ""), rec.get("start", "")]