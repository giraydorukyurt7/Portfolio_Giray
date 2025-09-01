from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List, Optional
import re
from datetime import datetime

from widgets.fields import LabeledEntry, CommaListEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText
from widgets.multi_image_picker import MultiImagePicker
from .list_tab import ListEntityTab


def _to_iso_and_unix(raw: str) -> (Optional[str], Optional[int]):
    if not raw:
        return None, None
    s = raw.strip()
    if not s:
        return None, None
    fmts = ["%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%m/%d/%Y"]
    for f in fmts:
        try:
            dt = datetime.strptime(s, f)
            return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
        except Exception:
            pass
    m = re.match(r"^\s*(\d{4})[/-](\d{1,2})\s*$", s)
    if m:
        y = int(m.group(1)); mth = max(1, min(12, int(m.group(2))))
        dt = datetime(y, mth, 1)
        return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
    m = re.match(r"^\s*(\d{4})\s*$", s)
    if m:
        y = int(m.group(1))
        dt = datetime(y, 1, 1)
        return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
    return None, None


class CertificatesTab(ListEntityTab):
    entity_name = "certificates"
    columns = ["name", "issuer", "issued_at"]

    def build_form(self, parent):
        f = ttk.Frame(parent)

        self.name_en = EnOnlyEntry(f, "Name (EN)")
        self.issuer = LabeledEntry(f, "Issuer")
        self.issued_at = LabeledEntry(f, "Issued at (free format)")
        self.cred_id = LabeledEntry(f, "Credential ID")
        self.cred_url = LabeledEntry(f, "Credential URL", 60)
        self.details_en = EnOnlyText(f, "Details (EN)", height=6)
        self.stack = CommaListEntry(f, "Stack (comma separated)")
        self.gallery = MultiImagePicker(
            f, public_dir_cb=self.public_dir, tab_key="certificates_tab",
            name_cb=lambda: (self.name_en.get().get("en") or "certificate"),
            title="Images & Cover"
        )

        r = 0
        for w in [self.name_en, self.issuer, self.issued_at, self.cred_id, self.cred_url, self.details_en, self.stack, self.gallery]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        f.columnconfigure(0, weight=1)
        return f

    def record_from_form(self) -> Dict[str, Any]:
        raw = self.issued_at.get().strip()
        iso, unix = _to_iso_and_unix(raw)
        g = self.gallery.get()
        return {
            "name": self.name_en.get(),
            "issuer": self.issuer.get(),
            "issued_at": raw,
            "issued_at_iso": iso,
            "issued_at_unix": unix,
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
        raw = rec.get("issued_at") or rec.get("end") or rec.get("start") or ""
        self.issued_at.set(raw)
        self.cred_id.set(rec.get("credential_id"))
        self.cred_url.set(rec.get("credential_url"))
        self.details_en.set(rec.get("details"))
        self.stack.set_list(rec.get("stack") or [])
        self.gallery.set(rec.get("images") or [], rec.get("icon"))

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        name = (rec.get("name", {}) or {}).get("en", "")
        return [name, rec.get("issuer", ""), rec.get("issued_at", "")]
