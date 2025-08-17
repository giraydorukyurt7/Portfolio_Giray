from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List, Optional
from .base_tab import BaseTab


class ListEntityTab(BaseTab):
    """
    JSON dizisi (list) tutan sekmeler için ortak sınıf.
    Sol: öğe listesi (Treeview)
    Sağ: scrollable form (build_form(parent) ile doldurulur)
    Alt: New / Add-Update / Delete
    Alt+S: Save Current Tab (App menüsünden de var ama kısayol iyi)
    """

    # Alt sınıflar bunları sağlar:
    entity_name = ""          # örn. "projects"
    columns: List[str] = []   # sol tablo başlıkları (summary_row ile uyumlu)

    # ---- Alt sınıfların implement edeceği API ----
    def build_form(self, parent) -> tk.Widget:
        """Form alanını parent içine kur ve form root widget'ını döndür."""
        raise NotImplementedError

    def record_from_form(self) -> Dict[str, Any]:
        """Formdan tek kayıt sözlüğü üret."""
        raise NotImplementedError

    def set_form(self, rec: Dict[str, Any]) -> None:
        """Formu verilen kayıtla doldur (veya boş/None ile temizle)."""
        raise NotImplementedError

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:
        """Sol tablodaki satır karşılığı (self.columns ile aynı uzunlukta)."""
        raise NotImplementedError

    # ---- Kurulum ----
    def __init__(self, master, app):
        super().__init__(master, app)

        # Ana kapsayıcı (pack), içinde grid kullanacağız
        root = ttk.Frame(self)
        root.pack(fill="both", expand=True, padx=10, pady=8)

        # Sol: liste (Treeview)
        left = ttk.Frame(root)
        left.grid(row=0, column=0, sticky="nsw")
        self.tree = ttk.Treeview(left, columns=self.columns, show="headings", height=18)
        for col in self.columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=160, stretch=True)
        ysb = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=ysb.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        ysb.grid(row=0, column=1, sticky="ns")
        left.grid_columnconfigure(0, weight=1)

        # Sağ: scrollable form alanı
        right = ttk.Frame(root)
        right.grid(row=0, column=1, sticky="nsew", padx=(12, 0))

        form_container = self._make_scrollable_form(right)   # <— kaydırılabilir içerik
        self.form = self.build_form(form_container)          # alt sınıf burada grid kullanır

        # Alt buton çubuğu
        btnbar = ttk.Frame(root)
        btnbar.grid(row=1, column=1, sticky="e", pady=(8, 0))
        ttk.Button(btnbar, text="New", command=self._on_new).pack(side="left")
        ttk.Button(btnbar, text="Add / Update", command=self._on_add_update).pack(side="left", padx=8)
        ttk.Button(btnbar, text="Delete", command=self._on_delete).pack(side="left")

        # grid oranları
        root.grid_columnconfigure(0, weight=0)  # sol liste sabit
        root.grid_columnconfigure(1, weight=1)  # sağ form esner
        root.grid_rowconfigure(0, weight=1)

        # Olaylar
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # Veri
        self.data: List[Dict[str, Any]] = []
        self.update_target_path()
        self.load()  # JSON oku ve tabloyu doldur

        # Kısayol: Alt+S bu tabı kaydeder
        self.bind_all("<Alt-s>", lambda e: self._save_only())

    # ---- Sağ form için scroll helper ----
    def _make_scrollable_form(self, parent) -> ttk.Frame:
        """
        parent içine Canvas + dikey scrollbar kurar; içerideki gerçek formu
        yerleştireceğiniz 'content' Frame'ini döndürür.
        """
        canvas = tk.Canvas(parent, highlightthickness=0)
        vsb = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        content = ttk.Frame(canvas)

        # içerik boyutu değiştikçe scrollregion güncelle
        def _on_cfg(_e=None):
            canvas.configure(scrollregion=canvas.bbox("all"))
        content.bind("<Configure>", _on_cfg)

        # fare tekerleği sadece bu alan üzerindeyken çalışsın
        def _bind_wheel(_e):
            content.bind_all("<MouseWheel>", on_wheel)
        def _unbind_wheel(_e):
            content.unbind_all("<MouseWheel>")
        def on_wheel(e):
            canvas.yview_scroll(-int(e.delta/120), "units")

        content.bind("<Enter>", _bind_wheel)
        content.bind("<Leave>", _unbind_wheel)

        canvas.create_window((0, 0), window=content, anchor="nw")
        canvas.configure(yscrollcommand=vsb.set)

        # GRID (parent içinde)
        parent.grid_columnconfigure(0, weight=1)
        parent.grid_rowconfigure(0, weight=1)
        canvas.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")

        return content

    # ---- Veri yükleme / kaydetme ----
    def load(self):
        """JSON'u repo'dan okuyup tabloya basar."""
        items = self.app.repo.load(self.entity_name) or []
        if not isinstance(items, list):
            items = []
        self.data = items
        self._refresh_table()
        # formu temizle
        try:
            self.set_form({})
        except Exception:
            pass

    def _save_only(self):
        """Mevcut self.data'yı dosyaya yazar (UI'dan çağrılır)."""
        self.app.repo.save(self.entity_name, self.data)
        self.update_target_path()

    def _refresh_table(self):
        self.tree.delete(*self.tree.get_children())
        for i, rec in enumerate(self.data):
            values = self.summary_row(rec)
            self.tree.insert("", "end", iid=str(i), values=values)

    # ---- Buton eylemleri ----
    def _on_new(self):
        try:
            self.set_form({})
        except Exception:
            pass
        # seçimi de temizle
        for sel in self.tree.selection():
            self.tree.selection_remove(sel)

    def _on_add_update(self):
        # formdan kayıt çek
        try:
            rec = self.record_from_form()
        except Exception:
            # form eksikse sessiz geçme (kullanıcıyı rahatsız etmeyelim)
            return

        # seçili satır varsa update, yoksa append
        sel = self.tree.selection()
        if sel:
            idx = int(sel[0])
            if 0 <= idx < len(self.data):
                self.data[idx] = rec
        else:
            self.data.append(rec)

        # kaydet + tabloyu yenile
        self._save_only()
        self._refresh_table()

    def _on_delete(self):
        sels = sorted([int(s) for s in self.tree.selection()], reverse=True)
        if not sels:
            return
        for idx in sels:
            if 0 <= idx < len(self.data):
                del self.data[idx]
        self._save_only()
        self._refresh_table()
        self._on_new()

    def _on_select(self, _event=None):
        sel = self.tree.selection()
        if not sel:
            return
        idx = int(sel[0])
        if 0 <= idx < len(self.data):
            try:
                self.set_form(self.data[idx])
            except Exception:
                pass