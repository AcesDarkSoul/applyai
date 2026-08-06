#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");

function loadEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const env = { ...loadEnvFile(envPath), ...process.env };
const checks = [
  {
    key: "RAPIDAPI_KEY",
    ok: env.RAPIDAPI_KEY && env.RAPIDAPI_KEY !== "your_rapidapi_key",
    level: "required",
    help: "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch",
  },
  {
    key: "CANDIDATE_NAME",
    ok: env.CANDIDATE_NAME && env.CANDIDATE_NAME !== "Your Name",
    level: "recommended",
  },
  {
    key: "CANDIDATE_EMAIL",
    ok: env.CANDIDATE_EMAIL && !env.CANDIDATE_EMAIL.includes("example.com"),
    level: "recommended",
  },
  {
    key: "CANDIDATE_SKILLS",
    ok: Boolean(env.CANDIDATE_SKILLS),
    level: "recommended",
  },
  {
    key: "SENDGRID_API_KEY",
    ok: Boolean(env.SENDGRID_API_KEY),
    level: "optional",
    help: "Needed only when OUTREACH_DRY_RUN=false for email",
  },
  {
    key: "TWILIO_ACCOUNT_SID",
    ok: Boolean(env.TWILIO_ACCOUNT_SID),
    level: "optional",
    help: "Needed only when OUTREACH_DRY_RUN=false for SMS",
  },
];

let failed = false;
console.log("ApplyAI n8n config check\n");
for (const c of checks) {
  const mark = c.ok ? "OK" : c.level === "required" ? "MISSING" : "EMPTY";
  if (!c.ok && c.level === "required") failed = true;
  console.log(`[${mark}] ${c.key}${c.help && !c.ok ? ` — ${c.help}` : ""}`);
}

console.log(`\nOUTREACH_DRY_RUN=${env.OUTREACH_DRY_RUN || "true"}`);
console.log(`PLATFORM_FILTER=${env.PLATFORM_FILTER || "linkedin,indeed,naukri,other"}`);
console.log(`Workflow: ${path.join(root, "workflows", "job-outreach-auto-apply.json")}`);

if (failed) {
  console.error("\nFix required values in n8n/.env then re-run: npm run validate");
  process.exit(1);
}

console.log("\nReady for: npm run outreach");
