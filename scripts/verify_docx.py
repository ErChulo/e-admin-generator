#!/usr/bin/env python3
"""Verify the demo E.Adm memo produced by the HTML's own code.

Generates /tmp/eadm-demo.docx via scripts/gen_demo_docx.cjs, then checks
it with python-docx: 8 tables with the template's structure, the header
filled, the section answers filled, the footer present, no placeholder
text left.

Usage: python3 scripts/verify_docx.py [/tmp/eadm-demo.docx]
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/eadm-demo.docx")

failures = []


def check(name, cond, extra=""):
    print(("  ok  " if cond else "FAIL  ") + name + ("" if cond else f" — {extra}"))
    if not cond:
        failures.append(name)


def main():
    r = subprocess.run(
        ["node", str(ROOT / "scripts" / "gen_demo_docx.cjs"), str(OUT)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("FAIL  could not generate the demo docx:", r.stderr.strip())
        sys.exit(1)
    print(r.stdout.strip())

    from docx import Document

    doc = Document(str(OUT))
    check("document has 9 tables (7 section heads + §1 list + §4 list)", len(doc.tables) == 9, f"found {len(doc.tables)}")
    # Tables interleave in document order: heads and lists. Identify by content.
    heads = [t.cell(0, 0).text for t in doc.tables if len(t.rows) == 1 and len(t.columns) == 1]
    check("document has 7 section-head tables", len(heads) == 7, f"found {len(heads)}")
    for i, want in enumerate([
        "1. Required Beginning Dates",
        "2. Earliest PBGC Retirement Date (EPRD)",
        "3. Retroactive Qualified Preretirement Survivor Annuities (QPSAs)",
        "4. Review of Plan Adjustment Factors",
        "5. Restrictions on benefits payable while participants are receiving certain benefits from another source",
        "6. Benefit Supplements Subject to Earnings Offsets",
        "7. Employee Contributions",
    ]):
        check(f"section head {i+1} matches the template", heads[i] == want, f"got {heads[i]!r}")

    full = "\n".join(p.text for p in doc.paragraphs)
    check("MEMORANDUM present", "MEMORANDUM" in full)
    check("plan name filled", "Harborview Manufacturing Pension Plan" in full)
    check("case number filled", "12345678" in full)
    check("DOPT filled as M/D/Y", "06/30/2024" in full)
    check("purpose present", "identify operating policies and issues" in full)
    check("§1 Yes marked", "[X] Yes: Document your findings" in full)
    check("§3 No marked", "[X] No" in full)
    check("§2 four questions answered", full.count("Does the plan offer") == 1 and "annuities prior to age 55" in full)
    check("§2 EPRD language present", "earliest pbgc retirement date is the participant" in full.lower())
    check("§7 MEC permitted statement present", "may be withdrawn in a single sum" in full)
    check("§7 MEC not-permitted statement absent", "may not be withdrawn" not in full)
    check("§7 N/A statement absent", "does not include employee contributions" not in full)
    check("no placeholder text left", "State facts and circumstances here" not in full)
    check("template ERPD spelling kept", "ERPD language" in full)

    # The §1 participants table and the §4 factor table, found by header row.
    def table_by_header(header):
        for t in doc.tables:
            if len(t.rows) >= 1 and [c.text for c in t.rows[0].cells] == header:
                return t
        return None
    t8 = table_by_header(["Ref", "RBD", "Status", "Note"])
    check("§1 participants table found", t8 is not None)
    check("§1 participants table has 3 rows (header + 2)", t8 is not None and len(t8.rows) == 3, f"found {len(t8.rows) if t8 else 0}")
    check("§1 table lists P-001 and P-002", t8 is not None and "P-001" in t8.cell(1, 0).text and "P-002" in t8.cell(2, 0).text)
    t9 = table_by_header(["Era", "Effective dates", "Description", "IPS location"])
    check("§4 factor table found", t9 is not None)
    check("§4 factor table has 2 rows (header + 1)", t9 is not None and len(t9.rows) == 2, f"found {len(t9.rows) if t9 else 0}")
    check("§4 table lists the 1979 plan", t9 is not None and "1979 plan" in t9.cell(1, 0).text)

    # Footer: one footer part, version line present.
    import zipfile
    z = zipfile.ZipFile(str(OUT))
    names = z.namelist()
    check("zip has word/footer1.xml", "word/footer1.xml" in names)
    footer = z.read("word/footer1.xml").decode("utf-8")
    check("footer has the memo title", "Estimated Benefits Administration Analysis Memo" in footer)
    check("footer has the version line", "Version of 09/18/2020" in footer)
    check("footer has the PAGE field", "PAGE" in footer)
    check("zip has word/_rels/document.xml.rels", "word/_rels/document.xml.rels" in names)
    check("zip has word/styles.xml", "word/styles.xml" in names)
    styles = z.read("word/styles.xml").decode("utf-8")
    check("styles use Times New Roman", "Times New Roman" in styles)
    check("styles define ListParagraph", "ListParagraph" in styles)
    check("styles define Footer", 'w:styleId="Footer"' in styles)

    print()
    if failures:
        print(f"FAILED: {len(failures)} check(s)")
        sys.exit(1)
    print("All docx checks passed.")


if __name__ == "__main__":
    main()
