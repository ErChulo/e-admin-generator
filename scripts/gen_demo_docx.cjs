"use strict";
/* Generate the demo E.Adm memo using the HTML's own code.
   Usage: node scripts/gen_demo_docx.cjs [/tmp/eadm-demo.docx] */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT = process.argv[2] || "/tmp/eadm-demo.docx";

const html = fs.readFileSync(path.join(ROOT, "eadm-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox);
const EADM = sandbox.EADM;
const demo = EADM.DEMO_JSON;
const bytes = EADM.buildDocxBytes(demo);
fs.writeFileSync(OUT, Buffer.from(bytes));
console.log("Wrote " + OUT + " (" + bytes.length + " bytes, " + EADM.docxFilename(demo.caseData) + ")");
