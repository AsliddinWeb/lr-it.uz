import re

_TRANSLIT = {
    "o'": "o", "g'": "g", "sh": "sh", "ch": "ch", "ў": "o", "ғ": "g",
    "ш": "sh", "ч": "ch", "қ": "q", "ҳ": "h", "ё": "yo", "ю": "yu",
    "я": "ya", "ъ": "", "ь": "",
}


def slugify(text: str) -> str:
    result = text.lower()
    for src, dst in _TRANSLIT.items():
        result = result.replace(src, dst)
    result = re.sub(r"[^a-z0-9]+", "-", result).strip("-")
    return result or "kurs"
