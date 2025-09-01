from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List, Optional
import re
from datetime import datetime

from widgets.fields import LabeledEntry, LabeledText, DateRange, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText, EnOnlyList
from widgets.multi_image_picker import MultiImagePicker
from .list_tab import ListEntityTab


def _to_iso_and_unix(raw: Optional[str]) -> (Optional[str], Optional[int]):
    if not raw:
        return None, None
    s = str(raw).strip()
    if not s:
        return None, None
    fmts = ["%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y", "%Y-%m", "%Y/%m"]
    for f in fmts:
        try:
            dt = datetime.strptime(s, f)
            # YYYY-MM ise 1. gün varsay
            if f in ("%Y-%m", "%Y/%m"):
                dt = datetime(dt.year, dt.month, 1)
            return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
        except Exception:
            pass
    m = re.match(r"^\s*(\d{4})\s*$", s)
    if m:
        y = int(m.group(1)); dt = datetime(y, 1, 1)
        return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
    return None, None


class ProjectsTab(ListEntityTab):
    entity_name = "projects"
    columns = ["title", "start", "stack"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.title_en = EnOnlyEntry(f, "Title (EN)")
        self.summary_en = EnOnlyText(f, "Summary (EN)", height=6)

        self.dr = DateRange(f)  # start / end / present
        self.stack = CommaListEntry(f, "Stack (comma separated)")
        self.link_gh = LabeledEntry(f, "GitHub URL", width=60)
        self.link_demo = LabeledEntry(f, "Demo URL", width=60)
        self.highlights_en = EnOnlyList(f, "Highlights (EN)")
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

    def record_from_form(self) -> Dict[str, Any]:
        dr = self.dr.get()  # {"start": "...", "end": "...", "present": bool}
        start_iso, start_unix = _to_iso_and_unix(dr["start"])
        end_iso, end_unix = _to_iso_and_unix(dr["end"])
        g = self.gallery.get()
        stack_list = self.stack.get_list()
        return {
            "title": self.title_en.get(),
            "summary": self.summary_en.get(),
            "start": dr["start"], "end": dr["end"], "present": dr["present"],
            "start_iso": start_iso, "end_iso": end_iso,
            "start_unix": start_unix, "end_unix": end_unix,
            "stack": stack_list,
            "links": {"github": self.link_gh.get(), "demo": self.link_demo.get()},
            "highlights": self.highlights_en.get(),
            "images": g["images"],
            "icon": g["cover"],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.title_en.set(rec.get("title"))
        self.summary_en.set(rec.get("summary"))
        self.dr.set(rec.get("start"), rec.get("end"), rec.get("present", False))
        # eski veriler 'tech' kullanıyorsa koru
        stack_in = rec.get("stack") or rec.get("tech") or []
        self.stack.set_list(stack_in)
        links = rec.get("links", {}) or {}
        self.link_gh.set(links.get("github"))
        self.link_demo.set(links.get("demo"))
        self.highlights_en.set(rec.get("highlights"))
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        title = (rec.get("title", {}) or {}).get("en", "")
        stack = ", ".join((rec.get("stack") or [])[:3])
        return [title, rec.get("start", ""), stack]
