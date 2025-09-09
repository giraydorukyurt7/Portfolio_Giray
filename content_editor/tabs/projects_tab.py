from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List

from widgets.fields import LabeledEntry, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText, EnOnlyList
from widgets.multi_image_picker import MultiImagePicker
from widgets.date_widgets import DatePicker
from .list_tab import ListEntityTab

class ProjectsTab(ListEntityTab):
    entity_name = "projects"
    columns = ["title", "date", "origin", "areas", "topics", "stack"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        # --- Temel alanlar
        self.title_en = EnOnlyEntry(f, "Title (EN)")
        self.summary_en = EnOnlyText(f, "Summary (EN)", height=6)

        # --- Kaynak (Personal vs Tutorial/Course)
        self.source_var = tk.StringVar(value="Personal")
        src_frame = ttk.Frame(f)
        ttk.Label(src_frame, text="Source").grid(row=0, column=0, sticky="w")
        self.source_cb = ttk.Combobox(
            src_frame, state="readonly", width=24, textvariable=self.source_var,
            values=["Personal", "Tutorial/Course"]
        )
        self.source_cb.grid(row=0, column=1, padx=(6, 0), sticky="w")

        # --- Tek tarih
        self.date_picker = DatePicker(f, title="Date", year_min=2020)

        # --- Tech stack / areas / topics
        self.stack  = CommaListEntry(f, "Stack (technologies, comma separated)\nex: Python, TensorFlow, Docker")
        self.areas  = CommaListEntry(f, "Areas (broader fields, comma separated)\nex: Embedded Systems, Game Programming")
        self.topics = CommaListEntry(f, "Topics (methods/subfields, comma separated)\nex: CNN, GAN, NLP")

        # --- Linkler / highlights
        self.link_gh   = LabeledEntry(f, "GitHub URL", width=60)
        self.link_demo = LabeledEntry(f, "Demo URL", width=60)
        self.highlights_en = EnOnlyList(f, "Highlights (EN)")

        # --- Görseller
        self.gallery = MultiImagePicker(
            f, public_dir_cb=self.public_dir, tab_key="projects_tab",
            name_cb=lambda: (self.title_en.get().get("en") or "project"),
            title="Images & Cover"
        )

        # --- Yerleşim
        r = 0
        for w in [self.title_en, self.summary_en]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        src_frame.grid(row=r, column=0, sticky="w", pady=6); r += 1
        self.date_picker.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.stack.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.areas.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.topics.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        for w in [self.link_gh, self.link_demo, self.highlights_en, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self) -> Dict[str, Any]:
        # Tarih
        date_str = self.date_picker.get()
        date_iso, date_unix = self.date_picker.get_iso_unix()

        # Source mapping
        src_map = {"Personal": "personal", "Tutorial/Course": "tutorial"}
        origin = src_map.get(self.source_var.get(), "personal")

        # Listeler
        g = self.gallery.get()
        stack_list  = self.stack.get_list()
        areas_list  = self.areas.get_list()
        topics_list = self.topics.get_list()

        return {
            "title": self.title_en.get(),
            "summary": self.summary_en.get(),

            # Kaynak
            "origin": origin,                 # "personal" | "tutorial"
            "origin_label": self.source_var.get(),

            # Tek-tarih alanları
            "date": date_str,
            "date_iso": date_iso,
            "date_unix": date_unix,

            # Geri uyumluluk
            "start": date_str,
            "end": None,
            "present": False,

            # Yeni alanlar
            "stack": stack_list,
            "areas": areas_list,              # geniş alanlar (Embedded Systems, Game Programming)
            "topics": topics_list,            # yöntem/alt alanlar (CNN, GAN, NLP)

            "links": {"github": self.link_gh.get(), "demo": self.link_demo.get()},
            "highlights": self.highlights_en.get(),
            "images": g["images"],
            "icon": g["cover"],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_en.set(rec.get("title"))
        self.summary_en.set(rec.get("summary"))

        # Source (geri uyumluluk: "origin" yoksa "source")
        inv_map = {"personal": "Personal", "tutorial": "Tutorial/Course"}
        src_val = rec.get("origin") or rec.get("source") or "personal"
        self.source_var.set(inv_map.get(src_val, "Personal"))

        # Tarih
        self.date_picker.set(rec.get("date") or rec.get("start"))

        # Stack & Areas & Topics
        stack_in  = rec.get("stack") or rec.get("tech") or []
        areas_in  = rec.get("areas") or (rec.get("topics") if "areas" not in rec else []) or []
        topics_in = rec.get("topics") or []
        self.stack.set_list(stack_in)
        self.areas.set_list(areas_in)
        self.topics.set_list(topics_in)

        # Linkler
        links = rec.get("links", {}) or {}
        self.link_gh.set(links.get("github"))
        self.link_demo.set(links.get("demo"))

        self.highlights_en.set(rec.get("highlights"))
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title = (rec.get("title", {}) or {}).get("en", "")
        date_show = rec.get("date", "") or rec.get("start", "")

        origin_label = rec.get("origin_label")
        if not origin_label:
            origin_label = {"personal": "Personal", "tutorial": "Tutorial/Course"}.get(rec.get("origin"), "")

        # kısa görünümler
        areas_short  = ", ".join((rec.get("areas")  or [])[:2])
        topics_short = ", ".join((rec.get("topics") or [])[:2])
        stack_short  = ", ".join((rec.get("stack")  or [])[:2])

        return [title, date_show, origin_label or "", areas_short, topics_short, stack_short]
