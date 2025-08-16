from __future__ import annotations
from typing import Any, Dict
from .base_types import mlstr, mllist

class DefaultsProvider:
    def __init__(self):
        # Tek JSON – i18n alanlar MLStr/MLList
        self.defaults: Dict[str, Any] = {
            "info": {
                "full_name": "",
                "title": mlstr(),
                "university": "",
                "department": "",
                "class_year": "",
                "gpa": "",
                "location": "",
                "summary": mlstr(),
                "email": "",
                "links": {"cv": "", "linkedin": "", "github": "", "website": ""},
            },
            "socials": [],  # [{platform, username, url}]
            "experience": [],  # list of recs
            "competitions": [],
            "projects": [],
            "certificates": [],
        }

    def default_for(self, entity: str):
        import copy
        base = self.defaults.get(entity)
        if base is None:
            raise ValueError(f"Unknown entity: {entity}")
        return copy.deepcopy(base)

# Kayıt şablonları (UI yeni kayıt açarken kullanır)
RECORD_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "socials": {"platform": "", "username": "", "url": ""},
    "experience": {
        "title": mlstr(),
        "organization": "",
        "location": "",
        "start": "",
        "end": "",
        "present": False,
        "details": mlstr(),
        "highlights": mllist(),
        "tech": [],
    },
    "competitions": {
        "name": mlstr(),
        "role": mlstr(),
        "organization": "",
        "start": "",
        "end": "",
        "present": False,
        "result": "",
        "details": mlstr(),
        "highlights": mllist(),
    },
    "projects": {
        "title": mlstr(),
        "summary": mlstr(),
        "start": "",
        "end": "",
        "present": False,
        "stack": [],
        "links": {"github": "", "demo": ""},
        "highlights": mllist(),
        "images": [],
    },
    "certificates": {
        "name": mlstr(),
        "issuer": "",
        "start": "",
        "end": "",
        "present": False,
        "credential_id": "",
        "credential_url": "",
        "details": mlstr(),
    },
}