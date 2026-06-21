#!/usr/bin/env python3
"""
hermes-editing-yt docs-site builder
====================================

Generates static HTML from docs/*.md into docs-site/.
The generated docs-site is a plain HTML mirror of the raw docs tree.
The rich public website in site/ is a separate Next.js app and remains
 the canonical marketing landing page.

Usage:
    python3 scripts/build_docs_site.py

Output:
    docs-site/
      index.html          hand-written landing (this script writes a stub)
      quickstart.html
      architecture.html
      mcp-tools.html
      operator-helpers.html
      env-vars.html
      troubleshooting.html
      release-readiness.html
      style.css           shared dark stylesheet
      nav.js              search + table-of-contents behaviour
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import markdown
    from markdown.extensions import fenced_code, tables, toc
except ImportError as exc:  # pragma: no cover
    print("ERROR: markdown package is required. Run: pip install markdown", file=sys.stderr)
    raise SystemExit(2) from exc


# --------------------------------------------------------------------------- #
# Paths                                                                       #
# --------------------------------------------------------------------------- #

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
SITE_DIR = ROOT / "docs-site"
ASSETS_DIR = DOCS_DIR / "assets"

# --------------------------------------------------------------------------- #
# Page metadata                                                               #
# --------------------------------------------------------------------------- #

PAGE_TITLES: Dict[str, str] = {
    "index": "hermes-editing-yt — docs",
    "quickstart": "Quickstart — hermes-editing-yt",
    "architecture": "Architecture — hermes-editing-yt",
    "mcp-tools": "MCP tools — hermes-editing-yt",
    "operator-helpers": "Operator helpers — hermes-editing-yt",
    "env-vars": "Environment variables — hermes-editing-yt",
    "troubleshooting": "Troubleshooting — hermes-editing-yt",
    "release-readiness": "Release readiness — hermes-editing-yt",
}

META_DESC: Dict[str, str] = {
    "index": "Documentation index for hermes-editing-yt, the subtitle-driven auto video editor for Hermes.",
    "quickstart": "Clone, install, first MCP call, verify, and common pitfalls for hermes-editing-yt.",
    "architecture": "System map, pipeline, runtime dataflow, and integration boundaries for hermes-editing-yt.",
    "mcp-tools": "Reference for the 11 MCP tools exposed by hermes-editing-yt.",
    "operator-helpers": "Operator-friendly helpers and skill doc wiring for hermes-editing-yt.",
    "env-vars": "Exhaustive environment variable reference for hermes-editing-yt.",
    "troubleshooting": "Common failures and fixes for hermes-editing-yt.",
    "release-readiness": "Status legend, truth table, and release checklist for hermes-editing-yt.",
}

# Navigation sections and order.
NAV: List[Tuple[str, str, List[Tuple[str, str]]]] = [
    (
        "Get started",
        "docs/README.md",
        [
            ("Docs index", "index"),
            ("Quickstart", "quickstart"),
        ],
    ),
    (
        "Reference",
        "docs/architecture.md",
        [
            ("Architecture", "architecture"),
            ("MCP tools", "mcp-tools"),
            ("Operator helpers", "operator-helpers"),
            ("Env vars", "env-vars"),
        ],
    ),
    (
        "Run",
        "docs/troubleshooting.md",
        [
            ("Troubleshooting", "troubleshooting"),
            ("Release readiness", "release-readiness"),
        ],
    ),
]

ORDER: List[str] = [
    "index",
    "quickstart",
    "architecture",
    "mcp-tools",
    "operator-helpers",
    "env-vars",
    "troubleshooting",
    "release-readiness",
]

# --------------------------------------------------------------------------- #
# Markdown rendering                                                          #
# --------------------------------------------------------------------------- #

def make_markdown() -> markdown.Markdown:
    return markdown.Markdown(
        extensions=[
            "tables",
            "fenced_code",
            "toc",
            "md_in_html",
        ],
        extension_configs={
            "toc": {
                "permalink": "",
                "title": "On this page",
            },
        },
    )


def status_pill(label: str) -> str:
    """Wrap known status labels in a pill span."""
    color = {
        "Working": "#4ade80",
        "Partial": "#ffb347",
        "Planned": "#00d4ff",
        "Research": "#ff6e9c",
    }.get(label, "#a0a4be")
    return f'<span class="pill" style="background:{color}20;color:{color};border:1px solid {color}40">{label}</span>'


def process_status_labels(html: str) -> str:
    """Replace exact status words in table cells with styled pills."""
    for label in ("Working", "Partial", "Planned", "Research"):
        html = re.sub(
            rf"(<td[^>]*>)\s*{label}\s*(</td>)",
            rf"\1{status_pill(label)}\2",
            html,
        )
    return html


def render_markdown(src: Path) -> Tuple[str, str]:
    md = make_markdown()
    text = src.read_text(encoding="utf-8")
    body = md.convert(text)
    body = process_status_labels(body)
    # Build a simple TOC from headers if the markdown toc extension didn't render one.
    toc_html = getattr(md, "toc", "")
    return body, toc_html


# --------------------------------------------------------------------------- #
# HTML shell                                                                    #
# --------------------------------------------------------------------------- #

CSS = r"""
:root {
  --bg: #0b1020;
  --bg-2: #0f1530;
  --text: #e6e8f0;
  --muted: #a0a4be;
  --accent: #00d4ff;
  --accent-2: #915eff;
  --good: #4ade80;
  --warn: #ffb347;
  --danger: #ff5d6c;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
  --sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --display: 'Space Grotesk', var(--sans);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  line-height: 1.6;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
pre, code { font-family: var(--mono); font-size: 0.9em; }
code {
  background: rgba(145, 94, 255, 0.15);
  padding: 0.15em 0.4em;
  border-radius: 0.3em;
}
pre {
  background: var(--bg-2);
  border: 1px solid rgba(145, 94, 255, 0.25);
  border-radius: 0.6em;
  padding: 1em;
  overflow-x: auto;
}
pre code { background: transparent; padding: 0; }
h1, h2, h3, h4 { font-family: var(--display); margin-top: 1.6em; }
h1 { color: #fff; border-bottom: 1px solid rgba(145, 94, 255, 0.35); padding-bottom: 0.3em; }
h2 { color: var(--accent); }
h3 { color: var(--accent-2); }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.95em;
}
th, td {
  border: 1px solid rgba(145, 94, 255, 0.2);
  padding: 0.6em 0.8em;
  text-align: left;
}
th { background: var(--bg-2); color: #fff; }
tr:nth-child(even) { background: rgba(145, 94, 255, 0.05); }
blockquote {
  border-left: 4px solid var(--accent);
  margin: 1.2em 0;
  padding: 0.6em 1em;
  background: rgba(0, 212, 255, 0.06);
}
.pill {
  display: inline-block;
  padding: 0.15em 0.55em;
  border-radius: 999px;
  font-size: 0.8em;
  font-weight: 600;
  font-family: var(--mono);
  white-space: nowrap;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(11, 16, 32, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(145, 94, 255, 0.2);
  padding: 0.8em 1.5em;
  display: flex;
  align-items: center;
  gap: 1em;
}
.topbar .brand { font-family: var(--display); font-weight: 700; color: #fff; }
.topbar .brand span { color: var(--accent); }
.topbar nav { display: flex; gap: 1em; flex-wrap: wrap; }
.topbar nav a { color: var(--muted); font-size: 0.92em; }
.topbar nav a.active { color: var(--accent); }
.layout { display: flex; max-width: 1200px; margin: 0 auto; gap: 2em; padding: 2em 1.5em; }
.sidebar { width: 260px; flex-shrink: 0; }
.sidebar .section { margin-bottom: 1.5em; }
.sidebar .section-title { color: var(--muted); font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5em; }
.sidebar a { display: block; padding: 0.35em 0; color: var(--text); font-size: 0.95em; }
.sidebar a.active { color: var(--accent); font-weight: 600; }
.content { flex: 1; min-width: 0; }
.toc { border-left: 2px solid rgba(145, 94, 255, 0.25); padding-left: 1em; margin: 2em 0; }
.toc a { color: var(--muted); font-size: 0.9em; }
.footer {
  border-top: 1px solid rgba(145, 94, 255, 0.2);
  margin-top: 3em;
  padding: 2em 1.5em;
  color: var(--muted);
  font-size: 0.9em;
  text-align: center;
}
@media (max-width: 900px) {
  .layout { flex-direction: column; }
  .sidebar { width: 100%; }
}
"""


def build_nav(active_slug: str) -> str:
    sections_html = []
    for section_title, _source, items in NAV:
        links = []
        for label, slug in items:
            cls = "active" if slug == active_slug else ""
            links.append(f'<a class="{cls}" href="{slug}.html">{label}</a>')
        sections_html.append(
            f'<div class="section"><div class="section-title">{section_title}</div>'
            + "".join(links) + "</div>"
        )
    return "\n".join(sections_html)


def build_page(src: Path, slug: str) -> str:
    title = PAGE_TITLES.get(slug, slug.replace("-", " ").title())
    desc = META_DESC.get(slug, title)
    body, toc = render_markdown(src)

    nav_html = build_nav(slug)

    if slug == "index":
        hero = (
            '<div style="margin:2em 0 2.5em;padding:2em;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(145,94,255,0.08));'
            'border:1px solid rgba(145,94,255,0.25);border-radius:1em;">'
            '<h1 style="margin-top:0;border:none;padding:0;">hermes-editing-yt</h1>'
            '<p style="font-size:1.2em;color:var(--muted);margin:0.5em 0 0;">Subtitle-Driven Auto Video Editor — '
            'Your videos, editable by text.</p>'
            '<p style="margin-top:1em;">One MCP call. Local GPU. Free forever. No API keys.</p>'
            '</div>'
        )
        body = hero + body

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="topbar">
  <a class="brand" href="index.html">hermes-editing-yt <span>docs</span></a>
  <nav>
    <a href="https://capslockb.github.io/hermes-editing-yt">Website</a>
    <a href="https://github.com/Capslockb/hermes-editing-yt">GitHub</a>
  </nav>
</div>
<div class="layout">
  <aside class="sidebar">{nav_html}</aside>
  <main class="content">
    {body}
    <div class="toc">{toc}</div>
  </main>
</div>
<footer class="footer">
  hermes-editing-yt · MIT license · <a href="https://github.com/Capslockb/hermes-editing-yt">GitHub</a>
</footer>
<script src="nav.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------- #
# Site generation                                                             #
# --------------------------------------------------------------------------- #

def build() -> None:
    if SITE_DIR.exists():
        shutil.rmtree(SITE_DIR)
    SITE_DIR.mkdir(parents=True)

    # Write shared assets.
    (SITE_DIR / "style.css").write_text(CSS, encoding="utf-8")
    (SITE_DIR / "nav.js").write_text(
        "// hermes-editing-yt docs-site navigation behaviour\n"
        "(function () {\n"
        "  const links = document.querySelectorAll('.sidebar a');\n"
        "  const path = window.location.pathname.split('/').pop() || 'index.html';\n"
        "  links.forEach(function (a) {\n"
        "    if (a.getAttribute('href') === path) {\n"
        "      a.classList.add('active');\n"
        "    }\n"
        "  });\n"
        "})();\n",
        encoding="utf-8",
    )

    # Build each Markdown page.
    for slug in ORDER:
        if slug == "index":
            src = DOCS_DIR / "README.md"
        else:
            src = DOCS_DIR / f"{slug}.md"

        if not src.exists():
            print(f"WARN: source doc not found: {src}", file=sys.stderr)
            continue

        html = build_page(src, slug)
        out = SITE_DIR / f"{slug}.html"
        out.write_text(html, encoding="utf-8")
        print(f"  {out.relative_to(ROOT)}")

    print(f"\nGenerated docs-site at {SITE_DIR}")


if __name__ == "__main__":
    build()
