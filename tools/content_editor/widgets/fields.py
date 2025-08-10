from __future__ import annotations
import tkinter as tk
from tkinter import ttk

class LabeledEntry(ttk.Frame):
    def __init__(self, master, text: str, width: int = 40):
        super().__init__(master)
        ttk.Label(self, text=text).grid(row=0, column=0, sticky="w", padx=(0,8))
        self.var = tk.StringVar()
        ttk.Entry(self, textvariable=self.var, width=width).grid(row=0, column=1, sticky="ew")
        self.columnconfigure(1, weight=1)
    def get(self): return self.var.get().strip()
    def set(self, v: str): self.var.set(v or "")

class LabeledText(ttk.Frame):
    def __init__(self, master, text: str, height: int = 5, width: int = 60):
        super().__init__(master)
        ttk.Label(self, text=text).grid(row=0, column=0, sticky="w", padx=(0,8))
        self.t = tk.Text(self, height=height, width=width, wrap="word")
        self.t.grid(row=1, column=0, sticky="nsew")
        self.rowconfigure(1, weight=1)
        self.columnconfigure(0, weight=1)
    def get(self): return self.t.get("1.0", "end").strip()
    def set(self, v: str):
        self.t.delete("1.0", "end")
        if v: self.t.insert("1.0", v)

class DateRange(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.sv, self.ev, self.pv = tk.StringVar(), tk.StringVar(), tk.BooleanVar(False)
        ttk.Label(self, text="Start (YYYY-MM)").grid(row=0, column=0, sticky="w")
        ttk.Entry(self, textvariable=self.sv, width=12).grid(row=0, column=1, padx=6)
        ttk.Label(self, text="End (YYYY-MM)").grid(row=0, column=2, sticky="w")
        self.end_e = ttk.Entry(self, textvariable=self.ev, width=12)
        self.end_e.grid(row=0, column=3, padx=6)
        ttk.Checkbutton(self, text="Present", variable=self.pv, command=self._toggle).grid(row=0, column=4, padx=(8,0))
    def _toggle(self): self.end_e.config(state=("disabled" if self.pv.get() else "normal"))
    def get(self): return {"start": self.sv.get().strip(), "end": ("" if self.pv.get() else self.ev.get().strip()), "present": bool(self.pv.get())}
    def set(self, s: str, e: str, p: bool):
        self.sv.set(s or ""); self.pv.set(bool(p)); self.ev.set(e or ""); self._toggle()

class PathBar(ttk.Frame):
    def __init__(self, master):
        super().__init__(master)
        self.var = tk.StringVar()
        ttk.Label(self, textvariable=self.var, foreground="#2563eb").pack(anchor="w")
    def set_text(self, t: str): self.var.set(t)

class ListPane(ttk.Frame):
    def __init__(self, master, columns, on_select):
        super().__init__(master)
        self.on_select = on_select
        self.tree = ttk.Treeview(self, columns=columns, show="headings", height=14)
        for c in columns:
            self.tree.heading(c, text=c); self.tree.column(c, width=140, anchor="w")
        self.tree.bind("<<TreeviewSelect>>", self._sel)
        self.tree.grid(row=0, column=0, sticky="nsew")
        sb = ttk.Scrollbar(self, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=sb.set)
        sb.grid(row=0, column=1, sticky="ns")
        self.columnconfigure(0, weight=1); self.rowconfigure(0, weight=1)
    def _sel(self, _):
        s = self.tree.selection();
        if not s: return
        self.on_select(self.tree.item(s[0]).get("values", {}))
    def clear(self):
        for i in self.tree.get_children(): self.tree.delete(i)
    def insert_rows(self, rows):
        self.clear()
        for r in rows: self.tree.insert("", "end", values=r)