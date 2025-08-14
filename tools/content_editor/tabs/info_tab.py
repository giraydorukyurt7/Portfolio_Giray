from __future__ import annotations
import os
import shutil
from tkinter import ttk, filedialog
from widgets.fields import LabeledEntry, LabeledText
from widgets.i18n_fields import MultiLangEntry, MultiLangText
from .base_tab import BaseTab

class InfoTab(BaseTab):
    entity_name = "info"

    def __init__(self, master, app):
        super().__init__(master, app)

        wrap = ttk.Frame(self)
        wrap.pack(fill="both", expand=True, padx=16, pady=8)

        # Core info
        self.full_name   = LabeledEntry(wrap, "Full Name")
        self.title_ml    = MultiLangEntry(wrap, "Title")
        self.university  = LabeledEntry(wrap, "University")
        self.department  = LabeledEntry(wrap, "Department")
        self.class_year  = LabeledEntry(wrap, "Class Year")
        self.gpa         = LabeledEntry(wrap, "GPA")
        self.location    = LabeledEntry(wrap, "Location")
        self.email       = LabeledEntry(wrap, "Email")
        self.summary_ml  = MultiLangText(wrap, "Summary", height=6)

        # Branding (NEW): logo path + alt text
        brand = ttk.LabelFrame(wrap, text="Brand / Logo")
        self.logo_path = LabeledEntry(brand, "Logo (relative to public/, e.g. content/logo.png)", 60)
        self.logo_alt  = LabeledEntry(brand, "Logo Alt Text", 40)
        # Browse button to import an image and copy into content/
        ttk.Button(brand, text="Browse…", command=self._pick_logo).grid(row=0, column=1, padx=8, pady=4, sticky="w")

        # Links
        links = ttk.LabelFrame(wrap, text="Links")
        self.link_cv  = LabeledEntry(links, "CV URL", 60)
        self.link_li  = LabeledEntry(links, "LinkedIn", 60)
        self.link_gh  = LabeledEntry(links, "GitHub", 60)
        self.link_web = LabeledEntry(links, "Website", 60)

        r = 0
        for w in [
            self.full_name, self.title_ml, self.university, self.department,
            self.class_year, self.gpa, self.location, self.email, self.summary_ml
        ]:
            w.grid(row=r, column=0, sticky="ew", pady=6); r += 1

        # Brand block layout
        brand.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.logo_path.grid(row=0, column=0, sticky="ew", padx=8, pady=4)
        self.logo_alt.grid(row=1, column=0, sticky="ew", padx=8, pady=4)
        brand.columnconfigure(0, weight=1)

        # Links layout
        links.grid(row=r, column=0, sticky="ew", pady=6); r += 1
        self.link_cv.grid(row=0, column=0, sticky="ew", padx=8, pady=4)
        self.link_li.grid(row=1, column=0, sticky="ew", padx=8, pady=4)
        self.link_gh.grid(row=2, column=0, sticky="ew", padx=8, pady=4)
        self.link_web.grid(row=3, column=0, sticky="ew", padx=8, pady=4)

        wrap.columnconfigure(0, weight=1)
        self._data = {}

    # ---- helpers ----
    def _content_dir(self) -> str:
        """Return the 'content' folder where JSON lives (e.g., frontend/public/content)."""
        info_json = self.app.repo.path_for(self.entity_name)  # .../public/content/info.json
        return os.path.dirname(info_json)

    def _pick_logo(self):
        """Ask for an image, copy it into content/ as logo.ext, and set a relative path."""
        path = filedialog.askopenfilename(
            title="Choose a logo image",
            filetypes=[
                ("Image files", "*.png *.jpg *.jpeg *.svg *.webp *.gif"),
                ("All files", "*.*"),
            ],
        )
        if not path:
            return

        content_dir = self._content_dir()
        os.makedirs(content_dir, exist_ok=True)

        _, ext = os.path.splitext(path)
        ext = ext.lower() or ".png"
        # generate unique file name in content/
        base_name = "logo" + ext
        dst = os.path.join(content_dir, base_name)
        i = 1
        while os.path.exists(dst):
            base_name = f"logo_{i}{ext}"
            dst = os.path.join(content_dir, base_name)
            i += 1

        shutil.copyfile(path, dst)
        # save relative path expected by frontend (content/xxx)
        rel = f"content/{base_name}"
        self.logo_path.set(rel)

    # ---- IO ----
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

        # NEW: logo fields
        self.logo_path.set(data.get("logo"))
        self.logo_alt.set(data.get("logo_alt"))

        links = data.get("links", {})
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
            # NEW: logo fields
            "logo": self.logo_path.get(),
            "logo_alt": self.logo_alt.get(),
            "links": {
                "cv": self.link_cv.get(),
                "linkedin": self.link_li.get(),
                "github": self.link_gh.get(),
                "website": self.link_web.get(),
            },
        }