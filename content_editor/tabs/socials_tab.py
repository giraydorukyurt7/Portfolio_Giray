from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry
from widgets.icon_picker import IconPicker
from .list_tab import ListEntityTab

class SocialsTab(ListEntityTab):
    entity_name = "socials"
    columns = ["platform", "username", "url", "icon"]

    def build_form(self, parent):
        # scrollable form
        container = self.make_scrollable(parent)

        # Lang toggle (TR/EN) global değil; bu sekmede gerek yok; diğerlerinde var.
        self.platform = LabeledEntry(container, "Platform")
        self.username = LabeledEntry(container, "Username")
        self.url = LabeledEntry(container, "URL", 60)

        self.icon = IconPicker(
            container, public_dir_cb=self.public_dir, tab_key="socials_tab",
            name_cb=lambda: self.platform.get(), title="Icon"
        )

        self.platform.grid(row=0, column=0, sticky="ew", pady=6)
        self.username.grid(row=1, column=0, sticky="ew", pady=6)
        self.url.grid(row=2, column=0, sticky="ew", pady=6)
        self.icon.grid(row=3, column=0, sticky="ew", pady=6)

        container.columnconfigure(0, weight=1)
        return container

    def record_from_form(self) -> Dict[str, Any]:
        return {
            "platform": self.platform.get(),
            "username": self.username.get(),
            "url": self.url.get(),
            "icon": self.icon.get(),
        }

    def set_form(self, rec: Dict[str, Any]):
        self.platform.set(rec.get("platform"))
        self.username.set(rec.get("username"))
        self.url.set(rec.get("url"))
        self.icon.set(rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        return [rec.get("platform", ""), rec.get("username", ""), rec.get("url", ""), rec.get("icon", "")]