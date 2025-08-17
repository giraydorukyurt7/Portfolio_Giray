from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, LabeledText, DateRange
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText, EnOnlyList
from widgets.multi_image_picker import MultiImagePicker
from .list_tab import ListEntityTab

class ProjectsTab(ListEntityTab):
    entity_name = "projects"
    columns = ["title", "start", "stack"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.title_en = EnOnlyEntry(f, "Title (EN)")
        self.summary_en = EnOnlyText(f, "Summary (EN)", height=4)
        self.dr = DateRange(f)
        self.stack = LabeledText(f, "Stack (comma-separated)", height=3)
        self.link_gh = LabeledEntry(f, "GitHub URL", 60)
        self.link_demo = LabeledEntry(f, "Demo URL", 60)
        self.highlights_en = EnOnlyList(f, "Highlights (EN)", height=6)

        self.gallery = MultiImagePicker(
            f, public_dir_cb=self.public_dir, tab_key="projects_tab",
            name_cb=lambda: (self.title_en.get().get("en") or "project"),
            title="Images & Cover"
        )

        r = 0
        for w in [self.title_en, self.summary_en, self.dr, self.stack, self.link_gh, self.link_demo, self.highlights_en, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self):
        dr = self.dr.get()
        g = self.gallery.get()
        return {
            "title": self.title_en.get(),
            "summary": self.summary_en.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "stack": [x.strip() for x in self.stack.get().split(",") if x.strip()],
            "links": {"github": self.link_gh.get(), "demo": self.link_demo.get()},
            "highlights": self.highlights_en.get(),
            "images": g["images"],         # <— çoklu
            "icon": g["cover"],            # <— kapak
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_en.set(rec.get("title"))
        self.summary_en.set(rec.get("summary"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.stack.set(", ".join(rec.get("stack", [])))
        links = rec.get("links", {}) or {}
        self.link_gh.set(links.get("github"))
        self.link_demo.set(links.get("demo"))
        self.highlights_en.set(rec.get("highlights"))
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title = (rec.get("title", {}) or {}).get("en", "")
        stack = ", ".join(rec.get("stack", [])[:3])
        return [title, rec.get("start", ""), stack]
