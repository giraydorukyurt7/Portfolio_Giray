from __future__ import annotations
import os, shutil
from tkinter import ttk, filedialog, messagebox
from typing import Any, Dict, List
from widgets.fields import LabeledEntry
from .list_tab import ListEntityTab

class StackTab(ListEntityTab):
    """
    Stack yönetimi:
      - name, category, link
      - logo_url (harici)
      - logo_file (yerel yükleme -> public/content/stack_logos/{slug}.ext)
    JSON alanları:
      { "name": "...", "category": "...", "link": "...",
        "logo_url": "...", "logo_path": "content/stack_logos/xxx.svg" }
    """
    entity_name = "stack"
    columns = ["name", "category", "link"]

    # ---- UI ----
    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.name = LabeledEntry(f, "Name")
        self.category = LabeledEntry(f, "Category")
        self.link = LabeledEntry(f, "Link", 60)
        self.logo_url = LabeledEntry(f, "Logo URL (SVG/PNG)", 60)

        # File picker (tek dosya)
        file_row = ttk.Frame(f)
        self.logo_path_field = LabeledEntry(file_row, "Logo File (→ /content/stack_logos)")
        ttk.Button(file_row, text="Browse…", command=self._pick_logo_file).grid(row=0, column=1, padx=(8,0))
        self.logo_path_field.grid(row=0, column=0, sticky="ew")
        file_row.columnconfigure(0, weight=1)

        r = 0
        for w in [self.name, self.category, self.link, self.logo_url, file_row]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    # ---- helpers ----
    def _slug(self, s: str) -> str:
        s = (s or "").strip().lower()
        safe = "".join(ch for ch in s if ch.isalnum() or ch in "-_ ")
        return "-".join([t for t in safe.split() if t]) or "item"

    def _pick_logo_file(self):
        fp = filedialog.askopenfilename(
            title="Choose a logo",
            filetypes=[("Images", "*.svg;*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.ico"), ("All", "*.*")],
        )
        if not fp:
            return
        try:
            public_dir = self.public_dir()                     # .../frontend/public
            content_dir = os.path.join(public_dir, "content")  # .../frontend/public/content
            logos_dir = os.path.join(content_dir, "stack_logos")
            os.makedirs(logos_dir, exist_ok=True)

            name_slug = self._slug(self.name.get() or "logo")
            base, ext = os.path.splitext(fp)
            ext = (ext or ".png").lower()
            dst = os.path.join(logos_dir, f"{name_slug}{ext}")
            shutil.copyfile(fp, dst)

            rel = os.path.join("content", "stack_logos", os.path.basename(dst)).replace("\\", "/")
            self.logo_path_field.set(rel)
        except Exception as e:
            messagebox.showerror("Logo Copy Error", str(e))

    # ---- form <-> record ----
    def record_from_form(self) -> Dict[str, Any]:
        return {
            "name": self.name.get(),
            "category": self.category.get(),
            "link": self.link.get(),
            "logo_url": self.logo_url.get(),
            "logo_path": self.logo_path_field.get(),
        }

    def set_form(self, rec: Dict[str, Any]) -> None:
        self.name.set(rec.get("name"))
        self.category.set(rec.get("category"))
        self.link.set(rec.get("link"))
        self.logo_url.set(rec.get("logo_url"))
        self.logo_path_field.set(rec.get("logo_path"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        return [rec.get("name", ""), rec.get("category", ""), rec.get("link", "")]
