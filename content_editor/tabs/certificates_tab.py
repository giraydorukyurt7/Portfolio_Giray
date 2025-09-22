from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List

from widgets.fields import LabeledEntry, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText
from widgets.multi_image_picker import MultiImagePicker
from widgets.date_widgets import DatePicker
from .list_tab import ListEntityTab

class CertificatesTab(ListEntityTab):
    entity_name = "certificates"
    columns = ["name", "issuer", "issued_at"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        # --- Temel alanlar
        self.name_en = EnOnlyEntry(f, "Name (EN)")
        self.issuer = LabeledEntry(f, "Issuer")

        # --- Kategori seçimi (default: TECHNICAL CERTIFICATIONS)
        self.category_var = tk.StringVar(value="TECHNICAL CERTIFICATIONS")
        cat_frame = ttk.Frame(f)
        ttk.Label(cat_frame, text="Category").grid(row=0, column=0, sticky="w")
        self.category_cb = ttk.Combobox(
            cat_frame,
            state="readonly",
            width=36,
            textvariable=self.category_var,
            values=[
                "TECHNICAL CERTIFICATIONS",
                "SEMINAR PARTICIPATION CERTIFICATIONS",
            ],
        )
        self.category_cb.grid(row=0, column=1, padx=(6, 0), sticky="w")

        # --- Tarih
        self.issued_picker = DatePicker(f, title="Issued at", year_min=2020)

        # --- Diğer
        self.cred_id = LabeledEntry(f, "Credential ID")
        self.cred_url = LabeledEntry(f, "Credential URL", 60)
        self.details_en = EnOnlyText(f, "Details (EN)", height=6)
        self.stack = CommaListEntry(f, "Stack (comma separated)")

        # --- Görseller
        self.gallery = MultiImagePicker(
            f,
            public_dir_cb=self.public_dir,
            tab_key="certificates_tab",
            name_cb=lambda: (self.name_en.get().get("en") or "certificate"),
            title="Images & Cover",
        )

        # --- Yerleşim
        r = 0
        for w in [self.name_en, self.issuer]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        cat_frame.grid(row=r, column=0, sticky="w", pady=6); r += 1
        self.issued_picker.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        for w in [self.cred_id, self.cred_url, self.details_en, self.stack, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self) -> Dict[str, Any]:
        issued_str, (issued_iso, issued_unix) = self.issued_picker.get(), self.issued_picker.get_iso_unix()
        g = self.gallery.get()

        # Label -> key eşleşmesi
        cat_label = self.category_var.get()
        label_to_key = {
            "TECHNICAL CERTIFICATIONS": "technical",
            "SEMINAR PARTICIPATION CERTIFICATIONS": "seminar",
        }
        cat_key = label_to_key.get(cat_label, "technical")

        return {
            "name": self.name_en.get(),
            "issuer": self.issuer.get(),

            # Yeni alanlar
            "category": cat_key,               # "technical" | "seminar"
            "category_label": cat_label,       # UI etiketi

            "issued_at": issued_str,
            "issued_at_iso": issued_iso,
            "issued_at_unix": issued_unix,

            "credential_id": self.cred_id.get(),
            "credential_url": self.cred_url.get(),
            "details": self.details_en.get(),
            "stack": self.stack.get_list(),
            "images": g["images"],
            "icon": g["cover"],
        }

    def set_form(self, rec: Dict[str, Any]):
        self.name_en.set(rec.get("name"))
        self.issuer.set(rec.get("issuer"))

        # key -> label geri dönüş
        key_to_label = {
            "technical": "TECHNICAL CERTIFICATIONS",
            "seminar": "SEMINAR PARTICIPATION CERTIFICATIONS",
        }
        cat_key = rec.get("category")
        cat_label = rec.get("category_label") or key_to_label.get(cat_key, "TECHNICAL CERTIFICATIONS")
        self.category_var.set(cat_label)

        self.issued_picker.set(rec.get("issued_at") or rec.get("end") or rec.get("start"))
        self.cred_id.set(rec.get("credential_id"))
        self.cred_url.set(rec.get("credential_url"))
        self.details_en.set(rec.get("details"))
        self.stack.set_list(rec.get("stack") or [])
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name = (rec.get("name", {}) or {}).get("en", "")
        return [name, rec.get("issuer", ""), rec.get("issued_at", "")]
