from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List

from widgets.fields import LabeledEntry, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText, EnOnlyList
from widgets.multi_image_picker import MultiImagePicker
from widgets.date_widgets import DateRangePicker
from .list_tab import ListEntityTab

class ExperienceTab(ListEntityTab):
    entity_name = "experience"
    columns = ["title", "organization", "start"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.title_en = EnOnlyEntry(f, "Title (EN)")
        self.org = LabeledEntry(f, "Organization")
        self.loc = LabeledEntry(f, "Location")
        self.dr = DateRangePicker(f, title="Date Range")
        self.details_en = EnOnlyText(f, "Details (EN)", height=6)
        self.highlights_en = EnOnlyList(f, "Highlights (EN)", height=6)
        self.stack = CommaListEntry(f, "Stack (comma separated)")

        self.gallery = MultiImagePicker(
            f, public_dir_cb=self.public_dir, tab_key="experience_tab",
            name_cb=lambda: (self.title_en.get().get("en") or "experience"),
            title="Images & Cover"
        )

        r = 0
        for w in [self.title_en, self.org, self.loc, self.dr, self.details_en, self.highlights_en, self.stack, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()
        g = self.gallery.get()
        stack_list = self.stack.get_list()
        return {
            "title": self.title_en.get(),
            "organization": self.org.get(),
            "location": self.loc.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "start_iso": dr.get("start_iso"), "start_unix": dr.get("start_unix"),
            "end_iso": dr.get("end_iso"), "end_unix": dr.get("end_unix"),
            "details": self.details_en.get(),
            "highlights": self.highlights_en.get(),
            "stack": stack_list,
            "tech": stack_list,  # backward compat
            "images": g["images"],
            "icon": g["cover"],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_en.set(rec.get("title"))
        self.org.set(rec.get("organization"))
        self.loc.set(rec.get("location"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.details_en.set(rec.get("details"))
        self.highlights_en.set(rec.get("highlights"))
        stack_in = rec.get("stack") or rec.get("tech") or []
        self.stack.set_list(stack_in)
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title = (rec.get("title", {}) or {}).get("en", "")
        return [title, rec.get("organization", ""), rec.get("start", "")]
