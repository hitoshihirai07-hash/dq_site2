#!/usr/bin/env python3
"""Generate search_index.json from HTML files.

This is meant for static sites where runtime directory listing isn't possible.
By generating the index at build/commit time, newly added/edited HTML pages
become searchable automatically without maintaining manual page lists.

Output format:
  [
    {"url":"dq2_story_after.html","title":"...","text":"..."},
    ...
  ]
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path


def _read_text(path: Path) -> str:
    # Most files should be UTF-8; ignore undecodable bytes just in case.
    return path.read_text(encoding="utf-8", errors="ignore")


def _collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _extract_from_html(html: str) -> tuple[str, str]:
    """Return (title, visible_text)."""
    try:
        from bs4 import BeautifulSoup  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "BeautifulSoup (bs4) is required. Install: pip install beautifulsoup4 lxml"
        ) from e

    soup = BeautifulSoup(html, "lxml")

    # Remove non-content elements
    for tag_name in ["script", "style", "noscript", "svg", "canvas"]:
        for t in soup.find_all(tag_name):
            t.decompose()

    # Common layout elements that often duplicate navigation
    for tag_name in ["header", "footer", "nav", "aside"]:
        for t in soup.find_all(tag_name):
            t.decompose()

    # Title
    title = ""
    if soup.title and soup.title.get_text(strip=True):
        title = soup.title.get_text(" ", strip=True)
    else:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(" ", strip=True)

    # Prefer main/article content if present
    container = soup.find("main") or soup.find("article") or soup.body or soup

    # Headings help with searches like section names
    headings = []
    for h in container.find_all(["h1", "h2", "h3"]):
        txt = h.get_text(" ", strip=True)
        if txt:
            headings.append(txt)

    body_text = container.get_text(" ", strip=True)

    # Deduplicate: prepend headings (often already in body_text but helps)
    combined = " ".join([title] + headings + [body_text])
    combined = _collapse_ws(combined)

    return _collapse_ws(title), combined


def build_index(root: Path, out_path: Path, max_chars: int) -> list[dict]:
    skip_dirs = {".git", "node_modules", ".github", "tools"}

    entries: list[dict] = []

    for path in root.rglob("*.html"):
        rel = path.relative_to(root)

        # Skip unwanted directories
        if any(part in skip_dirs for part in rel.parts):
            continue

        # Skip generated/utility html if any (none by default)
        url = "/".join(rel.parts)

        html = _read_text(path)
        title, text = _extract_from_html(html)
        if not title and not text:
            continue

        if len(text) > max_chars:
            text = text[:max_chars]

        entries.append({
            "url": url,
            "title": title or url,
            "text": text,
        })

    entries.sort(key=lambda x: x["url"])

    out_path.write_text(
        json.dumps(entries, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    return entries


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="repo root")
    ap.add_argument("--out", default="search_index.json", help="output json path")
    ap.add_argument("--max-chars", type=int, default=20000, help="max chars per page")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    out_path = (root / args.out).resolve() if not os.path.isabs(args.out) else Path(args.out)

    out_path.parent.mkdir(parents=True, exist_ok=True)

    entries = build_index(root, out_path, args.max_chars)
    print(f"search index: {len(entries)} pages -> {out_path}")


if __name__ == "__main__":
    main()
