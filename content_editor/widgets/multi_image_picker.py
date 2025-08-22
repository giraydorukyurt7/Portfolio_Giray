# widgets/multi_image_picker.py
from __future__ import annotations
import os, re, shutil, tkinter as tk
from tkinter import ttk, filedialog, simpledialog, messagebox
from typing import Callable, List, Dict, Optional, Tuple

try:
    from tkinterdnd2 import DND_FILES  # type: ignore
    DND_OK = True
except Exception:
    DND_OK = False

try:
    from PIL import Image
    PIL_OK = True
except Exception:
    PIL_OK = False


def _sanitize(name: str) -> str:
    name = (name or "").strip().replace(" ", "_")
    return re.sub(r"[^0-9A-Za-zÇĞİÖŞÜçğıöşü_-]+", "", name) or "image"


def _is_url(s: str) -> bool:
    s = (s or "").strip().lower()
    return s.startswith("http://") or s.startswith("https://")


class MultiImagePicker(ttk.LabelFrame):
    """
    Çoklu görsel yöneticisi.
    - Add Files… / sürükle-bırak: yerel dosyaları listeye ekler (kaydetme anında PNG'e dönüştürüp kopyalar)
    - Add URL… : URL'i listeye ekler
    - Set as Cover: listedeki seçili öğeyi kapak/logo yapar
    - Remove, Up, Down: düzenleme
    get() -> {"images": [..], "cover": str|None}
    set(images, cover) -> mevcut değerleri yükler
    """
    def __init__(
        self,
        master,
        public_dir_cb: Callable[[], str],
        tab_key: str,
        name_cb: Callable[[], str],
        title: str = "Images",
    ):
        super().__init__(master, text=title)
        self.public_dir_cb = public_dir_cb
        self.tab_key = tab_key
        self.name_cb = name_cb

        # internal model: list of {"kind": "existing"|"local"|"url", "value": str}
        self.items: List[Dict[str, str]] = []
        self.cover_idx: Optional[int] = None

        # UI: controls row
        btns = ttk.Frame(self); btns.grid(row=0, column=0, sticky="ew", padx=6, pady=(6, 4))
        ttk.Button(btns, text="Add Files…", command=self._browse).pack(side="left")
        ttk.Button(btns, text="Add URL…", command=self._add_url_dialog).pack(side="left", padx=6)
        ttk.Button(btns, text="Set as Cover", command=self._set_cover).pack(side="left")
        ttk.Button(btns, text="Remove", command=self._remove).pack(side="left", padx=(6,0))
        ttk.Button(btns, text="Up", command=lambda: self._move(-1)).pack(side="left", padx=6)
        ttk.Button(btns, text="Down", command=lambda: self._move(1)).pack(side="left")

        # list + scrollbar
        self.listbox = tk.Listbox(self, height=6)
        sb = ttk.Scrollbar(self, orient="vertical", command=self.listbox.yview)
        self.listbox.configure(yscrollcommand=sb.set)
        self.listbox.grid(row=1, column=0, sticky="nsew", padx=(6,0), pady=(0,6))
        sb.grid(row=1, column=1, sticky="ns", pady=(0,6))

        # drop area (optional)
        self.drop = tk.Label(self, text="Drop images here", relief="ridge", bd=1, height=3, anchor="center")
        self.drop.grid(row=2, column=0, columnspan=2, sticky="ew", padx=6, pady=(0,6))
        if DND_OK:
            self.drop.drop_target_register(DND_FILES)  # type: ignore
            self.drop.dnd_bind("<<Drop>>", self._on_drop)  # type: ignore
        else:
            self.drop.configure(text="(Install tkinterdnd2 for drag&drop)")

        # cover indicator
        self.cover_lbl = ttk.Label(self, text="Cover: —")
        self.cover_lbl.grid(row=3, column=0, columnspan=2, sticky="w", padx=6, pady=(0,8))

        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

    # ---------- Public API ----------
    def set(self, images: Optional[List[str]], cover: Optional[str]):
        self.items.clear()
        self.cover_idx = None
        images = images or []
        for val in images:
            self.items.append({"kind": "existing", "value": val})
        if cover:
            # kapak olarak tam eşleşen ilk index
            for i, it in enumerate(self.items):
                if it["value"] == cover:
                    self.cover_idx = i
                    break
        self._refresh()

    def get(self) -> Dict[str, Optional[List[str]]]:
        """
        Yerelleri PNG'e dönüştürüp kopyalar, images listesi ve kapak döner.
        """
        images_out: List[str] = []
        public_dir = self.public_dir_cb()
        images_dir = os.path.join(public_dir, "images", self.tab_key)
        os.makedirs(images_dir, exist_ok=True)
        base = _sanitize(self.name_cb())

        # locals için sıra bazlı sabit isimler üret (overwrite)
        local_counter = 0
        local_name_map: Dict[int, str] = {}

        for idx, it in enumerate(self.items):
            kind, val = it["kind"], it["value"]
            if kind == "existing":
                images_out.append(val.replace("\\", "/"))
            elif kind == "url":
                images_out.append(val)
            else:  # local
                local_counter += 1
                filename = f"{base}_{local_counter}.png"
                dst = os.path.join(images_dir, filename)
                # convert/copy
                try:
                    if PIL_OK:
                        im = Image.open(val)
                        try:
                            im = im.convert("RGBA")
                        except Exception:
                            pass
                        im.save(dst, format="PNG")
                    else:
                        shutil.copyfile(val, dst)
                except Exception as e:
                    messagebox.showerror("Image Save", f"Could not save {os.path.basename(val)}:\n{e}")
                    continue
                rel = f"images/{self.tab_key}/{filename}".replace("\\", "/")
                images_out.append(rel)
                local_name_map[idx] = rel

        # cover resolve
        cover_out: Optional[str] = None
        if self.cover_idx is not None and 0 <= self.cover_idx < len(self.items):
            it = self.items[self.cover_idx]
            if it["kind"] == "local":
                cover_out = local_name_map.get(self.cover_idx)
            else:
                v = it["value"]
                cover_out = v if _is_url(v) else v.replace("\\", "/")

        return {"images": images_out, "cover": cover_out}

    # ---------- UI helpers ----------
    def _refresh(self):
        self.listbox.delete(0, "end")
        for i, it in enumerate(self.items):
            label = it["value"]
            if not _is_url(label):
                label = os.path.basename(label)
            prefix = "★ " if self.cover_idx == i else "   "
            kind_tag = {"existing":"[=]", "local":"[+]", "url":"[U]"}[it["kind"]]
            self.listbox.insert("end", f"{prefix}{kind_tag} {label}")
        if self.cover_idx is None:
            self.cover_lbl.configure(text="Cover: —")
        else:
            try:
                txt = self.listbox.get(self.cover_idx)
            except Exception:
                txt = "—"
            self.cover_lbl.configure(text=f"Cover: {txt[3:]}")

    def _browse(self):
        paths = filedialog.askopenfilenames(
            title="Choose images",
            filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.ico"), ("All", "*.*")],
        )
        if paths:
            for p in paths:
                self.items.append({"kind": "local", "value": p})
            if self.cover_idx is None:
                self.cover_idx = 0
            self._refresh()

    def _add_url_dialog(self):
        url = simpledialog.askstring("Add URL", "Image URL:")
        if url:
            url = url.strip()
            if not _is_url(url):
                messagebox.showwarning("URL", "Please enter a valid http(s) URL.")
                return
            self.items.append({"kind": "url", "value": url})
            if self.cover_idx is None:
                self.cover_idx = 0
            self._refresh()

    def _on_drop(self, event):
        data = event.data.strip()
        if data.startswith("{") and data.endswith("}"):
            data = data[1:-1]
        for token in data.split():
            if os.path.isfile(token):
                self.items.append({"kind": "local", "value": token})
        if self.items and self.cover_idx is None:
            self.cover_idx = 0
        self._refresh()

    def _remove(self):
        sel = list(self.listbox.curselection())
        if not sel:
            return
        for i in reversed(sel):
            del self.items[i]
            if self.cover_idx is not None:
                if i == self.cover_idx:
                    self.cover_idx = None
                elif i < self.cover_idx:
                    self.cover_idx -= 1
        self._refresh()

    def _move(self, delta: int):
        sel = list(self.listbox.curselection())
        if len(sel) != 1:
            return
        i = sel[0]
        j = i + delta
        if j < 0 or j >= len(self.items):
            return
        self.items[i], self.items[j] = self.items[j], self.items[i]
        if self.cover_idx == i:
            self.cover_idx = j
        elif self.cover_idx == j:
            self.cover_idx = i
        self._refresh()
        self.listbox.selection_clear(0, "end")
        self.listbox.selection_set(j)

    def _set_cover(self):
        sel = list(self.listbox.curselection())
        if len(sel) != 1:
            return
        self.cover_idx = sel[0]
        self._refresh()