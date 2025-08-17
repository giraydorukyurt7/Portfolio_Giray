from __future__ import annotations
from tkinter import ttk
from widgets.fields import LabeledEntry
from widgets.i18n_fields import EnOnlyEntry, EnOnlyText
from widgets.multi_image_picker import MultiImagePicker
from .base_tab import BaseTab

class InfoTab(BaseTab):
    entity_name = "info"

    def __init__(self, master, app):
        super().__init__(master, app)

        container = ttk.Frame(self)
        container.pack(fill="both", expand=True, padx=16, pady=8)

        self.full_name  = LabeledEntry(container, "Full Name")
        self.title_en   = EnOnlyEntry(container, "Title (EN)")
        self.university = LabeledEntry(container, "University")
        self.department = LabeledEntry(container, "Department")
        self.class_year = LabeledEntry(container, "Class Year")
        self.gpa        = LabeledEntry(container, "GPA")
        self.location   = LabeledEntry(container, "Location")
        self.email      = LabeledEntry(container, "Email")
        self.summary_en = EnOnlyText(container, "Summary (EN)", height=6)

        # Photos & Logos
        self.photos = MultiImagePicker(
            container, public_dir_cb=self.public_dir, tab_key="info_profile",
            name_cb=lambda: (self.full_name.get() or "profile"), title="Profile Photo(s)"
        )
        self.uni_logos = MultiImagePicker(
            container, public_dir_cb=self.public_dir, tab_key="info_university",
            name_cb=lambda: (self.university.get() or "university"), title="University Logo(s)"
        )

        links = ttk.LabelFrame(container, text="Links")
        self.link_cv  = LabeledEntry(links, "CV URL", 60)
        self.link_li  = LabeledEntry(links, "LinkedIn", 60)
        self.link_gh  = LabeledEntry(links, "GitHub", 60)
        self.link_web = LabeledEntry(links, "Website", 60)

        r = 0
        for w in [
            self.full_name, self.title_en, self.university, self.department,
            self.class_year, self.gpa, self.location, self.email, self.summary_en,
            self.photos, self.uni_logos,
        ]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        links.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.link_cv.grid(row=0, column=0, sticky="ew", padx=8, pady=4)
        self.link_li.grid(row=1, column=0, sticky="ew", padx=8, pady=4)
        self.link_gh.grid(row=2, column=0, sticky="ew", padx=8, pady=4)
        self.link_web.grid(row=3, column=0, sticky="ew", padx=8, pady=4)
        links.columnconfigure(0, weight=1); container.columnconfigure(0, weight=1)

    def load(self):
        data = self.app.repo.load(self.entity_name) or {}
        self.full_name.set(data.get("full_name"))
        self.title_en.set(data.get("title"))
        self.university.set(data.get("university"))
        self.department.set(data.get("department"))
        self.class_year.set(data.get("class_year"))
        self.gpa.set(data.get("gpa"))
        self.location.set(data.get("location"))
        self.email.set(data.get("email"))
        self.summary_en.set(data.get("summary"))

        # images
        self.photos.set(data.get("photos") or [], data.get("photo"))
        self.uni_logos.set(data.get("university_logos") or [], data.get("logo"))  # 'logo' = selected university logo

        links = data.get("links", {}) or {}
        self.link_cv.set(links.get("cv"))
        self.link_li.set(links.get("linkedin"))
        self.link_gh.set(links.get("github"))
        self.link_web.set(links.get("website"))

    def serialize(self):
        photos_data = self.photos.get()           # {"images":[...], "cover": ...}
        uni_data = self.uni_logos.get()

        return {
            "full_name": self.full_name.get(),
            "title": self.title_en.get(),
            "university": self.university.get(),
            "department": self.department.get(),
            "class_year": self.class_year.get(),
            "gpa": self.gpa.get(),
            "location": self.location.get(),
            "email": self.email.get(),
            "summary": self.summary_en.get(),
            # profile photos
            "photo": photos_data["cover"],
            "photos": photos_data["images"],
            # university logos (site header hâlâ 'logo'yu okur)
            "logo": uni_data["cover"],
            "university_logos": uni_data["images"],
            "links": {
                "cv": self.link_cv.get(),
                "linkedin": self.link_li.get(),
                "github": self.link_gh.get(),
                "website": self.link_web.get(),
            },
        }
