from __future__ import annotations
from tkinter import ttk
from typing import Any, Dict, List
from widgets.fields import ListPane
from .base_tab import BaseTab

class ListEntityTab(BaseTab):
    columns: List[str] = []
    def __init__(self, master, app):
        super().__init__(master, app)
        wrap = ttk.Frame(self); wrap.pack(fill="both", expand=True, padx=16, pady=8)
        self.wrap = wrap
        self.listpane = ListPane(wrap, columns=self.columns, on_select=self._on_select)
        self.listpane.grid(row=1, column=0, sticky="nsw")
        self.form = self.build_form(wrap)
        self.form.grid(row=1, column=1, sticky="nsew", padx=(12,0))
        btns = ttk.Frame(wrap); btns.grid(row=2, column=1, sticky="e", pady=(8,0))
        ttk.Button(btns, text="New", command=self.new_record).pack(side="left")
        ttk.Button(btns, text="Add / Update", command=self.add_or_update).pack(side="left", padx=8)
        ttk.Button(btns, text="Delete", command=self.delete_selected).pack(side="left")
        wrap.columnconfigure(1, weight=1); wrap.rowconfigure(1, weight=1)
        self.data_list: List[Dict[str, Any]] = []
        self.selected_index: int | None = None
    def build_form(self, parent): raise NotImplementedError
    def record_from_form(self) -> Dict[str, Any]: raise NotImplementedError
    def set_form(self, rec: Dict[str, Any]): raise NotImplementedError
    def summary_row(self, rec: Dict[str, Any]) -> List[Any]: raise NotImplementedError
    def _on_select(self, values):
        if self.data_list:
            for i, r in enumerate(self.data_list):
                if self.summary_row(r) == list(values):
                    self.selected_index = i; self.set_form(r); return
    def load(self):
        data = self.app.repo.load(self.entity_name)
        if isinstance(data, dict): data = [data]
        self.data_list = data; self.refresh_list()
    def refresh_list(self):
        self.listpane.insert_rows([self.summary_row(r) for r in self.data_list])
        self.selected_index = None
    def serialize(self): return self.data_list
    def new_record(self):
        self.selected_index = None; self.set_form(self.app.defaults.record_template(self.entity_name))
    def add_or_update(self):
        rec = self.record_from_form()
        if self.selected_index is None: self.data_list.append(rec)
        else: self.data_list[self.selected_index] = rec
        self.refresh_list()
    def delete_selected(self):
        if self.selected_index is None: return
        del self.data_list[self.selected_index]; self.refresh_list(); self.new_record()