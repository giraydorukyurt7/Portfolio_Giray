from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from typing import Any, Dict, List
from .base_tab import BaseTab


class ListEntityTab(BaseTab):
    entity_name = ""
    columns: List[str] = []

    def build_form(self, parent) -> tk.Widget:  # override
        raise NotImplementedError

    def record_from_form(self) -> Dict[str, Any]:  # override
        raise NotImplementedError

    def set_form(self, rec: Dict[str, Any]) -> None:  # override
        raise NotImplementedError

    def summary_row(self, rec: Dict[str, Any]) -> List[Any]:  # override
        raise NotImplementedError

    def __init__(self, master, app):
        super().__init__(master, app)

        root = ttk.Frame(self)
        root.pack(fill="both", expand=True, padx=10, pady=8)

        # Sol liste
        left = ttk.Frame(root)
        left.grid(row=0, column=0, sticky="nsew")  # ⬅️ nsw -> nsew
        self.tree = ttk.Treeview(left, columns=self.columns, show="headings", height=18)
        for col in self.columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=160, stretch=True)
        ysb = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=ysb.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        ysb.grid(row=0, column=1, sticky="ns")
        left.grid_columnconfigure(0, weight=1)
        left.grid_rowconfigure(0, weight=1)       # ⬅️ sol panel dikeyde tam dolsun

        # Sağ scrollable form alanı
        right = ttk.Frame(root)
        right.grid(row=0, column=1, sticky="nsew", padx=(12, 0))

        form_container = self._make_scrollable_form(right)   # Canvas içindeki 'content' frame
        self.form = self.build_form(form_container)          # Alt sınıf burada root frame döndürüyor

        # ÖNEMLİ: dönen form root’u content’e yerleştir (aksi halde görünmez)
        try:
            if not self.form.winfo_manager():  # henüz pack/grid yapılmadıysa
                self.form.grid(row=0, column=0, sticky="nsew")
        except Exception:
            pass
        form_container.columnconfigure(0, weight=1)

        # Alt buton çubuğu
        btnbar = ttk.Frame(root)
        btnbar.grid(row=1, column=1, sticky="e", pady=(8, 0))
        ttk.Button(btnbar, text="New", command=self._on_new).pack(side="left")
        ttk.Button(btnbar, text="Add / Update", command=self._on_add_update).pack(side="left", padx=8)
        ttk.Button(btnbar, text="Delete", command=self._on_delete).pack(side="left")

        # grid oranları
        root.grid_columnconfigure(0, weight=0)
        root.grid_columnconfigure(1, weight=1)
        root.grid_rowconfigure(0, weight=1)

        # Olaylar
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # Veri
        self.data: List[Dict[str, Any]] = []
        self.update_target_path()
        self.load()

        # Kısayol
        self.bind_all("<Alt-s>", lambda e: self._save_only())

    def _make_scrollable_form(self, parent) -> ttk.Frame:
       canvas = tk.Canvas(parent, highlightthickness=0)
       vsb = ttk.Scrollbar(parent, orient="vertical", command=canvas.yview)
       content = ttk.Frame(canvas)
    
       # 1) İçeriği canvas'a yerleştir ve pencere id'sini tut
       window_id = canvas.create_window((0, 0), window=content, anchor="nw")
    
       # 2) İçerik boyu değişince scrollregion güncelle
       def _on_cfg(_e=None):
           canvas.configure(scrollregion=canvas.bbox("all"))
       content.bind("<Configure>", _on_cfg)
    
       # 3) Canvas genişleyince iç pencerenin genişliğini eşitle (boşlukları yok eder)
       def _on_canvas_resize(e):
           canvas.itemconfigure(window_id, width=e.width)
       canvas.bind("<Configure>", _on_canvas_resize)
    
       # 4) Mouse wheel sadece form üzerindeyken çalışsın
       def on_wheel(e): canvas.yview_scroll(-int(e.delta/120), "units")
       def bind_wheel(_): content.bind_all("<MouseWheel>", on_wheel)
       def unbind_wheel(_): content.unbind_all("<MouseWheel>")
       content.bind("<Enter>", bind_wheel)
       content.bind("<Leave>", unbind_wheel)
    
       # Yerleşim
       parent.grid_columnconfigure(0, weight=1)
       parent.grid_rowconfigure(0, weight=1)
       canvas.grid(row=0, column=0, sticky="nsew")
       vsb.grid(row=0, column=1, sticky="ns")
    
       # İç formun kendi kolonunu esnet
       content.columnconfigure(0, weight=1)
    
       return content


    # ---- Data IO ----
    def load(self):
        items = self.app.repo.load(self.entity_name) or []
        if not isinstance(items, list):
            items = []
        self.data = items
        self._refresh_table()
        try:
            self.set_form({})
        except Exception:
            pass

    def _save_only(self):
        self.app.repo.save(self.entity_name, self.data)
        self.update_target_path()

    def _refresh_table(self):
        self.tree.delete(*self.tree.get_children())
        for i, rec in enumerate(self.data):
            self.tree.insert("", "end", iid=str(i), values=self.summary_row(rec))

    # ---- Actions ----
    def _on_new(self):
        try:
            self.set_form({})
        except Exception:
            pass
        for sel in self.tree.selection():
            self.tree.selection_remove(sel)

    def _on_add_update(self):
        try:
            rec = self.record_from_form()
        except Exception:
            return
        sel = self.tree.selection()
        if sel:
            idx = int(sel[0])
            if 0 <= idx < len(self.data):
                self.data[idx] = rec
        else:
            self.data.append(rec)
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
