from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from widgets.icon_picker import IconPicker
from .list_tab import ListEntityTab

class CompetitionsTab(ListEntityTab):
    entity_name = "competitions"
    columns = ["name(tr)", "name(en)", "team", "start"]

    def build_form(self, parent):
        wrap = self.make_scrollable(parent)

        self.lang = tk.StringVar(value="en")
        lang_box = ttk.Frame(wrap)
        ttk.Label(lang_box, text="Language").pack(side="left")
        ttk.Radiobutton(lang_box, text="TR", variable=self.lang, value="tr").pack(side="left", padx=6)
        ttk.Radiobutton(lang_box, text="EN", variable=self.lang, value="en").pack(side="left")
        lang_box.grid(row=0, column=0, sticky="w", pady=(4, 2))

        self.name_ml = MultiLangEntry(wrap, "Competition Name", lang_var=self.lang)
        self.team = LabeledEntry(wrap, "Team Name")
        self.role_ml = MultiLangEntry(wrap, "Role (optional)", lang_var=self.lang)
        self.org = LabeledEntry(wrap, "Organization")
        self.dr = DateRange(wrap)
        self.result = LabeledEntry(wrap, "Result")
        self.details_ml = MultiLangText(wrap, "Details", height=6, lang_var=self.lang)
        self.highlights_ml = MultiLangList(wrap, "Highlights", height=6)
        self.icon = IconPicker(
            wrap, public_dir_cb=self.public_dir, tab_key="competitions_tab",
            name_cb=lambda: (self.name_ml.get().get("en") or self.name_ml.get().get("tr") or "competition"),
            title="Icon (optional)"
        )

        r = 1
        for w in [self.name_ml, self.team, self.role_ml, self.org, self.dr, self.result, self.details_ml, self.highlights_ml, self.icon]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        wrap.columnconfigure(0, weight=1)
        return wrap

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()
        return {
            "name": self.name_ml.get(),
            "team": self.team.get(),
            "role": self.role_ml.get(),
            "organization": self.org.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "result": self.result.get(),
            "details": self.details_ml.get(),
            "highlights": self.highlights_ml.get(),
            "icon": self.icon.get(),
        }

    def set_form(self, rec: Dict[str, Any]):
        self.name_ml.set(rec.get("name"))
        self.team.set(rec.get("team"))
        self.role_ml.set(rec.get("role"))
        self.org.set(rec.get("organization"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.result.set(rec.get("result"))
        self.details_ml.set(rec.get("details"))
        self.highlights_ml.set(rec.get("highlights"))
        self.icon.set(rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name_tr = (rec.get("name", {}) or {}).get("tr", "")
        name_en = (rec.get("name", {}) or {}).get("en", "")
        return [name_tr, name_en, rec.get("team", ""), rec.get("start", "")]