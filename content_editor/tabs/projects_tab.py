from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry, LabeledText, DateRange
from widgets.i18n_fields import MultiLangEntry, MultiLangText, MultiLangList
from widgets.icon_picker import IconPicker
from .list_tab import ListEntityTab

class ProjectsTab(ListEntityTab):
    entity_name = "projects"
    columns = ["title(tr)", "title(en)", "start", "stack"]

    def build_form(self, parent):
        wrap = self.make_scrollable(parent)

        self.lang = tk.StringVar(value="en")
        lang_box = ttk.Frame(wrap)
        ttk.Label(lang_box, text="Language").pack(side="left")
        ttk.Radiobutton(lang_box, text="TR", variable=self.lang, value="tr").pack(side="left", padx=6)
        ttk.Radiobutton(lang_box, text="EN", variable=self.lang, value="en").pack(side="left")
        lang_box.grid(row=0, column=0, sticky="w", pady=(4, 2))

        self.title_ml = MultiLangEntry(wrap, "Title", lang_var=self.lang)
        self.summary_ml = MultiLangText(wrap, "Summary", height=4, lang_var=self.lang)
        self.dr = DateRange(wrap)
        self.stack = LabeledText(wrap, "Stack (comma-separated)", height=3)
        self.link_gh = LabeledEntry(wrap, "GitHub URL", 60)
        self.link_demo = LabeledEntry(wrap, "Demo URL", 60)
        self.highlights_ml = MultiLangList(wrap, "Highlights", height=6)
        self.images = LabeledText(wrap, "Images (one URL per line)", height=3)

        self.icon = IconPicker(
            wrap, public_dir_cb=self.public_dir, tab_key="projects_tab",
            name_cb=lambda: (self.title_ml.get().get("en") or self.title_ml.get().get("tr") or "project"),
            title="Cover / Icon (optional)"
        )

        r = 1
        for w in [self.title_ml, self.summary_ml, self.dr, self.stack, self.link_gh, self.link_demo, self.highlights_ml, self.images, self.icon]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        wrap.columnconfigure(0, weight=1)
        return wrap

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
            "icon": self.icon.get(),
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_ml.set(rec.get("title"))
        self.summary_ml.set(rec.get("summary"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        self.stack.set(", ".join(rec.get("stack", [])))
        links = rec.get("links", {}) or {}
        self.link_gh.set(links.get("github"))
        self.link_demo.set(links.get("demo"))
        self.highlights_ml.set(rec.get("highlights"))
        self.images.set("\n".join(rec.get("images", [])))
        self.icon.set(rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title_tr = (rec.get("title", {}) or {}).get("tr", "")
        title_en = (rec.get("title", {}) or {}).get("en", "")
        stack = ", ".join(rec.get("stack", [])[:3])
        return [title_tr, title_en, rec.get("start", ""), stack]