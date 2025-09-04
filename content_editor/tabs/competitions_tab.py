from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List

from widgets.fields import LabeledEntry, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText, EnOnlyList
from widgets.multi_image_picker import MultiImagePicker
from widgets.date_widgets import DateRangePicker
from .list_tab import ListEntityTab

class CompetitionsTab(ListEntityTab):
    entity_name = "competitions"
    columns = ["name", "team", "start"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.name_en = EnOnlyEntry(f, "Competition Name (EN)")
        self.team = LabeledEntry(f, "Team Name")
        self.role_en = EnOnlyEntry(f, "Role (optional, EN)")
        self.org = LabeledEntry(f, "Organization")
        self.dr = DateRangePicker(f, title="Date Range")
        self.result = LabeledEntry(f, "Result")
        self.details_en = EnOnlyText(f, "Details (EN)", height=6)
        self.highlights_en = EnOnlyList(f, "Highlights (EN)", height=6)
        self.stack = CommaListEntry(f, "Stack (comma separated)")

        self.gallery = MultiImagePicker(
            f, public_dir_cb=self.public_dir, tab_key="competitions_tab",
            name_cb=lambda: (self.name_en.get().get("en") or "competition"),
            title="Images & Cover"
        )

        r = 0
        for w in [self.name_en, self.team, self.role_en, self.org, self.dr, self.result, self.details_en, self.highlights_en, self.stack, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()
        g = self.gallery.get()
        return {
            "name": self.name_en.get(),
            "team": self.team.get(),
            "role": self.role_en.get(),
            "organization": self.org.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "start_iso": dr.get("start_iso"), "start_unix": dr.get("start_unix"),
            "end_iso": dr.get("end_iso"), "end_unix": dr.get("end_unix"),
            "result": self.result.get(),
            "details": self.details_en.get(),
            "highlights": self.highlights_en.get(),
            "stack": self.stack.get_list(),
            "images": g["images"],
            "icon": g["cover"],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.name_en.set(rec.get("name"))
        self.team.set(rec.get("team"))
        self.role_en.set(rec.get("role"))
        self.org.set(rec.get("organization"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.result.set(rec.get("result"))
        self.details_en.set(rec.get("details"))
        self.highlights_en.set(rec.get("highlights"))
        self.stack.set_list(rec.get("stack") or [])
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name = (rec.get("name", {}) or {}).get("en", "")
        return [name, rec.get("team", ""), rec.get("start", "")]
