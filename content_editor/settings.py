from __future__ import annotations
from pathlib import Path

# content_editor/ dizini
APP_DIR = Path(__file__).resolve().parent
# Proje kökü: Portfolio_Giray/
PROJECT_ROOT = APP_DIR.parent

# İçerik alt yolu
DEFAULT_CONTENT_SUBPATH = Path("frontend") / "public" / "content"

def autodetect_content_root() -> Path:
    """
    Uygun içeriği otomatik bul:
    - PROJECT_ROOT/frontend/public/content
    - APP_DIR/frontend/public/content   (yedek)
    """
    candidates = [
        PROJECT_ROOT / DEFAULT_CONTENT_SUBPATH,
        APP_DIR / DEFAULT_CONTENT_SUBPATH,
    ]
    for c in candidates:
        if (c / "info.json").exists() or c.exists():
            return c
    # hiçbiri yoksa ilkine düş
    return candidates[0]

# ---- Ek yardımcılar (ileride Stack & görseller için) ----

def content_to_public_dir(content_root: Path) -> Path:
    """
    content_root: .../frontend/public/content  ->  .../frontend/public
    """
    p = Path(content_root)
    return p if p.name == "public" else p.parent
