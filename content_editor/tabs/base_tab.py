from __future__ import annotations
import os
import tkinter as tk
from tkinter import ttk
from widgets.fields import PathBar

class BaseTab(ttk.Frame):
    """
    Tüm sekmelerin ortak tab sınıfı.
    - make_scrollable(parent): Sağ form paneli için kaydırılabilir bir Frame döndürür (GRID uyumlu).
    - public_dir() / images_dir(): frontend/public ve images yol yardımcıları.
    """
    entity_name = ""

    def __init__(self, master, app):
        super().__init__(master)
        self.app = app

        # Üstte hedef dosya yolu gösterimi
        self.path_bar = PathBar(self)
        self.path_bar.pack(fill="x", padx=12, pady=(12, 4))

    # ---- UI helpers ---------------------------------------------------------
    def make_scrollable(self, parent: tk.Widget) -> ttk.Frame:
        """
        parent içine GRID ile yerleşen, dikey kaydırılabilir bir içerik alanı döndürür.
        Dönen Frame'e normal grid() ile alanlarınızı ekleyin.
        """
        # parent, list_tab içinde grid ile kullanılıyor; burada da grid kullanıyoruz
        if isinstance(parent, (ttk.Frame, tk.Frame)):
            parent.grid_columnconfigure(0, weight=1)
            parent.grid_rowconfigure(0, weight=1)

        canvas = tk.Canvas(parent, highlightthickness=0)
        vsb = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        content = ttk.Frame(canvas)

        # içerik boyutu değiştikçe scrollregion güncelle
        def _on_config(_event=None):
            canvas.configure(scrollregion=canvas.bbox("all"))
        content.bind("<Configure>", _on_config)

        # canvas içine frame'i yerleştir
        canvas.create_window((0, 0), window=content, anchor="nw")
        canvas.configure(yscrollcommand=vsb.set)

        # GRID (pack KULLANMA!)
        canvas.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")

        # Mouse wheel kaydırma
        def _on_mousewheel(e):
            # Windows delta 120'lik birimlerdedir
            canvas.yview_scroll(-int(e.delta / 120), "units")
        content.bind_all("<MouseWheel>", _on_mousewheel)

        return content

    # ---- Path bar -----------------------------------------------------------
    def update_target_path(self):
        """Sekmenin hedef JSON dosyasını üstte göster."""
        try:
            p = self.app.repo.path_for(self.entity_name)
        except Exception:
            p = "(unknown)"
        self.path_bar.set_text(f"→ {p}")

    # ---- Abstracts ----------------------------------------------------------
    def load(self):
        raise NotImplementedError

    def serialize(self):
        raise NotImplementedError

    # ---- FS helpers ---------------------------------------------------------
    def public_dir(self) -> str:
        """
        .../frontend/public (Content Root: .../frontend/public/content)
        """
        info_json = self.app.repo.path_for("info")  # .../public/content/info.json
        content_dir = os.path.dirname(info_json)
        return os.path.dirname(content_dir)

    def images_dir(self, tab_key: str) -> str:
        """
        .../frontend/public/images/<tab_key> (yoksa oluşturur)
        """
        d = os.path.join(self.public_dir(), "images", tab_key)
        os.makedirs(d, exist_ok=True)
        return d