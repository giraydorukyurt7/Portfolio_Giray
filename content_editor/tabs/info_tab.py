# tabs/info_tab.py
# -*- coding: utf-8 -*-
"""
Info Tab
- BaseTab uyumu: entity_name="info", load(data=None), export(), save()
- Ek uyumluluk: save_current_tab(), on_save(), do_save(), get_data(), to_json(), serialize() eklendi
- data (dict) özelliği her zaman güncel tutulur (app bazı yerlerde self.data bekleyebilir)
- Scrollable form + i18n destekli dinamik alanlar (widgets/dynamic_form.py)
- Profil foto & Üniversite logosu: dosyadan/URL'den yükle + önizleme
- Kompleks alanlar (list/dict) UI’da gösterilmez; export’ta passthrough olarak korunur
"""
from __future__ import annotations
from typing import Any, Dict
import io, urllib.request
from urllib.error import URLError
from PIL import Image, ImageTk
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from .base_tab import BaseTab
from widgets.scrollable import ScrollableFrame
from widgets.dynamic_form import DynamicForm


# ---- Görsel yardımcıları ----
def _load_image_from_path(path: str):
    from PIL import Image
    return Image.open(path).convert("RGBA")

def _load_image_from_url(url: str):
    from PIL import Image
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = resp.read()
    return Image.open(io.BytesIO(data)).convert("RGBA")

def _fit_image(img, max_w: int, max_h: int):
    from PIL import Image
    img.thumbnail((max_w, max_h), Image.LANCZOS)
    return img

def _render_on_canvas(canvas: tk.Canvas, tk_img: ImageTk.PhotoImage):
    canvas.delete("all")
    cw, ch = int(canvas["width"]), int(canvas["height"])
    iw, ih = tk_img.width(), tk_img.height()
    x, y = (cw - iw)//2, (ch - ih)//2
    canvas.create_image(x, y, anchor="nw", image=tk_img)


class InfoTab(BaseTab):
    entity_name = "info"
    PROFILE_BOX = (160, 160)
    UNI_LOGO_BOX = (120, 120)

    def __init__(self, master, app):
        super().__init__(master, app)

        # dahili state
        self._default_state = {
            "profile_photo": {"path": None, "url": None},
            "university_logo": {"path": None, "url": None},
        }
        self.state = {k: dict(v) for k, v in self._default_state.items()}
        self._passthrough: Dict[str, Any] = {}   # UI’da göstermediğimiz karmaşık alanlar

        # app bazı yerlerde self.data bekleyebilir -> her zaman dict tutacağız
        self.data: Dict[str, Any] = {}

        # image refs
        self._img_prof_tk = None
        self._img_uni_tk = None

        # ---- UI ----
        self.scroll = ScrollableFrame(self)
        self.scroll.pack(fill="both", expand=True)
        ttk.Label(self.scroll.interior, text="Kişisel Bilgiler (Info)",
                  font=("Segoe UI", 14, "bold")).grid(row=0, column=0, sticky="w", padx=12, pady=(12, 6))

        # Profil Fotoğrafı
        prof = ttk.LabelFrame(self.scroll.interior, text="Profil Fotoğrafı", padding=12)
        prof.grid(row=1, column=0, sticky="ew", padx=12, pady=8)
        prof.columnconfigure(1, weight=1)
        self.canvas_prof = tk.Canvas(prof, width=self.PROFILE_BOX[0], height=self.PROFILE_BOX[1],
                                     bg="#F3F3F3", highlightthickness=1, highlightbackground="#D0D0D0")
        self.canvas_prof.grid(row=0, column=0, rowspan=3, sticky="w", padx=(0, 12))
        ttk.Button(prof, text="Dosyadan Yükle", command=self._choose_profile_file)\
            .grid(row=0, column=1, sticky="w", pady=(0, 4))
        row_prof_url = ttk.Frame(prof); row_prof_url.grid(row=1, column=1, sticky="ew", pady=2)
        row_prof_url.columnconfigure(0, weight=1)
        self.entry_prof_url = ttk.Entry(row_prof_url)
        self.entry_prof_url.grid(row=0, column=0, sticky="ew", padx=(0, 6))
        ttk.Button(row_prof_url, text="URL'den Yükle", command=self._load_profile_from_url)\
            .grid(row=0, column=1)
        ttk.Label(prof, text="Öneri: kare görsel, max ~1024px; büyük görseller otomatik küçültülür.")\
            .grid(row=2, column=1, sticky="w")

        # Dinamik Form (Genel + Gruplar)
        self.form = DynamicForm(self.scroll.interior)
        self.form.grid(row=2, column=0, sticky="ew")
        self.scroll.interior.columnconfigure(0, weight=1)

        # Üniversite Logosu
        uni = ttk.LabelFrame(self.scroll.interior, text="Üniversite Logosu", padding=12)
        uni.grid(row=3, column=0, sticky="ew", padx=12, pady=8)
        uni.columnconfigure(1, weight=1)
        self.canvas_uni = tk.Canvas(uni, width=self.UNI_LOGO_BOX[0], height=self.UNI_LOGO_BOX[1],
                                    bg="#F3F3F3", highlightthickness=1, highlightbackground="#D0D0D0")
        self.canvas_uni.grid(row=0, column=0, rowspan=3, sticky="w", padx=(0, 12))
        ttk.Button(uni, text="Dosyadan Yükle", command=self._choose_uni_file)\
            .grid(row=0, column=1, sticky="w", pady=(0, 4))
        row_uni_url = ttk.Frame(uni); row_uni_url.grid(row=1, column=1, sticky="ew", pady=2)
        row_uni_url.columnconfigure(0, weight=1)
        self.entry_uni_url = ttk.Entry(row_uni_url)
        self.entry_uni_url.grid(row=0, column=0, sticky="ew", padx=(0, 6))
        ttk.Button(row_uni_url, text="URL'den Yükle", command=self._load_uni_from_url)\
            .grid(row=0, column=1)
        ttk.Label(uni, text="PNG/JPG önerilir; şeffaf arkaplan desteklenir.")\
            .grid(row=2, column=1, sticky="w")

        # hedef dosya etiketi
        self.update_target_path()

        # açılışta repo’dan oku (App ayrıca dışarıdan da load(data) çağırabilir)
        try:
            self.load()
        except Exception:
            pass

    # ============ App API ============
    def load(self, data: Dict[str, Any] | None = None):
        """Load All: dışarıdan data verilebilir; None ise repo’dan okur."""
        if data is None or not isinstance(data, dict):
            data = self.app.repo.load(self.entity_name) or {}

        # reset
        self.state = {k: dict(v) for k, v in self._default_state.items()}
        self._passthrough.clear()
        self.entry_prof_url.delete(0, "end")
        self.entry_uni_url.delete(0, "end")
        self.canvas_prof.delete("all"); self.canvas_uni.delete("all")

        # formu sıfırla
        for w in self.form.winfo_children():
            w.destroy()
        self.form = DynamicForm(self.scroll.interior)
        self.form.grid(row=2, column=0, sticky="ew")

        # 1) Görseller
        prof = data.get("profile_photo") or {}
        uni  = data.get("university_logo") or {}
        self.state["profile_photo"] = {"path": prof.get("path"), "url": prof.get("url")}
        self.state["university_logo"] = {"path": uni.get("path"), "url": uni.get("url")}
        if self.state["profile_photo"]["url"]:
            self.entry_prof_url.insert(0, self.state["profile_photo"]["url"])
        if self.state["university_logo"]["url"]:
            self.entry_uni_url.insert(0, self.state["university_logo"]["url"])
        self._refresh_profile_preview(); self._refresh_uni_preview()

        # 2) Diğer alanları ayır: kök scalar & grup scalar & passthrough
        root_scalar: Dict[str, Any] = {}
        groups: Dict[str, Dict[str, Any]] = {}

        for k, v in data.items():
            if k in ("profile_photo", "university_logo"):
                continue
            if isinstance(v, dict):
                sub_scalar = {kk: vv for kk, vv in v.items()
                              if isinstance(vv, (str, int, float, bool)) or vv is None
                              or (isinstance(vv, dict) and (("en" in vv) or ("tr" in vv)))}
                rest = {kk: vv for kk, vv in v.items() if kk not in sub_scalar}
                if sub_scalar:
                    groups[k] = sub_scalar
                if rest:
                    self._passthrough[k] = rest if isinstance(rest, dict) else v
            elif isinstance(v, (str, int, float, bool)) or v is None \
                 or (isinstance(v, dict) and (("en" in v) or ("tr" in v))):
                root_scalar[k] = v
            else:
                self._passthrough[k] = v

        # 3) Formları kur
        self.form.build_root(root_scalar)
        next_row = 1
        for gname, gfields in groups.items():
            self.form.build_group(gname, gfields, row=(next_row := next_row + 1))

        # self.data her zaman güncel olsun (save() veya app doğrudan okuyabilir)
        self.data = dict(data)
        self.update_target_path()

    def export(self) -> Dict[str, Any]:
        """Save sırasında JSON çıktısı."""
        out: Dict[str, Any] = {
            "profile_photo": dict(self.state["profile_photo"]),
            "university_logo": dict(self.state["university_logo"]),
        }
        root_out = self.form.export_root()
        groups_out = self.form.export_groups()

        out.update(root_out)
        for g, payload in groups_out.items():
            if g in self._passthrough and isinstance(self._passthrough[g], dict):
                payload.update(self._passthrough[g])
            out[g] = payload
        for k, v in self._passthrough.items():
            if k not in out:
                out[k] = v

        # data alanını da güncelle (bazı app akışları self.data'yı yazıyor)
        self.data = dict(out)
        return out

    # ---- Uyumlu alias'lar (bazı app sürümleri farklı method isimleri çağırabiliyor) ----
    def get_data(self) -> Dict[str, Any]:     # export alias
        return self.export()
    def to_json(self) -> Dict[str, Any]:      # export alias
        return self.export()
    def serialize(self) -> Dict[str, Any]:    # export alias
        return self.export()

    def save(self) -> None:
        """'Save Current Tab' için ana metod."""
        try:
            payload = self.export()
            self.app.repo.save(self.entity_name, payload)
            self.update_target_path()
        except Exception as e:
            messagebox.showerror("Save Error", f"Kaydedilemedi:\n{e}")

    # App’in farklı adlarla çağırma ihtimaline karşı:
    def save_current_tab(self): self.save()
    def on_save(self): self.save()
    def do_save(self): self.save()

    # ============ Görseller ============
    def _choose_profile_file(self):
        p = filedialog.askopenfilename(
            title="Profil fotoğrafı seç",
            filetypes=[("Görüntü", "*.png;*.jpg;*.jpeg;*.webp;*.bmp;*.gif")]
        )
        if not p: return
        try:
            img = _load_image_from_path(p)
            self._set_profile_image(img)
            self.state["profile_photo"]["path"] = p
            self.state["profile_photo"]["url"] = None
            self.entry_prof_url.delete(0, "end")
        except Exception as e:
            messagebox.showerror("Hata", f"Görsel açılamadı:\n{e}")

    def _load_profile_from_url(self):
        url = self.entry_prof_url.get().strip()
        if not url:
            messagebox.showwarning("Uyarı", "Lütfen bir URL girin."); return
        try:
            img = _load_image_from_url(url)
            self._set_profile_image(img)
            self.state["profile_photo"]["url"] = url
            self.state["profile_photo"]["path"] = None
        except URLError as e:
            messagebox.showerror("Hata", f"URL'e erişilemedi:\n{e}")
        except Exception as e:
            messagebox.showerror("Hata", f"Görsel açılamadı:\n{e}")

    def _set_profile_image(self, img):
        img = _fit_image(img, *self.PROFILE_BOX)
        self._img_prof_tk = ImageTk.PhotoImage(img)
        _render_on_canvas(self.canvas_prof, self._img_prof_tk)

    def _refresh_profile_preview(self):
        ph = self.state.get("profile_photo", {})
        try:
            if ph.get("path"):
                img = _load_image_from_path(ph["path"])
                self._set_profile_image(img)
            elif ph.get("url"):
                img = _load_image_from_url(ph["url"])
                self._set_profile_image(img)
            else:
                self.canvas_prof.delete("all")
        except Exception:
            self.canvas_prof.delete("all")

    def _choose_uni_file(self):
        p = filedialog.askopenfilename(
            title="Üniversite logosu seç",
            filetypes=[("Görüntü", "*.png;*.jpg;*.jpeg;*.webp;*.bmp;*.gif;*.ico")]
        )
        if not p: return
        try:
            img = _load_image_from_path(p)
            self._set_uni_image(img)
            self.state["university_logo"]["path"] = p
            self.state["university_logo"]["url"] = None
            self.entry_uni_url.delete(0, "end")
        except Exception as e:
            messagebox.showerror("Hata", f"Görsel açılamadı:\n{e}")

    def _load_uni_from_url(self):
        url = self.entry_uni_url.get().strip()
        if not url:
            messagebox.showwarning("Uyarı", "Lütfen bir URL girin."); return
        try:
            img = _load_image_from_url(url)
            self._set_uni_image(img)
            self.state["university_logo"]["url"] = url
            self.state["university_logo"]["path"] = None
        except URLError as e:
            messagebox.showerror("Hata", f"URL'e erişilemedi:\n{e}")
        except Exception as e:
            messagebox.showerror("Hata", f"Görsel açılamadı:\n{e}")

    def _set_uni_image(self, img):
        img = _fit_image(img, *self.UNI_LOGO_BOX)
        self._img_uni_tk = ImageTk.PhotoImage(img)
        _render_on_canvas(self.canvas_uni, self._img_uni_tk)

    def _refresh_uni_preview(self):
        uni = self.state.get("university_logo", {})
        try:
            if uni.get("path"):
                img = _load_image_from_path(uni["path"])
                self._set_uni_image(img)
            elif uni.get("url"):
                img = _load_image_from_url(uni["url"])
                self._set_uni_image(img)
            else:
                self.canvas_uni.delete("all")
        except Exception:
            self.canvas_uni.delete("all")
