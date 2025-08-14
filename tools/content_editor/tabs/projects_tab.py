from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, LabeledText, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from .list_tab import ListEntityTab

class ProjectsTab(ListEntityTab):
    entity_name = "projects"
    columns = ["title(tr)", "title(en)", "start", "stack"]

    def build_form(self, parent):
        f = ttk.Frame(parent)
        self.title_ml = MultiLangEntry(f, "Title")
        self.summary_ml = MultiLangText(f, "Summary", height=4)
        self.dr = DateRange(f)
        self.stack = LabeledText(f, "Stack (comma-separated)", height=3)
        self.link_gh = LabeledEntry(f, "GitHub URL", 60)
        self.link_demo = LabeledEntry(f, "Demo URL", 60)
        self.highlights_ml = MultiLangList(f, "Highlights", height=4)
        self.images = LabeledText(f, "Images (one URL per line)", height=3)

        self.title_ml.grid(row=0, column=0, sticky="ew", pady=6)
        self.summary_ml.grid(row=1, column=0, sticky="nsew", pady=6)
        self.dr.grid(row=2, column=0, sticky="w", pady=6)
        self.stack.grid(row=3, column=0, sticky="nsew", pady=6)
        self.link_gh.grid(row=4, column=0, sticky="ew", pady=6)
        self.link_demo.grid(row=5, column=0, sticky="ew", pady=6)
        self.highlights_ml.grid(row=6, column=0, sticky="nsew", pady=6)
        self.images.grid(row=7, column=0, sticky="nsew", pady=6)

        f.columnconfigure(0, weight=1)
        f.rowconfigure(1, weight=1)
        f.rowconfigure(3, weight=1)
        f.rowconfigure(6, weight=1)
        f.rowconfigure(7, weight=1)
        return f

    def record_from_form(self):
        dr = self.dr.get()
        return {
            "title": self.title_ml.get(),
            "summary": self.summary_ml.get(),
            "start": dr["start"],
            "end": dr["end"],
            "present": dr["present"],
            "stack": [x.strip() for x in self.stack.get().split(",") if x.strip()],
            "links": {"github": self.link_gh.get(), "demo": self.link_demo.get()},
            "highlights": self.highlights_ml.get(),
            "images": [x.strip() for x in self.images.get().splitlines() if x.strip()],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_ml.set(rec.get("title"))
        self.summary_ml.set(rec.get("summary"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.stack.set(", ".join(rec.get("stack", [])))
        links = rec.get("links", {})
        self.link_gh.set(links.get("github"))
        self.link_demo.set(links.get("demo"))
        self.highlights_ml.set(rec.get("highlights"))
        # FIX: her görsel yeni satıra gelsin
        self.images.set("\n".join(rec.get("images", [])))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title_tr = (rec.get("title", {}) or {}).get("tr", "")
        title_en = (rec.get("title", {}) or {}).get("en", "")
        stack = ", ".join(rec.get("stack", [])[:3])
        return [title_tr, title_en, rec.get("start", ""), stack]