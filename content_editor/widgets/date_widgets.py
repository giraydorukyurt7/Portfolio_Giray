from __future__ import annotations
import tkinter as tk
from tkinter import ttk
from datetime import datetime
import calendar
from typing import Optional, Tuple

def _zr(n: int) -> str:
    return f"{n:02d}"

def _parse_any_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    s = str(s).strip()
    fmts = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y", "%Y-%m", "%Y/%m", "%Y"]
    for f in fmts:
        try:
            dt = datetime.strptime(s, f)
            if f in ("%Y-%m", "%Y/%m"):
                dt = datetime(dt.year, dt.month, 1)
            if f in ("%Y",):
                dt = datetime(dt.year, 1, 1)
            return dt
        except Exception:
            pass
    return None

class DatePicker(ttk.Labelframe):
    """
    Gün/Ay/Yıl combobox'larıyla tek tarih seçici.
    Varsayılan yıl aralığı: 2020 .. (bugünün yılı + 5)
    """
    def __init__(self, master, title: str = "Date", year_min: int = 2020, year_max: Optional[int] = None):
        super().__init__(master, text=title)
        if year_max is None:
            year_max = datetime.now().year + 5

        # UI vars
        self.var_day = tk.StringVar()
        self.var_mon = tk.StringVar()
        self.var_year = tk.StringVar()

        # --- Day
        ttk.Label(self, text="Day").grid(row=0, column=0, sticky="w")
        self.cb_day = ttk.Combobox(
            self, width=6, textvariable=self.var_day, state="readonly",
            values=[""] + [_zr(d) for d in range(1, 32)]
        )
        self.cb_day.grid(row=0, column=1, padx=(6, 12), sticky="w")

        # --- Month
        ttk.Label(self, text="Month").grid(row=0, column=2, sticky="w")
        self.cb_mon = ttk.Combobox(
            self, width=8, textvariable=self.var_mon, state="readonly",
            values=[""] + [_zr(m) for m in range(1, 12 + 1)]
        )
        self.cb_mon.grid(row=0, column=3, padx=(6, 12), sticky="w")

        # --- Year
        ttk.Label(self, text="Year").grid(row=0, column=4, sticky="w")
        self.cb_year = ttk.Combobox(
            self, width=8, textvariable=self.var_year, state="readonly",
            values=[""] + [str(y) for y in range(year_max, year_min - 1, -1)]
        )
        self.cb_year.grid(row=0, column=5, padx=(6, 0), sticky="w")

        # sync day count when year/month changes
        self.cb_mon.bind("<<ComboboxSelected>>", self._sync_days)
        self.cb_year.bind("<<ComboboxSelected>>", self._sync_days)

        for i in range(6):
            self.grid_columnconfigure(i, weight=0)

    def _sync_days(self, _e=None):
        try:
            y = int(self.var_year.get())
            m = int(self.var_mon.get())
            _, last = calendar.monthrange(y, m)
            current = self.var_day.get()
            vals = [""] + [_zr(d) for d in range(1, last + 1)]
            self.cb_day["values"] = vals
            if current and current not in vals:
                self.var_day.set(_zr(last))
        except Exception:
            self.cb_day["values"] = [""] + [_zr(d) for d in range(1, 32)]

    def clear(self):
        self.var_day.set(""); self.var_mon.set(""); self.var_year.set("")

    def set(self, date_str: Optional[str]):
        if not date_str:
            self.clear(); return
        dt = _parse_any_date(date_str)
        if not dt:
            self.clear(); return
        self.var_year.set(str(dt.year))
        self.var_mon.set(_zr(dt.month))
        self._sync_days()
        self.var_day.set(_zr(dt.day))

    def get(self) -> str:
        y = self.var_year.get().strip()
        m = self.var_mon.get().strip()
        d = self.var_day.get().strip()
        if not (y and m and d):
            return ""
        return f"{y}-{m}-{d}"

    def get_iso_unix(self) -> Tuple[Optional[str], Optional[int]]:
        s = self.get()
        if not s:
            return None, None
        try:
            dt = datetime.strptime(s, "%Y-%m-%d")
            return dt.strftime("%Y-%m-%d"), int(dt.timestamp())
        except Exception:
            return None, None

    def set_enabled(self, enabled: bool):
        state = "readonly" if enabled else "disabled"
        for cb in (self.cb_day, self.cb_mon, self.cb_year):
            cb.configure(state=state)

class DateRangePicker(ttk.Labelframe):
    """Başlangıç–Bitiş + Present destekli tarih aralığı seçici (yıl min=2020)."""
    def __init__(self, master, title: str = "Date Range"):
        super().__init__(master, text=title)
        self.start = DatePicker(self, title="Start", year_min=2020)
        self.end = DatePicker(self, title="End", year_min=2020)
        self.var_present = tk.BooleanVar(value=False)
        self.chk_present = ttk.Checkbutton(self, text="Present (ongoing)", variable=self.var_present,
                                           command=self._toggle_present)

        self.start.grid(row=0, column=0, sticky="w")
        self.end.grid(row=0, column=1, padx=(12, 0), sticky="w")
        self.chk_present.grid(row=1, column=1, sticky="w", pady=(6, 0))

        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=0)

    def _toggle_present(self):
        is_present = bool(self.var_present.get())
        self.end.set_enabled(not is_present)

    def get(self) -> dict:
        s = self.start.get()
        e = self.end.get() if not self.var_present.get() else ""
        si, su = self.start.get_iso_unix()
        ei, eu = (self.end.get_iso_unix() if e else (None, None))
        return {
            "start": s, "end": e, "present": bool(self.var_present.get()),
            "start_iso": si, "start_unix": su,
            "end_iso": ei, "end_unix": eu,
        }

    def set(self, start: Optional[str], end: Optional[str], present: bool = False):
        self.start.set(start)
        self.end.set(end)
        self.var_present.set(bool(present) or (start and not end))
        self._toggle_present()
