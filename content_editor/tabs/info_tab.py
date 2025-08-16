from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from widgets.fields import LabeledEntry
from widgets.i18n_fields import MultiLangEntry, MultiLangText
from widgets.icon_picker import IconPicker
from .base_tab import BaseTab

class InfoTab(BaseTab):
    entity_name = "info"

    def __init__(self, master, app):
        super().__init__(master, app)

        # Sağ panel scrollable
        wrap = self.make_scrollable(self)

        # Dil tuşu
        self.lang = tk.StringVar(value="en")
        lang_box = ttk.Frame(wrap)
        ttk.Label(lang_box, text="Language").pack(side="left")
        ttk.Radiobutton(lang_box, text="TR", variable=self.lang, value="tr").pack(side="left", padx=6)
        ttk.Radiobutton(lang_box, text="EN", variable=self.lang, value="en").pack(side="left")
        lang_box.grid(row=0, column=0, sticky="w", pady=(4, 2))

        self.full_name  = LabeledEntry(wrap, "Full Name")
        self.title_ml   = MultiLangEntry(wrap, "Title", lang_var=self.lang)
        self.university = LabeledEntry(wrap, "University")
        self.department = LabeledEntry(wrap, "Department")
        self.class_year = LabeledEntry(wrap, "Class Year")
        self.gpa        = LabeledEntry(wrap, "GPA")
        self.location   = LabeledEntry(wrap, "Location")
        self.email      = LabeledEntry(wrap, "Email")
        self.summary_ml = MultiLangText(wrap, "Summary", height=6, lang_var=self.lang)

        self.logo = IconPicker(
            wrap, public_dir_cb=self.public_dir, tab_key="info_tab",
            name_cb=lambda: "logo", title="Brand / Logo"
        )

        links = ttk.LabelFrame(wrap, text="Links")
        self.link_cv  = LabeledEntry(links, "CV URL", 60)
        self.link_li  = LabeledEntry(links, "LinkedIn", 60)
        self.link_gh  = LabeledEntry(links, "GitHub", 60)
        self.link_web = LabeledEntry(links, "Website", 60)

        r = 1
        for w in [
            self.full_name, self.title_ml, self.university, self.department,
            self.class_year, self.gpa, self.location, self.email, self.summary_ml,
            self.logo,
        ]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        links.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.link_cv.grid(row=0, column=0, sticky="ew", padx=8, pady=4)
        self.link_li.grid(row=1, column=0, sticky="ew", padx=8, pady=4)
        self.link_gh.grid(row=2, column=0, sticky="ew", padx=8, pady=4)
        self.link_web.grid(row=3, column=0, sticky="ew", padx=8, pady=4)
        links.columnconfigure(0, weight=1); wrap.columnconfigure(0, weight=1)

    def load(self):
        data = self.app.repo.load(self.entity_name)
        self.full_name.set(data.get("full_name"))
        self.title_ml.set(data.get("title"))
        self.university.set(data.get("university"))
        self.department.set(data.get("department"))
        self.class_year.set(data.get("class_year"))
        self.gpa.set(data.get("gpa"))
        self.location.set(data.get("location"))
        self.email.set(data.get("email"))
        self.summary_ml.set(data.get("summary"))
        self.logo.set(data.get("logo"))
        links = data.get("links", {}) or {}
        self.link_cv.set(links.get("cv"))
        self.link_li.set(links.get("linkedin"))
        self.link_gh.set(links.get("github"))
        self.link_web.set(links.get("website"))

    def serialize(self):
        return {
            "full_name": self.full_name.get(),
            "title": self.title_ml.get(),
            "university": self.university.get(),
            "department": self.department.get(),
            "class_year": self.class_year.get(),
            "gpa": self.gpa.get(),
            "location": self.location.get(),
            "email": self.email.get(),
            "summary": self.summary_ml.get(),
            "logo": self.logo.get(),  # images/info_tab/logo.png veya .svg URL
            "links": {
                "cv": self.link_cv.get(),
                "linkedin": self.link_li.get(),
                "github": self.link_gh.get(),
                "website": self.link_web.get(),
            },
        }