from __future__ import annotations
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from settings import DEFAULT_CONTENT_ROOT, REPO_ROOT
from services.repository import ContentRepository
from schemas.schema_definitions import DefaultsProvider, RECORD_TEMPLATES
from tabs.base_tab import BaseTab
from tabs.info_tab import InfoTab
from tabs.socials_tab import SocialsTab
from tabs.experience_tab import ExperienceTab
from tabs.competitions_tab import CompetitionsTab
from tabs.projects_tab import ProjectsTab
from tabs.certificates_tab import CertificatesTab

class EditorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Portfolio JSON Editor • v2 (TR+EN same file)")
        self.geometry("1200x780"); self.minsize(1024, 700)
        style = ttk.Style(self)
        try: style.theme_use("clam")
        except Exception: pass
        style.configure("TNotebook.Tab", padding=(18, 8))

        self.content_root = tk.StringVar(value=DEFAULT_CONTENT_ROOT)
        self.repo_root = REPO_ROOT
        self.defaults = DefaultsProvider()
        self.repo = ContentRepository(self.content_root.get(), self.defaults)

        # Üst bar
        top = ttk.Frame(self); top.pack(fill="x", padx=16, pady=(12,8))
        ttk.Label(top, text="Content Root:").grid(row=0, column=0)
        self.root_entry = ttk.Entry(top, textvariable=self.content_root, width=64)
        self.root_entry.grid(row=0, column=1, sticky="ew", padx=8)
        ttk.Button(top, text="Browse…", command=self._browse_root).grid(row=0, column=2)
        top.columnconfigure(1, weight=1)

        # Actions
        actions = ttk.Frame(self); actions.pack(fill="x", padx=16, pady=(0,8))
        ttk.Button(actions, text="Load All", command=self.load_all).pack(side="left")
        ttk.Button(actions, text="Save Current Tab", command=self.save_current_tab).pack(side="left", padx=8)
        ttk.Button(actions, text="Save All", command=self.save_all).pack(side="left")

        # Tabs
        self.nb = ttk.Notebook(self); self.nb.pack(fill="both", expand=True, padx=12, pady=12)
        self.tabs = {
            "info": InfoTab(self.nb, self),
            "socials": SocialsTab(self.nb, self),
            "experience": ExperienceTab(self.nb, self),
            "competitions": CompetitionsTab(self.nb, self),
            "projects": ProjectsTab(self.nb, self),
            "certificates": CertificatesTab(self.nb, self),
        }
        for key, tab in self.tabs.items():
            self.nb.add(tab, text=key.capitalize()); tab.update_target_path()
        self.after(50, self.load_all)

    def _browse_root(self):
        path = filedialog.askdirectory(initialdir=self.content_root.get())
        if path:
            self.content_root.set(path)
            self.repo = ContentRepository(self.content_root.get(), self.defaults)
            for tab in self.tabs.values(): tab.update_target_path()
            self.load_all()

    def load_all(self):
        for tab in self.tabs.values():
            tab.load(); tab.update_target_path()

    def save_current_tab(self):
        current = self.nb.select()
        for ent, tab in self.tabs.items():
            if str(tab) == current:
                data = tab.serialize(); path = self.repo.save(tab.entity_name, data)
                messagebox.showinfo("Saved", f"Saved → {os.path.relpath(path, self.repo_root)}")
                break

    def save_all(self):
        for tab in self.tabs.values():
            data = tab.serialize(); self.repo.save(tab.entity_name, data)
        messagebox.showinfo("Saved", "All entities saved.")

# DefaultsProvider için yeni kayıt şablonu erişimi
setattr(DefaultsProvider, "record_template", lambda self, ent: RECORD_TEMPLATES.get(ent, {}))

if __name__ == "__main__":
    EditorApp().mainloop()