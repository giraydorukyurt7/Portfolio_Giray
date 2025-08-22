from __future__ import annotations
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# repo & ayarlar
from services.repository import Repository
from settings import autodetect_content_root

# sekmeler
from tabs.info_tab import InfoTab
from tabs.socials_tab import SocialsTab
from tabs.experience_tab import ExperienceTab
from tabs.competitions_tab import CompetitionsTab
from tabs.projects_tab import ProjectsTab
from tabs.certificates_tab import CertificatesTab


class EditorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Portfolio JSON Editor")
        self.geometry("1200x720")

        # Repository (içerik kökü otomatik tespit)
        self.repo = Repository(autodetect_content_root())

        # Üst bar: Content Root + butonlar
        top_bar = ttk.Frame(self)
        top_bar.pack(fill="x", padx=10, pady=6)

        ttk.Label(top_bar, text="Content Root:").pack(side="left")
        self.path_var = tk.StringVar(value=str(self.repo.content_root))
        self.path_entry = ttk.Entry(top_bar, textvariable=self.path_var, width=120)
        self.path_entry.pack(side="left", fill="x", expand=True, padx=(6, 6))
        self.path_entry.bind("<Return>", lambda e: (self._apply_content_root(), self.load_all()))

        ttk.Button(top_bar, text="Browse...", command=self._on_browse).pack(side="left")

        # Sağ tarafta genel butonlar
        btns = ttk.Frame(self)
        btns.pack(fill="x", padx=10, pady=(0, 6))
        ttk.Button(btns, text="Load All", command=self.load_all).pack(side="left")
        ttk.Button(btns, text="Save Current Tab", command=self.save_current_tab).pack(side="left", padx=6)
        ttk.Button(btns, text="Save All", command=self.save_all).pack(side="left")

        # Sekmeler
        self.nb = ttk.Notebook(self)
        self.nb.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Sekmeleri oluştur
        self.tabs = {
            "info": InfoTab(self.nb, self),
            "socials": SocialsTab(self.nb, self),
            "experience": ExperienceTab(self.nb, self),
            "competitions": CompetitionsTab(self.nb, self),
            "projects": ProjectsTab(self.nb, self),
            "certificates": CertificatesTab(self.nb, self),
        }
        self.nb.add(self.tabs["info"], text="Info")
        self.nb.add(self.tabs["socials"], text="Socials")
        self.nb.add(self.tabs["experience"], text="Experience")
        self.nb.add(self.tabs["competitions"], text="Competitions")
        self.nb.add(self.tabs["projects"], text="Projects")
        self.nb.add(self.tabs["certificates"], text="Certificates")

        # İlk yükleme
        self._apply_content_root()
        self.load_all()

        # Kısayollar
        self.bind_all("<Control-s>", lambda e: self.save_current_tab())
        self.bind_all("<Control-S>", lambda e: self.save_current_tab())
        self.bind_all("<Control-Shift-s>", lambda e: self.save_all())

    # -------------------- Content Root helpers --------------------
    def _apply_content_root(self):
        """Entry'deki content root değerini normalize edip repo'ya uygula ve sekmelerde yol bilgisini güncelle."""
        try:
            self.repo.set_content_root(self.path_var.get())
        except Exception as e:
            messagebox.showerror("Content Root", f"Invalid path:\n{e}")
            return
        # Her sekmeye yeni kökü yansıt (Path bar güncellensin)
        for t in self.tabs.values():
            try:
                t.update_target_path()
            except Exception:
                pass

    def _on_browse(self):
        d = filedialog.askdirectory(initialdir=str(self.repo.content_root))
        if d:
            self.path_var.set(d)
            self._apply_content_root()
            self.load_all()

    # -------------------- Public dir helper (tabs için yararlı) --------------------
    def get_public_dir(self) -> str:
        """
        Public kökü döndürür. Örn:
        content_root = .../frontend/public/content  ==> public_dir = .../frontend/public
        """
        return str(self.repo.content_root.parent)

    # -------------------- Load / Save --------------------
    def load_all(self):
        """Tüm sekmeleri repo'dan yeniden yükle."""
        self._apply_content_root()
        for name, tab in self.tabs.items():
            try:
                tab.load()
            except Exception as e:
                messagebox.showwarning("Load", f"Failed to load '{name}':\n{e}")

    def save_current_tab(self):
        """Aktif sekmenin verisini kaydet."""
        self._apply_content_root()
        current_id = self.nb.select()
        current_tab = None
        for t in self.tabs.values():
            if str(t) == current_id:
                current_tab = t
                break
        if current_tab is None:
            return
        self._save_tab(current_tab)

    def save_all(self):
        """Tüm sekmelerin verisini kaydet."""
        self._apply_content_root()
        for tab in self.tabs.values():
            self._save_tab(tab)

    def _save_tab(self, tab):
        """Sekmenin JSON'unu repo'ya yaz (Info serialize, list sekmeleri data)."""
        try:
            name = getattr(tab, "entity_name", None)
            if not name:
                return
            # Önce sekmenin güncel verisini al
            data = None
            if hasattr(tab, "serialize"):
                try:
                    data = tab.serialize()
                except NotImplementedError:
                    # Bazı sekmeler BaseTab.serialize'ı override etmiyor (ListEntityTab gibi).
                    # Bu durumda doğrudan tab.data kullan.
                    data = getattr(tab, "data", None)
            elif hasattr(tab, "data"):
                data = tab.data

            if data is None:
                return

            # Yaz
            out_path = self.repo.save(name, data)
            tab.update_target_path()
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            from tkinter import messagebox
            messagebox.showerror("Save",
                f"Failed to save '{getattr(tab, 'entity_name', '?')}'\n\n{e}\n\n{tb}")


# ------------------------------------------------------------------

if __name__ == "__main__":
    EditorApp().mainloop()
