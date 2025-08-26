# widgets/scrollable.py
# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk

class ScrollableFrame(ttk.Frame):
    """Canvas+Frame ile dikey kaydırılabilir konteyner."""
    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.canvas = tk.Canvas(self, highlightthickness=0)
        self.v_scroll = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.interior = ttk.Frame(self.canvas)

        self._win_id = self.canvas.create_window((0, 0), window=self.interior, anchor="nw")
        self.canvas.configure(yscrollcommand=self.v_scroll.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.v_scroll.pack(side="right", fill="y")

        self.interior.bind("<Configure>", self._on_frame_configure)
        self.canvas.bind("<Configure>", self._on_canvas_configure)

        # Mouse wheel (Win/Mac/Linux)
        self._bind_mousewheel(self.canvas)

    def _on_frame_configure(self, _=None):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _on_canvas_configure(self, _=None):
        self.canvas.itemconfig(self._win_id, width=self.canvas.winfo_width())

    # --- wheel bindings ---
    def _bind_mousewheel(self, widget):
        widget.bind_all("<MouseWheel>", self._on_mousewheel_windows_mac, add="+")
        widget.bind_all("<Button-4>", self._on_mousewheel_linux, add="+")
        widget.bind_all("<Button-5>", self._on_mousewheel_linux, add="+")

    def _on_mousewheel_windows_mac(self, event):
        self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")

    def _on_mousewheel_linux(self, event):
        if event.num == 4:
            self.canvas.yview_scroll(-3, "units")
        elif event.num == 5:
            self.canvas.yview_scroll(3, "units")
