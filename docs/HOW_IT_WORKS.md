# How It Works — E.Adm Generator v0.1.0

ASD STE 100. One idea per line.

## The memo

- The E.Adm memo identifies operating policies and issues that affect
  the administration of benefits under the plan.
- It decides who should be in pay, and what must happen before they
  are placed in pay.
- It does not decide benefit amounts. That is the E.Adj memo's work.
- Template: `Estimated Benefits Administration Analysis Memo.docx`,
  version of 09/18/2020. Plain memo. No `[[tags]]`.

## The five steps

1. **Case.** Fill the header: TO (EBLS, field office), FROM (actuary,
   contract actuary if any), CC (EBS supervisor), date, case number,
   plan name, BPD, DOPT, DOTR. Header data comes from PBGC case
   records, not from plan documents.
2. **Prompt.** Download the scraper prompt. Feed it and the documents
   to an LLM (Copilot in the office, any LLM at home).
3. **Upload JSON.** Paste or upload the JSON the LLM returned. The app
   validates it against the schema. Bad answers are rejected, never
   auto-filled.
4. **Review.** Seven section cards. Each shows the answer, the facts,
   and the lists. Approve each section. Nothing generates until all
   seven are approved.
5. **Download.** Generate `<case>EAdm.docx`. Also download the inputs
   JSON and the audit log.

## The seven sections

1. **Required Beginning Dates.** Policy 5.2-5, TP 20.2. Any
   participants past or within 180 days of RBD and not yet in pay?
   Yes: list them (ref, RBD, past or within 180 days) and instruct
   EBLS or the field office to send applications commencing on the
   RBD. No: state facts and circumstances.
2. **EPRD.** Policies 5.2-4, 6.1-2. Four Yes/No questions: non-de
   minimis lump sums, annuities before age 55, early unreduced
   benefits, window periods. The EPRD language comes from the
   Actuarial Case Memo — the app inserts it verbatim and never writes
   its own. Note: the template spells it "ERPD" in one line. That is
   the template's typo, kept as written.
3. **Retroactive QPSAs.** Policies 5.2-4, 5.7-2. Any beneficiaries
   entitled to QPSAs with annuity starting dates retroactive to dates
   before DOPT? Yes: list them and instruct EBLS or the field office
   to send applications commencing retroactively.
4. **Plan Adjustment Factors.** Did earlier plan documents provide
   different ERF, LRF, or BFCF than the DOPT document? Yes: list the
   earlier sets (era, effective dates, description, IPS location).
5. **Restrictions from another source.** Does the plan restrict
   benefits payable while participants receive certain benefits from
   another source? Yes: describe the provisions and give guidance for
   benefit payments.
6. **Earnings Offsets.** Policy 6.2-1, TP 51. Any benefit supplements
   subject to earnings offsets? Yes: attach or reference the Earnings
   Offsets Summary. Note: PBGC does **not** apply earnings offsets in
   estimated benefits. This section only identifies the supplements.
7. **Employee Contributions.** Policies 5.11-1, 5.11-2, TP 36. Select
   the statements that apply; the rest are deleted. MEC: the AMEC may
   or may not be withdrawn in a single sum, per Policy 5.11-2. VEC:
   see PPD and/or OGC guidance.

## How the .docx is written

- The app builds the .docx from scratch, in JavaScript. No template
  file is embedded. The fixed template text lives in the app as
  constants, in the template's own words.
- A minimal stored ZIP writer (no compression) + CRC-32, the same
  pattern as the DEL and 436 generators.
- Parts: `[Content_Types].xml`, `_rels/.rels`,
  `word/_rels/document.xml.rels`, `word/document.xml`,
  `word/styles.xml`, `word/footer1.xml`.
- Styles: Normal (Times New Roman, 11 pt), List Paragraph, listnote,
  Footer, Table Grid. The template's font is Times New Roman, not
  Calibri.
- Section heads: 1×1 tables, width 9360 dxa, light-gray shading
  E6E6E6, bold text — the template's heads.
- Lists (participants, QPSAs, factor sets) are small tables. The
  template has no tables for them; the app adds tables to document
  the findings clearly.
- Footer: "Estimated Benefits Administration Analysis Memo" + page
  number field + "Version of 09/18/2020", 8 pt.
- Page: Letter, 1-inch margins.
- Filename: `<case>EAdm.docx`. Case number is text; leading zeros
  are kept.

## What the app does not do

- It does not compute RBDs, EPRDs, or benefit amounts. v0.1.0 takes
  the RBD findings as data. Computing RBDs from DOB and separation
  dates is a later version (see OPEN_ITEMS).
- It does not fetch SPECTRUM, QuEST, or TRMD data. The user uploads
  participant data as JSON.
- It does not ask for the §436 Evaluation or the DEL.
- It does not put participant names or SSNs in the JSON. Participant
  refs only.
- It does not send anything anywhere. 0 fetch. All work is local.

## Audit log

- Every action is logged with a timestamp: prompt downloaded, JSON
  validated, section approved or unapproved, memo generated.
- Download it from Step 5 as `eadm-audit-log.txt`.

## Demo

- "Try the demo" loads a synthetic plan (Harborview Manufacturing
  Pension Plan, case 12345678) and jumps to Review.
- The demo is not a real case. No real case values are in this repo.
