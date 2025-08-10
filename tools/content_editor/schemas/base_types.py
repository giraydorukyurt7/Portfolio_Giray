from __future__ import annotations
from typing import Dict, List
from i18n.languages import SUPPORTED_LANGS

MLStr = Dict[str, str]       # {"tr": "...", "en": "..."}
MLList = Dict[str, List[str]]  # {"tr": [..], "en": [..]}


def mlstr(default: str = "") -> MLStr:
    return {lang: default for lang in SUPPORTED_LANGS}


def mllist() -> MLList:
    return {lang: [] for lang in SUPPORTED_LANGS}