from __future__ import annotations
import os
from typing import Any, Dict, List
from .file_service import read_json, atomic_write_json

ENTITY_FILES = {
    "info": "info.json",
    "socials": "socials.json",
    "experience": "experience.json",
    "competitions": "competitions.json",
    "projects": "projects.json",
    "certificates": "certificates.json",
}

class ContentRepository:
    """Tek JSON dosya/varlık (entity) mantığı. SRP: I/O + veri saklama sorumluluğu sadece burada.
    """
    def __init__(self, content_root: str, defaults_provider):
        self.content_root = content_root
        self.defaults = defaults_provider

    def path_for(self, entity: str) -> str:
        fname = ENTITY_FILES.get(entity)
        if not fname:
            raise ValueError(f"Unknown entity: {entity}")
        return os.path.join(self.content_root, fname)

    def load(self, entity: str):
        path = self.path_for(entity)
        default = self.defaults.default_for(entity)
        return read_json(path, default)

    def save(self, entity: str, data: Any):
        path = self.path_for(entity)
        atomic_write_json(path, data)
        return path