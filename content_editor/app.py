from __future__ import annotations
import importlib
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import tkinter.font as tkfont

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
from tabs.courses_tab import CoursesTab          # (varsa; teknik dersler sekmesi)

class EditorApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Portfolio JSON Editor")
        self.geometry("1200x720")

        # ---- Tema / Stil ----
        self._init_theme()

        # Repository (içerik kökü otomatik tespit)
        self.repo = Repository(autodetect_content_root())

        # Üst bar: Content Root + butonlar
        top_bar = ttk.Frame(self, padding=(10, 8))
        top_bar.pack(fill="x")

        ttk.Label(top_bar, text="Content Root:").pack(side="left")
        self.path_var = tk.StringVar(value=str(self.repo.content_root))
        self.path_entry = ttk.Entry(top_bar, textvariable=self.path_var, width=120)
        self.path_entry.pack(side="left", fill="x", expand=True, padx=(6, 6))
        self.path_entry.bind("<Return>", lambda e: (self._apply_content_root(), self.load_all()))
        ttk.Button(top_bar, text="Browse...", command=self._on_browse).pack(side="left", padx=(0, 8))

        # Dark mode toggle
        self.dark_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(top_bar, text="Dark", variable=self.dark_var, command=self._toggle_theme, style="Switch.TCheckbutton").pack(side="right")

        # Sağ tarafta genel butonlar
        btns = ttk.Frame(self, padding=(10, 0))
        btns.pack(fill="x", pady=(0, 6))

        ttk.Button(btns, text="Load All", command=self.load_all, style="Accent.TButton").pack(side="left")

        self.btn_save_current = ttk.Button(btns, text="Save Current Tab", command=self.save_current_tab)
        self.btn_save_current.pack(side="left", padx=6)

        self.lbl_save_current_ok = ttk.Label(btns, text="", style="Ok.TLabel", width=12, anchor="w")
        self.lbl_save_current_ok.pack(side="left", padx=(2, 12))

        self.btn_save_all = ttk.Button(btns, text="Save All", command=self.save_all)
        self.btn_save_all.pack(side="left")

        self.lbl_save_all_ok = ttk.Label(btns, text="", style="Ok.TLabel", width=12, anchor="w")
        self.lbl_save_all_ok.pack(side="left")

        ttk.Separator(self).pack(fill="x")

        # Sekmeler
        self.nb = ttk.Notebook(self)
        self.nb.pack(fill="both", expand=True, padx=10, pady=(10, 12))

        self.tabs = {
            "info": InfoTab(self.nb, self),
            "socials": SocialsTab(self.nb, self),
            "experience": ExperienceTab(self.nb, self),
            "competitions": CompetitionsTab(self.nb, self),
            "projects": ProjectsTab(self.nb, self),
            "certificates": CertificatesTab(self.nb, self),
        }

        # courses_tab.py dosyan varsa sekmeyi ekleyelim
        self._try_mount_courses_tab()

        self.nb.add(self.tabs["info"], text="Info")
        self.nb.add(self.tabs["socials"], text="Socials")
        self.nb.add(self.tabs["experience"], text="Experience")
        self.nb.add(self.tabs["competitions"], text="Competitions")
        self.nb.add(self.tabs["projects"], text="Projects")
        self.nb.add(self.tabs["certificates"], text="Certificates")
        if "courses" in self.tabs:
            self.nb.add(self.tabs["courses"], text="Technical Courses")

        # Stack tab varsa opsiyonel ekle
        self._try_mount_stack_tab()

        # İlk yükleme
        self._apply_content_root()
        self.load_all()

        # Kısayollar
        self.bind_all("<Control-s>", lambda e: self.save_current_tab())
        self.bind_all("<Control-S>", lambda e: self.save_current_tab())
        self.bind_all("<Control-Shift-s>", lambda e: self.save_all())

    # -------------------- THEME --------------------
    def _init_theme(self):
        try:
            tkfont.nametofont("TkDefaultFont").configure(family="Segoe UI", size=10)
            tkfont.nametofont("TkTextFont").configure(family="Segoe UI", size=10)
            tkfont.nametofont("TkFixedFont").configure(family="Cascadia Mono", size=10)
        except Exception:
            pass

        s = ttk.Style(self)
        base_parent = "clam" if "clam" in s.theme_names() else s.theme_use()

        def create_theme(name: str, pal: dict):
            s.theme_create(name, parent=base_parent, settings={
                "TFrame": {"configure": {"background": pal["bg"]}},
                "TLabel": {"configure": {"background": pal["bg"], "foreground": pal["fg"]}},
                "Ok.TLabel": {"configure": {"background": pal["bg"], "foreground": pal["success"]}},
                "Path.TLabel": {"configure": {"background": pal["bg"], "foreground": pal["muted"]}},
                "TEntry": {"configure": {
                    "fieldbackground": pal["input_bg"], "foreground": pal["fg"],
                    "bordercolor": pal["border"], "lightcolor": pal["bg"], "darkcolor": pal["bg"],
                    "padding": (8, 6),
                }},
                "TButton": {"configure": {
                    "padding": (12, 7), "background": pal["button_bg"], "foreground": pal["button_fg"],
                    "focuscolor": pal["accent"], "borderwidth": 1, "relief": "flat"
                }, "map": {
                    "background": [("active", pal["button_bg_active"]), ("pressed", pal["button_bg_active"])],
                    "foreground": [("disabled", pal["muted"])],
                    "bordercolor": [("focus", pal["accent"]), ("!focus", pal["border"])],
                }},
                "Accent.TButton": {"configure": {
                    "background": pal["accent"], "foreground": pal["accent_fg"]
                }, "map": {
                    "background": [("active", pal["accent_active"]), ("pressed", pal["accent_active"])],
                }},
                "TCheckbutton": {"configure": {"background": pal["bg"], "foreground": pal["fg"]}},
                "Switch.TCheckbutton": {"configure": {"background": pal["bg"], "foreground": pal["fg"]}},
                "TNotebook": {"configure": {"background": pal["bg"], "tabmargins": (2, 8, 2, 0)}},
                "TNotebook.Tab": {"configure": {
                    "padding": (16, 10), "background": pal["tab_bg"], "foreground": pal["fg"]
                }, "map": {
                    "background": [("selected", pal["bg"]), ("active", pal["tab_bg_active"])],
                    "foreground": [("selected", pal["fg"])],
                }},
                "Treeview": {"configure": {
                    "background": pal["bg"], "fieldbackground": pal["bg"], "foreground": pal["fg"],
                    "rowheight": 26, "bordercolor": pal["border"], "lightcolor": pal["bg"], "darkcolor": pal["bg"]
                }},
                "Treeview.Heading": {"configure": {
                    "padding": (10, 8), "background": pal["header_bg"], "foreground": pal["header_fg"], "relief": "flat"
                }},
                "Separator": {"configure": {"background": pal["border"]}},
                "Card.TFrame": {"configure": {
                    "background": pal["card_bg"], "borderwidth": 1, "relief": "solid"
                }},
                "TLabelframe": {"configure": {"background": pal["card_bg"]}},
                "TLabelframe.Label": {"configure": {"background": pal["card_bg"], "foreground": pal["fg"]}},
            })

        light = {
            "bg": "#f7f8fa", "card_bg": "#ffffff", "fg": "#0f172a", "muted": "#64748b",
            "border": "#e5e7eb", "accent": "#2563eb", "accent_active": "#1d4ed8", "accent_fg": "#ffffff",
            "button_bg": "#ffffff", "button_bg_active": "#f3f4f6", "button_fg": "#0f172a",
            "input_bg": "#ffffff", "tab_bg": "#eef2f6", "tab_bg_active": "#e7ebf0",
            "header_bg": "#eef2f6", "header_fg": "#0f172a", "success": "#16a34a",
        }
        dark = {
            "bg": "#0b1220", "card_bg": "#111827", "fg": "#e5e7eb", "muted": "#94a3b8",
            "border": "#1f2937", "accent": "#60a5fa", "accent_active": "#3b82f6", "accent_fg": "#0b1220",
            "button_bg": "#0f172a", "button_bg_active": "#1f2937", "button_fg": "#e5e7eb",
            "input_bg": "#0f172a", "tab_bg": "#0f172a", "tab_bg_active": "#1f2937",
            "header_bg": "#0f172a", "header_fg": "#e5e7eb", "success": "#22c55e",
        }
        create_theme("portfolio-light", light)
        create_theme("portfolio-dark", dark)
        s.theme_use("portfolio-light")
        s.configure("Ok.TLabel", foreground=light["success"])

    def _toggle_theme(self):
        s = ttk.Style(self)
        s.theme_use("portfolio-dark" if self.dark_var.get() else "portfolio-light")

    def _apply_content_root(self):
        try:
            self.repo.set_content_root(self.path_var.get())
        except Exception as e:
            messagebox.showerror("Content Root", f"Invalid path:\n{e}")
            return
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

    def get_public_dir(self) -> str:
        return str(self.repo.content_root.parent)

    def load_all(self):
        self._apply_content_root()
        for name, tab in self.tabs.items():
            try:
                tab.load()
            except Exception as e:
                messagebox.showwarning("Load", f"Failed to load '{name}':\n{e}")

    def save_current_tab(self):
        self._apply_content_root()
        current_id = self.nb.select()
        current_tab = None
        for t in self.tabs.values():
            if str(t) == current_id:
                current_tab = t
                break
        if current_tab is None:
            return
        ok = self._save_tab(current_tab)
        if ok:
            self._flash_ok(self.lbl_save_current_ok, which="current", text="Saved ✓")

    def save_all(self):
        self._apply_content_root()
        all_ok = True
        for tab in self.tabs.values():
            ok = self._save_tab(tab)
            all_ok = all_ok and ok
        if all_ok:
            self._flash_ok(self.lbl_save_all_ok, which="all", text="Saved ✓")

    def _save_tab(self, tab) -> bool:
        try:
            name = getattr(tab, "entity_name", None)
            if not name:
                return False

            data = None
            if hasattr(tab, "serialize"):
                try:
                    data = tab.serialize()
                except NotImplementedError:
                    data = getattr(tab, "data", None)
            elif hasattr(tab, "data"):
                data = tab.data
            if data is None:
                return False

            self.repo.save(name, data)
            tab.update_target_path()
            return True

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            messagebox.showerror("Save",
                f"Failed to save '{getattr(tab, 'entity_name', '?')}'\n\n{e}\n\n{tb}")
            return False

    def _try_mount_stack_tab(self):
        try:
            mod = importlib.import_module("tabs.stack_tab")
            StackTab = getattr(mod, "StackTab", None)
            if StackTab is None:
                return
            self.tabs["stack"] = StackTab(self.nb, self)
            self.nb.add(self.tabs["stack"], text="Stack")
        except Exception:
            pass

    def _try_mount_courses_tab(self):
        try:
            mod = importlib.import_module("tabs.courses_tab")
            CoursesTab = getattr(mod, "CoursesTab", None)
            if CoursesTab is None:
                return
            self.tabs["courses"] = CoursesTab(self.nb, self)
        except Exception:
            pass

    def _flash_ok(self, label: ttk.Label, which: str, text: str = "Saved ✓"):
        if which == "current" and hasattr(self, "_after_id_save_current") and self._after_id_save_current:
            try: self.after_cancel(self._after_id_save_current)
            except Exception: pass
        if which == "all" and hasattr(self, "_after_id_save_all") and self._after_id_save_all:
            try: self.after_cancel(self._after_id_save_all)
            except Exception: pass

        label.config(text=text)
        def clear():
            try: label.config(text="")
            except Exception: pass
        after_id = self.after(3000, clear)
        if which == "current":
            self._after_id_save_current = after_id
        else:
            self._after_id_save_all = after_id


if __name__ == "__main__":
    EditorApp().mainloop()
