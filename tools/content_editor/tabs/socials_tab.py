from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry
from .list_tab import ListEntityTab

class SocialsTab(ListEntityTab):
    entity_name = "socials"
    columns = ["platform", "username", "url"]
    def build_form(self, parent):
        f = ttk.Frame(parent)
        self.platform = LabeledEntry(f, "Platform")
        self.username = LabeledEntry(f, "Username")
        self.url = LabeledEntry(f, "URL",)
        self.platform.grid(row=0, column=0, sticky="ew", pady=6)
        self.username.grid(row=1, column=0, sticky="ew", pady=6)
        self.url.grid(row=2, column=0, sticky="ew", pady=6)
        f.columnconfigure(0, weight=1)
        return f
    def record_from_form(self):
        return {"platform": self.platform.get(), "username": self.username.get(), "url": self.url.get()}
    def set_form(self, rec: Dict[str, Any]):
        self.platform.set(rec.get("platform")); self.username.set(rec.get("username")); self.url.set(rec.get("url"))
    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        return [rec.get("platform", ""), rec.get("username", ""), rec.get("url", "")]