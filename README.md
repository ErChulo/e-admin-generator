# E.Adm Generator — Estimated Benefits Administration Analysis

![version](https://img.shields.io/badge/version-0.1.0-blue)
![template](https://img.shields.io/badge/template-09%2F18%2F2020-blue)
![office](https://img.shields.io/badge/office-single%20HTML%20file-green)
![design-system](https://img.shields.io/badge/design--system-v1.1.0%20DRAFT-yellow)

Writes the Estimated Benefits Administration Analysis memo (E.Adm).
One HTML file. Open it with `file://`. No server. No fetch. No install.

## What it does

The memo finds the issues that affect how benefits are administered,
and who should be in pay. Seven sections: Required Beginning Dates,
Earliest PBGC Retirement Date, Retroactive QPSAs, Plan Adjustment
Factors, Restrictions from another source, Earnings Offsets, Employee
Contributions.

Workflow, five steps:

1. Case header (TO, FROM, CC, date, case number, plan name, BPD,
   DOPT, DOTR).
2. Download the scraper prompt.
3. Feed the prompt and the documents to an LLM (Microsoft Copilot in
   the office, any LLM at home). Upload the JSON it returns.
4. Review each of the 7 sections. Approve each one.
5. Generate and download `<case>EAdm.docx` + audit log.

The LLM proposes. You review and approve. Only approved JSON writes
the memo. The app never computes a benefit and never fetches PBGC
systems — participant data comes from your upload.

## Files

| File | What it is |
| --- | --- |
| `eadm-generator.html` | The app. Single file. |
| `prompts/eadm-scraper-prompt.md` | The prompt the LLM gets. |
| `schema/eadm.schema.json` | The JSON the LLM returns. |
| `samples/eadm-demo.json` | Synthetic demo (not a real case). |
| `docs/HOW_IT_WORKS.md` | Mechanics, in plain words. |
| `docs/DESIGN_SYSTEM.md` | Design tokens applied. |
| `OPEN_ITEMS.md` | Open questions and gaps. |

## Template

`Estimated Benefits Administration Analysis Memo.docx`, version of
09/18/2020. Plain memo, no `[[tags]]`. The app reproduces its
structure exactly: the same paragraphs, the same 8 tables, the same
footer. Fixed template text is the template's own words, verbatim.

## Inputs (what the app guides you to upload)

- Plan documents, all eras (5A/5B/5C).
- R5 Preliminary Plan Summary (12D1).
- PF factor sets per era (12E1/12E2/12E3).
- Participant data: SPECTRUM download from TRMD (upload as JSON).
- Earnings Offsets Summary, if any (§6).
- Employee Contributions Processing Evaluation (TP 36), if any (§7).
- Actuarial Case Memo EPRD language (§2).

Not inputs: the §436 Evaluation and the DEL. Do not attach them.

## Rules

- Single HTML file, `file://`, 0 fetch.
- PBGC Design System v1.1.0 DRAFT for the GUI.
- ASD STE 100 minimal language.
- Synthetic data only. Never a live case.
- No LLM in the generation path. Human approval is a gate.
- Mandatory audit log.
- Participant refs only in JSON — never names or SSNs.

## Test

```sh
npm test
```

Runs the unit tests, the browser tests (jsdom), and the docx check
(python-docx on the demo memo).

## Build

```sh
python3 scripts/build_single_file.py
```

Injects the scraper prompt into the HTML and runs the safety checks
(0 fetch, 0 script src, 0 link, 0 external URLs, logo embedded).
