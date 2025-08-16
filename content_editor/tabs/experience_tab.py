from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from widgets.icon_picker import IconPicker
from .list_tab import ListEntityTab

class ExperienceTab(ListEntityTab):
    entity_name = "experience"
    columns = ["title(tr)", "title(en)", "organization", "start"]

    def build_form(self, parent):
        wrap = self.make_scrollable(parent)

        self.lang = tk.StringVar(value="en")
        lang_box = ttk.Frame(wrap)
        ttk.Label(lang_box, text="Language").pack(side="left")
        ttk.Radiobutton(lang_box, text="TR", variable=self.lang, value="tr").pack(side="left", padx=6)
        ttk.Radiobutton(lang_box, text="EN", variable=self.lang, value="en").pack(side="left")
        lang_box.grid(row=0, column=0, sticky="w", pady=(4, 2))

        self.title_ml = MultiLangEntry(wrap, "Title", lang_var=self.lang)
        self.org = LabeledEntry(wrap, "Organization")
        self.loc = LabeledEntry(wrap, "Location")
        self.dr = DateRange(wrap)
        self.details_ml = MultiLangText(wrap, "Details", height=6, lang_var=self.lang)
        self.highlights_ml = MultiLangList(wrap, "Highlights", height=6)
        self.icon = IconPicker(
            wrap, public_dir_cb=self.public_dir, tab_key="experience_tab",
            name_cb=lambda: (self.title_ml.get().get("en") or self.title_ml.get().get("tr") or "experience"),
            title="Icon (optional)"
        )

        r = 1
        for w in [self.title_ml, self.org, self.loc, self.dr, self.details_ml, self.highlights_ml, self.icon]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        wrap.columnconfigure(0, weight=1)
        return wrap

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()
        return {
            "title": self.title_ml.get(),
            "organization": self.org.get(),
            "location": self.loc.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "details": self.details_ml.get(),
            "highlights": self.highlights_ml.get(),
            "tech": [],
            "icon": self.icon.get(),
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_ml.set(rec.get("title"))
        self.org.set(rec.get("organization"))
        self.loc.set(rec.get("location"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.details_ml.set(rec.get("details"))
        self.highlights_ml.set(rec.get("highlights"))
        self.icon.set(rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title_tr = (rec.get("title", {}) or {}).get("tr", "")
        title_en = (rec.get("title", {}) or {}).get("en", "")
        return [title_tr, title_en, rec.get("organization", ""), rec.get("start", "")]