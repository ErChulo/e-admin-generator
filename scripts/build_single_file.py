#!/usr/bin/env python3
"""Build the single-file E.Adm Generator.

Injects prompts/eadm-scraper-prompt.md into eadm-generator.html (the
EADM_SCRAPER_PROMPT placeholder) and runs safety checks:

- the embedded prompt names all 7 sections (s1-s7)
- no duplicate top-level function/var declarations in the <script>
- 0 fetch(, 0 <script src, 0 <link, 0 external URLs in the HTML
- the white PBGC logo data URI is present in the header

Usage:
  python3 scripts/build_single_file.py [--version V]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "eadm-generator.html"
PROMPT = ROOT / "prompts" / "eadm-scraper-prompt.md"


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    version = None
    if "--version" in sys.argv:
        i = sys.argv.index("--version")
        if i + 1 >= len(sys.argv):
            fail("--version needs a value")
        version = sys.argv[i + 1]

    html = HTML.read_text(encoding="utf-8")
    prompt = PROMPT.read_text(encoding="utf-8")

    # 1. Inject the prompt between the PROMPT markers (idempotent —
    # re-running replaces the previously injected string).
    start = html.find("/* PROMPT-START */")
    end = html.find("/* PROMPT-END */")
    if start < 0 or end < 0 or end <= start:
        fail("prompt markers not found in eadm-generator.html")
    end += len("/* PROMPT-END */")
    replacement = (
        "/* PROMPT-START */\nvar EADM_SCRAPER_PROMPT = "
        + json.dumps(prompt)
        + ";\n/* PROMPT-END */"
    )
    html = html[:start] + replacement + html[end:]

    # 2. The prompt must name all 7 sections.
    for sec in ("s1", "s2", "s3", "s4", "s5", "s6", "s7"):
        if sec not in prompt:
            fail(f"prompt is missing section {sec}")
    for key in ("Required Beginning Dates", "Earliest PBGC Retirement Date",
                "Retroactive QPSA", "Plan Adjustment Factors",
                "another source", "Earnings Offsets",
                "Employee Contributions"):
        if key not in prompt:
            fail(f"prompt is missing topic: {key}")

    # 3. Version bump, if requested.
    if version:
        html = re.sub(
            r'var EADM_VERSION = "[^"]*";',
            f'var EADM_VERSION = "{version}";',
            html,
            count=1,
        )
        html = html.replace("v0.1.0", f"v{version}")

    # 4. No duplicate top-level function/var declarations.
    m = re.search(r"<script>(.*)</script>", html, re.S)
    if not m:
        fail("no <script> block found")
    script = m.group(1)
    seen = {}
    for line in script.splitlines():
        fm = re.match(r"^(?:function|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)", line)
        if fm:
            name = fm.group(1)
            if name in seen:
                fail(f"duplicate top-level declaration: {name}")
            seen[name] = True

    # 5. No external references.
    if "fetch(" in script:
        fail("script contains fetch(")
    if "<script src" in html or "<link" in html:
        fail("HTML contains <script src or <link")
    # OOXML namespace URIs (schemas.openxmlformats.org) are identifiers
    # inside the .docx strings, not fetches — strip them before checking.
    clean = html.replace("http://schemas.openxmlformats.org/", "")
    for pat in ("http://", "https://"):
        if pat in clean:
            fail(f"HTML contains external URL ({pat})")

    # 6. The white PBGC logo must be embedded in the header.
    if "data:image/png;base64," not in html:
        fail("header logo data URI missing")

    HTML.write_text(html, encoding="utf-8")
    print(f"Built {HTML.name}: {len(html)} bytes, prompt embedded ({len(prompt)} chars, 7 sections)")


if __name__ == "__main__":
    main()
