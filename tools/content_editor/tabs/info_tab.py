from __future__ import annotations
from tkinter import ttk
from widgets.fields import LabeledEntry, LabeledText
from widgets.i18n_fields import MultiLangEntry, MultiLangText
from .base_tab import BaseTab

class InfoTab(BaseTab):
    entity_name = "info"
    def __init__(self, master, app):
        super().__init__(master, app)
        wrap = ttk.Frame(self); wrap.pack(fill="both", expand=True, padx=16, pady=8)
        self.full_name = LabeledEntry(wrap, "Full Name")
        self.title_ml = MultiLangEntry(wrap, "Title")
        self.university = LabeledEntry(wrap, "University")
        self.department = LabeledEntry(wrap, "Department")
        self.class_year = LabeledEntry(wrap, "Class Year")
        self.gpa = LabeledEntry(wrap, "GPA")
        self.location = LabeledEntry(wrap, "Location")
        self.email = LabeledEntry(wrap, "Email")
        self.summary_ml = MultiLangText(wrap, "Summary", height=6)
        links = ttk.LabelFrame(wrap, text="Links")
        self.link_cv = LabeledEntry(links, "CV URL", 60)
        self.link_li = LabeledEntry(links, "LinkedIn", 60)
        self.link_gh = LabeledEntry(links, "GitHub", 60)
        self.link_web = LabeledEntry(links, "Website", 60)
        r=0
        for w in [self.full_name, self.title_ml, self.university, self.department, self.class_year, self.gpa, self.location, self.email, self.summary_ml]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r+=1
        links.grid(row=r, column=0, sticky="ew", pady=6)
        self.link_cv.grid(row=0, column=0, sticky="ew", padx=8, pady=4)
        self.link_li.grid(row=1, column=0, sticky="ew", padx=8, pady=4)
        self.link_gh.grid(row=2, column=0, sticky="ew", padx=8, pady=4)
        self.link_web.grid(row=3, column=0, sticky="ew", padx=8, pady=4)
        wrap.columnconfigure(0, weight=1)
        self._data = {}
    def load(self):
        data = self.app.repo.load(self.entity_name); self._data = data
        self.full_name.set(data.get("full_name"))
        self.title_ml.set(data.get("title"))
        self.university.set(data.get("university"))
        self.department.set(data.get("department"))
        self.class_year.set(data.get("class_year"))
        self.gpa.set(data.get("gpa"))
        self.location.set(data.get("location"))
        self.email.set(data.get("email"))
        self.summary_ml.set(data.get("summary"))
        links = data.get("links", {})
        self.link_cv.set(links.get("cv")); self.link_li.set(links.get("linkedin"))
        self.link_gh.set(links.get("github")); self.link_web.set(links.get("website"))
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
            "links": {"cv": self.link_cv.get(), "linkedin": self.link_li.get(), "github": self.link_gh.get(), "website": self.link_web.get()},
        }