from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import LabeledEntry
from .list_tab import ListEntityTab

class CoursesTab(ListEntityTab):
    """
    Technical Courses
      - name (str)
      - semester (str)  e.g., "5th semester"
      - type: "mandatory" | "elective"
      - elective_type (str)  only when type == "elective"
    """
    entity_name = "courses"
    columns = ["name", "semester", "type"]

    ELECTIVE_SUBS = ["Area Elective", "Non-area Elective", "Universitive Elective"]

    def build_form(self, parent):
        f = ttk.Frame(parent)
        for i in range(2):
            f.columnconfigure(i, weight=1)

        self.name = LabeledEntry(f, "Name")
        self.semester = LabeledEntry(f, "Semester (e.g., 5th semester)")

        # Type radio
        self.type_var = tk.StringVar(value="mandatory")
        row_type = ttk.Frame(f); row_type.grid_columnconfigure(0, weight=1)
        ttk.Label(row_type, text="Type").grid(row=0, column=0, sticky="w")
        ttk.Radiobutton(row_type, text="Mandatory", variable=self.type_var, value="mandatory", command=self._update_sub).grid(row=0, column=1, sticky="w", padx=(8,0))
        ttk.Radiobutton(row_type, text="Elective", variable=self.type_var, value="elective", command=self._update_sub).grid(row=0, column=2, sticky="w", padx=(8,0))

        # Elective sub-type
        self.sub_var = tk.StringVar(value=self.ELECTIVE_SUBS[0])
        self.sub_row = ttk.Frame(f)
        ttk.Label(self.sub_row, text="Elective Type").pack(side="left")
        self.sub_menu = ttk.Combobox(self.sub_row, values=self.ELECTIVE_SUBS, textvariable=self.sub_var, state="readonly", width=28)
        self.sub_menu.pack(side="left", padx=(8,0))

        r = 0
        self.name.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.semester.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        row_type.grid(row=r, column=0, sticky="w", pady=6); r += 1
        # sub_row dinamik olarak gösterilecek (elective seçilince)

        return f

    def _update_sub(self):
        # elective ise alt seçim kutusunu göster
        if self.type_var.get() == "elective":
            self.sub_row.grid(row=3, column=0, sticky="w", pady=6)
        else:
            self.sub_row.grid_forget()

    # ---- form <-> record ----
    def record_from_form(self) -> Dict[str, Any]:
        rec = {
            "name": self.name.get().strip() or "Course",
            "semester": self.semester.get().strip(),
            "type": self.type_var.get(),
        }
        if rec["type"] == "elective":
            rec["elective_type"] = self.sub_var.get()
        else:
            rec.pop("elective_type", None)
        return rec

    def set_form(self, rec: Dict[str, Any]) -> None:
        self.name.set(rec.get("name"))
        self.semester.set(rec.get("semester"))
        t = rec.get("type") or "mandatory"
        self.type_var.set("elective" if t == "elective" else "mandatory")
        self._update_sub()
        if t == "elective":
            self.sub_var.set(rec.get("elective_type") or self.ELECTIVE_SUBS[0])

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        t = "Elective" if rec.get("type") == "elective" else "Mandatory"
        return [rec.get("name",""), rec.get("semester",""), t]
