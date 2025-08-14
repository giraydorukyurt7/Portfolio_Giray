from __future__ import annotations
import os
from tkinter import ttk
from widgets.fields import PathBar

class BaseTab(ttk.Frame):
    entity_name = ""
    def __init__(self, master, app):
        super().__init__(master)
        self.app = app
        self.path_bar = PathBar(self)
        self.path_bar.pack(fill="x", padx=12, pady=(12, 4))

    def update_target_path(self):
        p = self.app.repo.path_for(self.entity_name)
        rel = os.path.relpath(p, self.app.repo_root)
        self.path_bar.set_text(f"→ {rel}")

    def load(self):
        raise NotImplementedError

    def serialize(self):
        raise NotImplementedError

    # ---- NEW: images için ortak yardımcılar ----
    def public_dir(self) -> str:
        """…/frontend/public"""
        info_json = self.app.repo.path_for("info")  # …/public/content/info.json
        content_dir = os.path.dirname(info_json)
        return os.path.dirname(content_dir)

    def images_dir(self, tab_key: str) -> str:
        """…/frontend/public/images/<tab_key> (oluşturur)"""
        d = os.path.join(self.public_dir(), "images", tab_key)
        os.makedirs(d, exist_ok=True)
        return d