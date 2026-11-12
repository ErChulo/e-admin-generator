"use strict";
/* E.Adm Generator v0.1.0 — test runner.
   Loads the single <script> block of eadm-generator.html into a Node vm
   (no DOM, no localStorage, no navigator — the pure logic only) and
   checks schema validation, the demo, and the .docx bytes.
   Run: node tests/run.cjs   (exits non-zero on any failure) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "eadm-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("FAIL: no <script> block in eadm-generator.html"); process.exit(1); }
const script = m[1];

const sandbox = {
  console,
  TextEncoder,
  Blob,
  URL,
  File,
  setTimeout,
};
vm.createContext(sandbox);
try {
  vm.runInContext(script, sandbox, { filename: "eadm-generator.html" });
} catch (e) {
  console.error("FAIL: script did not load:", e.message);
  process.exit(1);
}
const EADM = sandbox.EADM;
if (!EADM) { console.error("FAIL: globalThis.EADM not exported"); process.exit(1); }

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  " + name); }
  else { fail++; console.log("FAIL  " + name + (extra ? " — " + extra : "")); }
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

console.log("E.Adm Generator v" + EADM.VERSION + " — tests");

/* --- 1. Schema + demo --- */
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schema", "eadm.schema.json"), "utf-8"));
check("schema is valid JSON with caseData + sections + sources", Object.keys(schema.properties).length === 3 && schema.properties.caseData && schema.properties.sections && schema.properties.sources);
check("schema has 7 sections", Object.keys(schema.properties.sections.properties).length === 7);
const demo = EADM.DEMO_JSON;
check("demo has 7 sections", Object.keys(demo.sections).length === 7);
check("demo case number is text", typeof demo.caseData.caseNumber === "string");
check("demo validates clean", EADM.validate(demo).ok, JSON.stringify(EADM.validate(demo).errors));
const demoFile = JSON.parse(fs.readFileSync(path.join(ROOT, "samples", "eadm-demo.json"), "utf-8"));
check("samples/eadm-demo.json matches the embedded demo", JSON.stringify(demoFile) === JSON.stringify(demo));

/* --- 2. Validation rejects bad input --- */
function expectInvalid(name, mutate) {
  const d = clone(demo);
  mutate(d);
  const r = EADM.validate(d);
  check(name, !r.ok && r.errors.length > 0, r.ok ? "passed validation" : "");
}
expectInvalid("missing case number rejected", d => { d.caseData.caseNumber = ""; });
expectInvalid("bad DOPT rejected", d => { d.caseData.dopt = "June 30 2024"; });
expectInvalid("bad memo date rejected", d => { d.caseData.memoDate = "11/11/2026"; });
expectInvalid("s1 yes without participants rejected", d => { d.sections.s1.participants = []; });
expectInvalid("s1 participant without RBD rejected", d => { d.sections.s1.participants[0].rbd = "soon"; });
expectInvalid("s1 participant bad status rejected", d => { d.sections.s1.participants[0].status = "maybe"; });
expectInvalid("s1 facts missing rejected", d => { d.sections.s1.facts = ""; });
expectInvalid("s2 missing EPRD language rejected", d => { d.sections.s2.eprdLanguage = ""; });
expectInvalid("s2 missing a question rejected", d => { delete d.sections.s2.lumpSums; });
expectInvalid("s3 yes without QPSAs rejected", d => { d.sections.s3.answer = "yes"; d.sections.s3.qpsas = []; });
expectInvalid("s4 yes without factor sets rejected", d => { d.sections.s4.answer = "yes"; d.sections.s4.earlierSets = []; });
expectInvalid("s5 yes without guidance rejected", d => { d.sections.s5.answer = "yes"; d.sections.s5.guidance = ""; });
expectInvalid("s6 yes without summary ref rejected", d => { d.sections.s6.answer = "yes"; d.sections.s6.summaryRef = ""; });
expectInvalid("s7 bad selection rejected", d => { d.sections.s7.selection = "maybe"; });
expectInvalid("s7 MEC without evaluation ref rejected", d => { d.sections.s7.evaluationRef = ""; });
expectInvalid("s7 other without details rejected", d => { d.sections.s7.selection = "other"; d.sections.s7.otherDetails = ""; });

/* --- 3. Validation warnings (not errors) --- */
const w1 = clone(demo); w1.sections.s2.windowPeriods = "yes";
check("window periods yes warns but passes", EADM.validate(w1).ok && EADM.validate(w1).warnings.length > 0);
const w2 = clone(demo); // demo s6 is already yes
check("s6 yes warns about no offsets in estimated benefits", EADM.validate(w2).warnings.some(w => w.indexOf("does not apply earnings offsets") >= 0));

/* --- 4. Helpers --- */
check("fmtMDY converts ISO to M/D/Y", EADM.fmtMDY("2024-06-30") === "06/30/2024");
check("fmtMDY passes through bad input", EADM.fmtMDY("") === "");
check("isISO accepts YYYY-MM-DD", EADM.isISO("2026-11-11"));
check("isISO rejects other formats", !EADM.isISO("11/11/2026") && !EADM.isISO("2026-13-01"));
check("filename keeps leading zeros", EADM.docxFilename({ caseNumber: "00123456" }) === "00123456EAdm.docx");
check("filename without case falls back", EADM.docxFilename({}) === "EAdm.docx");

/* --- 5. Docx bytes --- */
const bytes = EADM.buildDocxBytes(demo);
check("docx bytes are a byte view (cross-realm: ArrayBuffer.isView)", ArrayBuffer.isView(bytes));
check("docx starts with PK zip signature", bytes[0] === 0x50 && bytes[1] === 0x4B);
check("docx is deterministic (same bytes twice)", Buffer.from(EADM.buildDocxBytes(demo)).equals(Buffer.from(bytes)));
const text = Buffer.from(bytes).toString("utf-8");
check("docx contains the plan name", text.indexOf("Harborview Manufacturing Pension Plan") >= 0);
check("docx contains the case number", text.indexOf("12345678") >= 0);
check("docx contains DOPT as M/D/Y", text.indexOf("06/30/2024") >= 0);
check("docx contains all 7 section heads", [1, 2, 3, 4, 5, 6, 7].every(n => text.indexOf(EADM.SECTIONS[n - 1].title) >= 0));
check("docx contains the §1 participants", text.indexOf("P-001") >= 0 && text.indexOf("P-002") >= 0);
check("docx contains the §4 factor set", text.indexOf("1979 plan") >= 0 && text.indexOf("IPS 9C #12340001") >= 0);
check("docx contains the §6 summary ref", text.indexOf("IPS 9C #12340002") >= 0);
check("docx contains the §7 MEC permitted statement only", text.indexOf("may be withdrawn in a single sum") >= 0 && text.indexOf("may not be withdrawn") < 0 && text.indexOf("does not include employee contributions") < 0);
check("docx contains the template footer version", text.indexOf("Version of 09/18/2020") >= 0);
check("docx contains the PAGE field", text.indexOf("PAGE") >= 0);
check("docx has the footer part", text.indexOf("word/footer1.xml") >= 0);
check("docx uses Times New Roman", text.indexOf("Times New Roman") >= 0);
check("docx section heads are gray shaded", text.indexOf("E6E6E6") >= 0);
check("docx keeps the template ERPD spelling", text.indexOf("ERPD language") >= 0);
check("docx has no placeholder text left", text.indexOf("State facts and circumstances here") < 0);
check("docx escapes XML in user text", (() => {
  const d2 = clone(demo);
  d2.sections.s1.facts = "A & B <test>";
  return Buffer.from(EADM.buildDocxBytes(d2)).toString("utf-8").indexOf("A &amp; B &lt;test&gt;") >= 0;
})());
check("fromSection ASD/D does not double to ASD/ASD/D", (() => {
  const d2 = clone(demo);
  d2.caseData.fromSection = "ASD/D";
  const t = Buffer.from(EADM.buildDocxBytes(d2)).toString("utf-8");
  return t.indexOf("ASD/ASD/D") < 0 && t.indexOf("ASD/D") >= 0;
})());

/* --- 6. Prompt (after build) --- */
check("scraper prompt is embedded", typeof EADM.SCRAPER_PROMPT === "string" && EADM.SCRAPER_PROMPT.length > 1000);
check("prompt names all 7 sections", ["s1", "s2", "s3", "s4", "s5", "s6", "s7"].every(s => EADM.SCRAPER_PROMPT.indexOf(s) >= 0));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
