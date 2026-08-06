#!/usr/bin/env node
/**
 * Open Smart Apply / LinkedIn job links from outreach-log.csv
 *
 * Usage:
 *   npm run open:links              # LinkedIn + needs_smart_apply only
 *   npm run open:links -- --all     # all rows with applyUrl
 *   npm run open:links -- --limit 3 # open first 3
 *   npm run open:links -- --list    # print URLs only (no browser)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logPath = path.join(root, "data", "outreach-log.csv");

function parseArgs(argv) {
  const out = { all: false, list: false, limit: 5, linkedinOnly: true };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--all") {
      out.all = true;
      out.linkedinOnly = false;
    } else if (a === "--list") out.list = true;
    else if (a === "--limit") out.limit = Number(argv[++i] || 5);
    else if (a === "--linkedin") out.linkedinOnly = true;
  }
  return out;
}

/** Minimal CSV parser for our log (handles quoted fields) */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch === "\r") {
      // skip
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim()));
}

function openUrl(url) {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(logPath)) {
    console.error(`No log yet: ${logPath}\nRun: npm run outreach`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(logPath, "utf8"));
  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const header = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const jobs = rows
    .slice(1)
    .map((r) => ({
      title: r[idx.jobTitle] || "",
      company: r[idx.company] || "",
      platform: (r[idx.platform] || "").toLowerCase(),
      status: r[idx.status] || "",
      applyUrl: r[idx.applyUrl] || "",
    }))
    .filter((j) => j.applyUrl.startsWith("http"));

  let selected = jobs;
  if (!opts.all) {
    selected = jobs.filter(
      (j) =>
        j.status === "needs_smart_apply" &&
        (!opts.linkedinOnly || j.platform === "linkedin" || j.applyUrl.includes("linkedin.com"))
    );
  }

  // de-dupe by URL (latest CSV may have repeats across runs)
  const seen = new Set();
  selected = selected.filter((j) => {
    if (seen.has(j.applyUrl)) return false;
    seen.add(j.applyUrl);
    return true;
  });

  selected = selected.slice(0, Math.max(1, opts.limit));

  if (!selected.length) {
    console.log("No matching apply links. Run npm run outreach first.");
    process.exit(0);
  }

  console.log(`Found ${selected.length} link(s) to ${opts.list ? "list" : "open"}:\n`);
  for (const [i, j] of selected.entries()) {
    console.log(`${i + 1}. ${j.title} @ ${j.company}`);
    console.log(`   ${j.applyUrl}\n`);
  }

  if (opts.list) return;

  console.log("Opening in your browser (LinkedIn app may open on mobile/desktop if installed)...");
  for (const j of selected) {
    openUrl(j.applyUrl);
    await sleep(1200); // avoid popup storm
  }
  console.log("Done. Apply manually on each tab, then attach your resume.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
