"""Structural QA for generated Office files (no external binaries required).

PR1 scope: structural checks only (leftover prompt text + duplicate zip entries).
DEFERRED (follow-up): the visual render-to-image + fresh-eyes-subagent QA tier, and
content[] chart hybrid-drawing — neither is implemented here.
"""
import zipfile
from collections import Counter

try:
    from markitdown import MarkItDown
    _HAVE_MARKITDOWN = True
except Exception:
    _HAVE_MARKITDOWN = False

PROMPT_MARKERS = ["click to edit", "presenter name", "month #",
                  "placeholder", "lorem", "ipsum", "xxxx"]


def _text(pptx_path):
    if _HAVE_MARKITDOWN:
        return MarkItDown().convert(pptx_path).text_content.lower()
    # fallback: read slide XML directly
    import re
    out = []
    with zipfile.ZipFile(pptx_path) as z:
        for n in z.namelist():
            if n.startswith("ppt/slides/slide") and n.endswith(".xml"):
                xml = z.read(n).decode("utf-8", "ignore")
                out.extend(re.findall(r"<a:t>([^<]*)</a:t>", xml))
    return "\n".join(out).lower()


def check_pptx(path):
    """Return a list of issue strings ([] == clean)."""
    issues = []
    names = zipfile.ZipFile(path).namelist()
    dups = [n for n, c in Counter(names).items() if c > 1]
    if dups:
        issues.append(f"duplicate zip entries: {dups}")
    text = _text(path)
    for marker in PROMPT_MARKERS:
        if marker in text:
            issues.append(f"leftover prompt text: {marker!r}")
    return issues
