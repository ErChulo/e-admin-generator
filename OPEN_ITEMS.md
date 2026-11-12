# Open Items — E.Adm Generator v0.1.0

## Decisions made in v0.1.0 (confirmable)

1. **Filename: `<case>EAdm.docx`.** Chosen by analogy with
   `<case>DEL.docx` and `<case>436.docx`. The template names no output
   file. Confirm or rename.
2. **Template typo kept.** §2 says "Use the standard ERPD language"
   in the template. The generated memo keeps "ERPD" as written. The
   app notes the typo in Help and in the review step. Do not silently
   correct it without noting it.
3. **Lists are tables.** The template has no tables for the §1
   participant list, the §3 QPSA list, or the §4 factor sets. The app
   renders them as small Table Grid tables to document the findings
   clearly. The review step shows them.
4. **Participant refs only.** The JSON carries participant refs
   (e.g. `P-001`), never names or SSNs. The actuary adds names in the
   final memo if needed. The memo instructs EBLS to send applications;
   the refs identify the participants.
5. **§2 EPRD language is required.** It must come from the Actuarial
   Case Memo, verbatim. The app never writes its own EPRD language.
   If the Case Memo has none, the actuary adds it before generating.

## Not in v0.1.0 (later versions)

6. **RBD computation.** v0.1.0 takes the RBD findings as data (the
   LLM or the actuary supplies the list of participants past or
   within 180 days of RBD). It does not compute RBDs from DOB and
   separation dates. A later version can compute RBDs from the
   participant data: April 1 following the later of the age-70.5/72
   year and the separation year, with the 5% owner and QPSA/QDRO
   exceptions.
7. **EPRD computation.** Same: v0.1.0 takes the EPRD language as
   text. Computing EPRDs from plan provisions and participant data is
   a later version.
8. **SPECTRUM import.** The user uploads participant data as JSON.
   The app cannot fetch SPECTRUM, QuEST, or TRMD. The exact upload
   shape for a SPECTRUM download is a design decision for a later
   version.

## Gaps carried from the reference inventory

9. **TP texts not found.** TP 20.2, TP 36, TP 51 have no standalone
   files in the Book of Job. The app guides from the template text,
   not from TP text.
10. **Policy 5.11-2 full text not found.** Its AMEC single-sum rule
    is known only through Policy 5.11-1 §F. The app states nothing
    beyond that cross-reference.
11. **Policy 6.2-1 full text not found.** Only its Appendix (worked
    examples) is in the compendium. The §B scope rule (no earnings
    offsets in estimated benefits) is as extracted; verify against
    the policy itself when found.
12. **Policy 5.2-5 4th Ed. body not located.** The age-72 rule for
    participants born after June 30, 1949, is stated only in the
    template. The 3rd Ed. body states age 70.5 only. Do not present
    the 72 rule as verified from the policy until the 4th Ed. text
    is found.
13. **Policy 5.2-5 vs 5.3-5 numbering.** The template cites 5.2-5.
    CASE_PROCESSING.txt lists 5.3-5. One number is stale. The app
    uses 5.2-5.
14. **No IVS code for the EBAAM memos.** Both memos image under
    Index 9C Actuarial. No finer code found.
15. **No IVS code for QDROs, disability-plan documents, the Earnings
    Offsets Summary, or the TP 36 evaluation.** Record as gaps.
16. **No filled E.Adm example file.** The app is built from the blank
    template plus the policies. No real case values are in this repo.

## Testing still owed

17. **Office end-to-end test.** Open the file on the office desktop,
    run a real plan through it, report what breaks. Ball in Herick's
    court.
18. **Real LLM run.** The prompt has not been run against a real LLM
    yet (demo JSON only). The first real run will show what the LLM
    gets wrong.
