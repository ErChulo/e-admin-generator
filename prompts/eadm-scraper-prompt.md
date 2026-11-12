# E.Adm — Estimated Benefits Administration Analysis Scraper Prompt

Use this prompt with an LLM of your choice. Attach the plan documents
**and** the other associated documents — plan document, amendments,
restatements, union contracts, the R5 Preliminary Plan Summary, the PF
factor sets per era, participant data (SPECTRUM download from TRMD),
the Earnings Offsets Summary if any, the Employee Contributions
Processing Evaluation (TP 36) if any, and the Actuarial Case Memo
EPRD language — together with this prompt. The LLM must return **only**
the JSON payload described below. That JSON is a *proposal*: it is fed
back into the E.Adm Generator app, validated against
`schema/eadm.schema.json`, reviewed by a human section by section, and
only approved JSON is used to write the Estimated Benefits
Administration Analysis memo. The LLM never fills the memo and never
decides an ambiguous answer on its own.

Do **not** attach the §436 Evaluation or the DEL. They are not E.Adm
inputs.

## Your task

You are preparing the Estimated Benefits Administration Analysis memo
for a terminated defined-benefit pension plan. For each of the 7
sections below, find the answer in the documents, state the facts and
circumstances, and give the citation (document, section, page) where
each answer comes from. Return the answers as JSON matching the schema
in `schema/eadm.schema.json` (also summarised in "Output format"
below).

## Rules

- **Summarise, do not copy verbatim — ASD STE 100 minimal style.**
  Every facts text must be the **smallest string that conveys the
  meaning**: a noun phrase or short clause, never a full paragraph,
  one idea per line. Keep ages, service years, percentages, dollar
  amounts, and dates **exact**. Standard abbreviations: `yr`/`yrs`,
  `mo`, `hrs`, `%`, `§`, `excl.`, `equiv.`, `avg comp`, `svc`
  (service). If stripping verbiage would lose meaning (a condition,
  an exception, a date), keep the longer form and say why in `note`.
  A longer value that is still true beats a minimal value that is
  wrong.
- **One entry per section.** Every one of the 7 sections must be
  present in `sections`. Do not omit a section.
- **Yes/No answers.** Sections 1, 3, 4, 5, 6 take `yes` or `no`.
  Section 2 takes `yes` or `no` for each of its four questions.
  Section 7 takes one selection: `none`, `mecPermitted`,
  `mecNotPermitted`, `vec`, or `other`.
- **Citation for every answer**: document name, page number, and plan
  section number in the JSON `citation` object. No citation, no
  answer. The app renders it as a minimal code, e.g. `D1 §2.1 p3`
  (D1 = first document, § = plan section, p = page) — the full
  document name lives once in the sources list, never repeated in a
  cell.
- **Participant refs, never names or SSNs.** For §1 and §3 lists, use
  the participant reference from the SPECTRUM data (e.g. `P-001`),
  never a name, SSN, or address. The memo instructs EBLS to send
  applications; the actuary adds names in the final memo if needed.
- **Dates are ISO format `YYYY-MM-DD`. Case number is text, with
  leading zeros preserved (never a number).**
- **Do not guess.** A missing or ambiguous answer is a correct
  answer. A guessed value is an error. If you cannot find an answer,
  set the section to `no` with facts "Not found in the documents
  provided" and say so in `note` — do not invent a provision.
- **Never return a full masked value** (no full SSN, no full account
  number).

## Section 1 — Required Beginning Dates (Policy 5.2-5, TP 20.2)

Rule: the RBD for participants (other than 5% owners) is April 1 of
the calendar year following the later of (1) the calendar year the
participant attains age 70.5 (born on or before June 30, 1949) or 72
(born after June 30, 1949), and (2) the calendar year the participant
separates from service. Different rules apply to QPSA beneficiaries
and alternate payees under QDROs.

Question: are there any participants who are past or within 180 days
of their required beginning dates but who are not yet in pay?

- If yes: list each participant (ref, RBD, past or within 180 days,
  note) and state the facts.
- If no: state the facts and circumstances (e.g. all participants
  past RBD are already in pay).

## Section 2 — Earliest PBGC Retirement Date, EPRD (Policies 5.2-4, 6.1-2)

Rule: if the participant's Earliest Annuity Date is on or after the
date the participant reaches age 55, the EPRD is Earliest Annuity
Date. If it is before age 55, the EPRD is the date the participant
reaches age 55, unless PBGC decides, under a facts-and-circumstances
test, that the participant could retire earlier.

Answer the four questions, yes or no each:

1. Does the plan offer non-de minimis lump sums at termination of
   employment?
2. Does the plan provide annuities prior to age 55?
3. Does plan allow for Early Unreduced Benefits?
4. Does this plan contain "window" periods? (If yes, contact Ask PPD
   for guidance.)

`eprdLanguage`: copy the standard EPRD language from the Actuarial
Case Memo, verbatim. Do not write your own EPRD language. If the Case
Memo has no EPRD language, say so in `note` and leave
`eprdLanguage` empty — the actuary will add it.

## Section 3 — Retroactive QPSAs (Policies 5.2-4, 5.7-2)

Rule: a QPSA may be paid retroactively to the later of the
participant's EPRD and the first day of the month following the month
of the participant's death, if the application is received within 90
days from the date of the letter sending the application to the
surviving spouse. If the participant died before DOPT and the spouse
was not previously notified of entitlement to a QPSA benefit, the
spouse may be due a retroactive QPSA payable as a pre-termination
liability. If PBGC decided the spouse was previously offered the
chance to commence QPSA benefits and deferred, the spouse is not
eligible for a retroactive annuity.

Question: are there any beneficiaries entitled to QPSAs with annuity
starting dates retroactive to dates prior to DOPT?

- If yes: list each QPSA (ref, death date, EPRD, retroactive to,
  note) and state the facts.
- If no: state the facts and circumstances.

## Section 4 — Review of Plan Adjustment Factors

Question: did earlier plan documents provide different Early
Retirement, Late Retirement, or Form Conversion Factors than the DOPT
plan document?

- If yes: list each earlier factor set (era, effective dates,
  description of the difference, IPS location) and state the facts.
  Use the PF factor sets per era where available.
- If no: state the facts and circumstances.

## Section 5 — Restrictions from another source

Question: does the plan restrict benefits payable while participants
are receiving certain benefits from another source?

- If yes: describe the provisions briefly and give guidance for
  benefit payments (e.g. a disability benefit from another plan that
  blocks early retirement, or an offset). State the facts.
- If no: state the facts and circumstances.

## Section 6 — Benefit Supplements Subject to Earnings Offsets (Policy 6.2-1, TP 51)

Rule: a plan may reduce a participant's temporary supplement based on
earnings.

Question: are there benefit supplements that are subject to earnings
offsets?

- If yes: give the reference to the Earnings Offsets Summary
  (attached or IPS location). Do not compute any offset amount —
  PBGC does not apply earnings offsets in estimated benefits.
- If no: answer `no`.

## Section 7 — Employee Contributions (Policies 5.11-1, 5.11-2, TP 36)

If the plan has no employee contributions, select `none`.

If the plan has employee contributions, select one:

- `mecPermitted` — mandatory employee contribution (MEC), and the
  AMEC may be withdrawn in a single sum as provided in Policy 5.11-2.
- `mecNotPermitted` — MEC, and the AMEC may not be withdrawn in a
  single sum as provided in Policy 5.11-2.
- `vec` — voluntary employee contributions (VEC). See the attached
  guidance from PPD and/or OGC.
- `other` — give the details in `otherDetails`.

For MEC, give the reference to the Employee Contributions Processing
Evaluation (TP 36) in `evaluationRef`. The evaluation itself must be
completed; do not summarise it from the plan document alone.

## Output format

Return **only** valid JSON, no markdown fences, no commentary, no
explanation. The JSON must have exactly these top-level keys:

```json
{
  "caseData": {
    "toEbls": "string or null",
    "toFieldOffice": "string or null",
    "fromActuary": "string or null",
    "fromSection": "string or null",
    "fromContractActuary": "string or null",
    "fromFirm": "string or null",
    "ccSupervisor": "string or null",
    "memoDate": "YYYY-MM-DD",
    "caseNumber": "string (text, leading zeros preserved)",
    "planName": "string",
    "bpd": "YYYY-MM-DD or null",
    "dopt": "YYYY-MM-DD",
    "dotr": "YYYY-MM-DD or null"
  },
  "sections": {
    "s1": {
      "answer": "yes | no",
      "facts": "string",
      "participants": [
        { "ref": "string", "rbd": "YYYY-MM-DD", "status": "past | within180", "note": "string or null" }
      ],
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s2": {
      "lumpSums": "yes | no",
      "annuitiesBefore55": "yes | no",
      "earlyUnreduced": "yes | no",
      "windowPeriods": "yes | no",
      "eprdLanguage": "string",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s3": {
      "answer": "yes | no",
      "facts": "string",
      "qpsas": [
        { "ref": "string", "deathDate": "YYYY-MM-DD or null", "eprd": "YYYY-MM-DD or null", "retroactiveTo": "YYYY-MM-DD or null", "note": "string or null" }
      ],
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s4": {
      "answer": "yes | no",
      "facts": "string",
      "earlierSets": [
        { "era": "string", "effectiveDates": "string", "description": "string", "ipsLocation": "string" }
      ],
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s5": {
      "answer": "yes | no",
      "facts": "string",
      "guidance": "string or null",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s6": {
      "answer": "yes | no",
      "summaryRef": "string or null",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    },
    "s7": {
      "selection": "none | mecPermitted | mecNotPermitted | vec | other",
      "otherDetails": "string or null",
      "evaluationRef": "string or null",
      "citation": { "document": "string", "page": "string or number or null", "section": "string or null" },
      "note": "string or null"
    }
  },
  "sources": [
    { "name": "string", "format": "H | E | null", "used": "U | NU | null" }
  ]
}
```

Every one of the 7 sections must be present in `sections`. `sources`
lists every document you used, with format H (hard copy) or E
(electronic) and whether it was used (U) or not (NU).

## Workflow reminder (for the human, not the LLM)

1. Download this prompt from the E.Adm Generator app.
2. Feed the plan documents and associated documents + this prompt to
   your LLM (Microsoft Copilot in the office, any LLM at home).
3. Take the JSON the LLM returns and upload / paste it back into the
   E.Adm Generator app.
4. The app validates the JSON against the schema, flags missing /
   ambiguous / uncited items, and you review and approve each section.
5. Only approved JSON writes the filled memo Word document.
