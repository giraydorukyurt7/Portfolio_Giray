# widgets/icon_picker.py
from __future__ import annotations
import os, re, shutil, tkinter as tk
from tkinter import ttk, filedialog, messagebox
from typing import Callable, Optional

# Drag & Drop (opsiyonel)
try:
    from tkinterdnd2 import DND_FILES  # type: ignore
    DND_OK = True
except Exception:
    DND_OK = False

# PNG dönüştürme (önerilir)
try:
    from PIL import Image
    PIL_OK = True
except Exception:
    PIL_OK = False


def _sanitize(name: str) -> str:
    name = (name or "").strip().replace(" ", "_")
    return re.sub(r"[^0-9A-Za-zÇĞİÖŞÜçğıöşü_-]+", "", name) or "icon"


class IconPicker(ttk.LabelFrame):
    """
    Local (copy + PNG overwrite) veya SVG URL picker.
    - public_dir_cb(): .../frontend/public
    - tab_key: 'socials_tab' | 'info_tab' | ...
    - name_cb(): dosya adı kaynağı ('LinkedIn' -> LinkedIn.png)
    """

    def __init__(
        self,
        master,
        public_dir_cb: Callable[[], str],
        tab_key: str,
        name_cb: Callable[[], str],
        title: str = "Icon / Image",
    ):
        super().__init__(master, text=title)
        self.public_dir_cb = public_dir_cb
        self.tab_key = tab_key
        self.name_cb = name_cb

        self.mode = tk.StringVar(value="local")  # 'local' | 'svg'
        self._local_path = tk.StringVar()
        self._saved_value = tk.StringVar()  # JSON'a yazılacak değer (relative PNG path veya SVG URL)

        # Mode switch
        ttk.Radiobutton(self, text="Local (copy & PNG)", variable=self.mode, value="local",
                        command=self._toggle).grid(row=0, column=0, sticky="w", padx=6, pady=(6, 2))
        ttk.Radiobutton(self, text="SVG URL", variable=self.mode, value="svg",
                        command=self._toggle).grid(row=0, column=1, sticky="w", padx=6, pady=(6, 2))

        # Local widgets
        self.local_hint = ttk.Label(self, text="Drop an image here or browse…")
        self.local_hint.grid(row=1, column=0, columnspan=2, sticky="ew", padx=6)

        self.drop = tk.Label(self, text="⬇ Drop image here ⬇", relief="ridge", bd=2, height=4, anchor="center")
        self.drop.grid(row=2, column=0, columnspan=2, sticky="ew", padx=6, pady=4)
        if DND_OK:
            self.drop.drop_target_register(DND_FILES)  # type: ignore
            self.drop.dnd_bind("<<Drop>>", self._on_drop)  # type: ignore
        else:
            self.drop.configure(text="(Install tkinterdnd2 for drag & drop)\nOr use the Browse button")

        ttk.Button(self, text="Browse…", command=self._browse).grid(row=3, column=0, sticky="w", padx=6, pady=(0, 6))

        # SVG widgets
        ttk.Label(self, text="SVG URL").grid(row=4, column=0, sticky="w", padx=6)
        self.svg_entry = ttk.Entry(self, width=64)
        self.svg_entry.grid(row=4, column=1, sticky="ew", padx=6, pady=4)

        # Saved value (read-only)
        ttk.Label(self, text="Saved value").grid(row=5, column=0, sticky="w", padx=6)
        self.saved_entry = ttk.Entry(self, textvariable=self._saved_value, width=64, state="readonly")
        self.saved_entry.grid(row=5, column=1, sticky="ew", padx=6, pady=(0, 8))

        self.columnconfigure(1, weight=1)
        self._toggle()

    # ---- public API ----
    def set(self, value: Optional[str]):
        val = value or ""
        self._saved_value.set(val)
        if val.startswith("http") and val.lower().endswith(".svg"):
            self.mode.set("svg")
            self.svg_entry.delete(0, "end"); self.svg_entry.insert(0, val)
            self._local_path.set(""); self.local_hint.configure(text="Drop an image here or browse…")
        else:
            self.mode.set("local")
            self.svg_entry.delete(0, "end")
            self.local_hint.configure(text="Drop an image here or browse…")
        self._toggle()

    def get(self) -> Optional[str]:
        if self.mode.get() == "svg":
            url = self.svg_entry.get().strip()
            self._saved_value.set(url)
            return url or None
        # local
        path = self._local_path.get().strip()
        if not path:
            # Yeni dosya seçilmediyse mevcudu koru (duplikasyon yok)
            return self._saved_value.get() or None
        saved = self._save_local_png(path)
        self._saved_value.set(saved or "")
        return saved

    # ---- internals ----
    def _toggle(self):
        local = (self.mode.get() == "local")
        self.drop.configure(state=("normal" if local else "disabled"))
        self.svg_entry.configure(state=("disabled" if local else "normal"))

    def _on_drop(self, event):
        data = event.data.strip()
        if data.startswith("{") and data.endswith("}"):
            data = data[1:-1]
        files = data.split()
        if files:
            self._local_path.set(files[0])
            self.local_hint.configure(text=f"Selected: {files[0]}")

    def _browse(self):
        p = filedialog.askopenfilename(
            title="Choose image",
            filetypes=[("Images", "*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.ico"), ("All", "*.*")],
        )
        if p:
            self._local_path.set(p)
            self.local_hint.configure(text=f"Selected: {p}")

    def _public_dir(self) -> str:
        return self.public_dir_cb()

    def _images_dir(self) -> str:
        d = os.path.join(self._public_dir(), "images", self.tab_key)
        os.makedirs(d, exist_ok=True)
        return d

    def _save_local_png(self, src_path: str) -> Optional[str]:
        if not os.path.isfile(src_path):
            messagebox.showwarning("Image", "File not found.")
            return None

        base = _sanitize(self.name_cb() or "icon")
        # ---- ÖNEMLİ: her seferinde SABİT isme yaz (overwrite) ----
        dst = os.path.join(self._images_dir(), f"{base}.png")

        try:
            if PIL_OK:
                im = Image.open(src_path)
                try:
                    im = im.convert("RGBA")
                except Exception:
                    pass
                im.save(dst, format="PNG")
            else:
                shutil.copyfile(src_path, dst)
                messagebox.showinfo(
                    "Pillow not installed",
                    "Pillow yüklü olmadığı için gerçek PNG dönüştürme yapılmadı.\n"
                    "Öneri: pip install pillow",
                )
        except Exception as e:
            messagebox.showerror("Image Save", f"Could not save image: {e}")
            return None

        return f"images/{self.tab_key}/{os.path.basename(dst)}"