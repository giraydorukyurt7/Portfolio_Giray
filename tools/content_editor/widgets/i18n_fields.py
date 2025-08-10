from __future__ import annotations
import tkinter as tk
from tkinter import ttk

LANGS = ["tr", "en"]

class MultiLangEntry(ttk.LabelFrame):
    def __init__(self, master, label: str):
        super().__init__(master, text=label)
        self.vars = {l: tk.StringVar() for l in LANGS}
        for i, l in enumerate(LANGS):
            ttk.Label(self, text=l.upper()).grid(row=i, column=0, sticky="w")
            ttk.Entry(self, textvariable=self.vars[l], width=48).grid(row=i, column=1, sticky="ew", padx=6, pady=2)
        self.columnconfigure(1, weight=1)
    def get(self):
        return {l: self.vars[l].get().strip() for l in LANGS}
    def set(self, v):
        for l in LANGS:
            self.vars[l].set((v or {}).get(l, ""))

class MultiLangText(ttk.LabelFrame):
    def __init__(self, master, label: str, height: int = 5):
        super().__init__(master, text=label)
        self.txt = {}
        for i, l in enumerate(LANGS):
            ttk.Label(self, text=l.upper()).grid(row=i*2, column=0, sticky="w")
            t = tk.Text(self, height=height, wrap="word")
            t.grid(row=i*2+1, column=0, sticky="nsew", pady=(0,6))
            self.txt[l] = t
        for r in range(1, 4): self.rowconfigure(r, weight=1)
        self.columnconfigure(0, weight=1)
    def get(self):
        return {l: self.txt[l].get("1.0", "end").strip() for l in LANGS}
    def set(self, v):
        for l in LANGS:
            self.txt[l].delete("1.0", "end")
            val = (v or {}).get(l, "")
            if val: self.txt[l].insert("1.0", val)

class MultiLangList(ttk.LabelFrame):
    def __init__(self, master, label: str, height: int = 4):
        super().__init__(master, text=label)
        self.txt = {}
        for i, l in enumerate(LANGS):
            ttk.Label(self, text=f"{l.upper()} (one per line)").grid(row=i*2, column=0, sticky="w")
            t = tk.Text(self, height=height, wrap="word")
            t.grid(row=i*2+1, column=0, sticky="nsew", pady=(0,6))
            self.txt[l] = t
        for r in range(1, 4): self.rowconfigure(r, weight=1)
        self.columnconfigure(0, weight=1)
    def get(self):
        return {l: [x for x in self.txt[l].get("1.0", "end").splitlines() if x.strip()] for l in LANGS}
    def set(self, v):
        for l in LANGS:
            self.txt[l].delete("1.0", "end")
            lines = (v or {}).get(l, [])
            if lines: self.txt[l].insert("1.0", "".join(lines))