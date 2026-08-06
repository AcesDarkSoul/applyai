#!/usr/bin/env node
/**
 * Accurate local runner for ApplyAI job discovery + compliant outreach.
 * Works without Docker. Uses the same rules as the n8n workflow.
 *
 * Usage:
 *   node scripts/job-outreach-runner.mjs
 *   npm run outreach
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadCandidateFromEnv,
  processJobs,
  buildEmail,
  buildMailtoUrl,
  buildSms,
  toLogRow,
  rowsToCsv,
  applyContactsToItem,
} from "../lib/outreach.mjs";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const dataDir = path.join(root, "data");
const logPath = path.join(dataDir, "outreach-log.csv");
const statePath = path.join(dataDir, "rate-limits.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readState() {
  if (!fs.existsSync(statePath)) {
    return { email: { day: "", count: 0, ids: [] }, sms: { day: "", count: 0, ids: [] } };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
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

function bumpDay(bucket, today) {
  if (bucket.day !== today) {
    bucket.day = today;
    bucket.count = 0;
    bucket.ids = [];
  }
}

async function fetchJobs(apiKey, query, pages, country = "in") {
  const all = [];
  let cursor = null;

  for (let page = 1; page <= pages; page += 1) {
    const url = new URL("https://jsearch.p.rapidapi.com/search-v2");
    url.searchParams.set("query", query);
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("date_posted", "week");
    url.searchParams.set("country", country);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`JSearch HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    // v5: { data: { jobs: [], cursor } }  | legacy: { data: [] }
    const batch = Array.isArray(json?.data?.jobs)
      ? json.data.jobs
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.jobs)
          ? json.jobs
          : [];
    all.push(...batch);
    cursor = json?.data?.cursor || json?.cursor || null;
    if (!cursor || batch.length === 0) break;
  }
  return all;
}

async function fetchJobDetails(apiKey, jobId, country = "in") {
  const url = new URL("https://jsearch.p.rapidapi.com/job-details");
  url.searchParams.set("job_id", jobId);
  url.searchParams.set("country", country);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
  });
  if (!res.ok) return null;
  const json = await res.json();
  // shapes: data: [job] | data: { 0: job } | data: { jobs: [] }
  if (Array.isArray(json?.data)) return json.data[0] || null;
  if (Array.isArray(json?.data?.jobs)) return json.data.jobs[0] || null;
  if (json?.data && typeof json.data === "object") {
    const first = Object.values(json.data).find(
      (v) => v && typeof v === "object" && (v.job_id || v.job_description)
    );
    return first || null;
  }
  return null;
}

/**
 * For matched jobs without email/phone, pull fuller job-details text and re-extract HR contacts.
 */
async function enrichContacts(apiKey, items, country, enabled) {
  if (!enabled) return items;
  const out = [];
  for (const item of items) {
    if (item.contactEmail || item.contactPhone || !item.jobId) {
      out.push(item);
      continue;
    }
    try {
      const details = await fetchJobDetails(apiKey, item.jobId, country);
      const text = [
        details?.job_description,
        details?.job_highlights?.Qualifications?.join?.(" "),
        details?.job_highlights?.Responsibilities?.join?.(" "),
        item.descriptionSnippet,
      ]
        .filter(Boolean)
        .join("\n");
      const updated = applyContactsToItem(item, text);
      if (updated.contactEmail || updated.contactPhone) {
        updated.enriched = true;
        console.log(
          `  enriched ${item.jobTitle}: ${updated.contactEmail || updated.contactPhone}`
        );
      }
      out.push(updated);
    } catch {
      out.push(item);
    }
  }
  return out;
}

async function sendSendGrid({ to, subject, body, fromEmail, fromName, replyTo, apiKey }) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      reply_to: { email: replyTo },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });
  if (!res.ok && res.status !== 202) {
    const text = await res.text();
    throw new Error(`SendGrid HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function sendTwilio({ to, message, sid, token, from }) {
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

async function main() {
  loadEnvFile(envPath);
  fs.mkdirSync(dataDir, { recursive: true });

  const apiKey = process.env.RAPIDAPI_KEY || "";
  if (!apiKey || apiKey === "your_rapidapi_key") {
    console.error(
      "Missing RAPIDAPI_KEY in n8n/.env\nGet one at: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
    );
    process.exit(1);
  }

  const profile = loadCandidateFromEnv(process.env);
  console.log("Candidate:", profile.candidate.name);
  console.log("Login/from email:", profile.candidate.email || "(set CANDIDATE_EMAIL to your login email)");
  console.log("Email mode:", process.env.OUTREACH_EMAIL_MODE || "device");
  console.log("Profile source:", profile.flags.profileSource);
  console.log("Query:", profile.search.query);
  console.log("Platforms:", profile.flags.platforms.join(", "));
  console.log("Dry run:", profile.flags.dryRun);
  console.log("Fetching jobs...");

  const rawJobs = await fetchJobs(
    apiKey,
    profile.search.query,
    profile.search.pages,
    process.env.JSEARCH_COUNTRY || "in"
  );
  console.log(`Fetched ${rawJobs.length} jobs`);

  const matched = processJobs(rawJobs, profile);
  console.log(`Matched ${matched.length} after skills/platform filter`);

  const enrich =
    String(process.env.APPLY_ENRICH_DETAILS || "true").toLowerCase() !== "false";
  console.log("Enriching contacts from job-details:", enrich);
  const matchedWithContacts = await enrichContacts(
    apiKey,
    matched,
    process.env.JSEARCH_COUNTRY || "in",
    enrich
  );

  const withEmail = matchedWithContacts.filter((j) => j.channel === "email").length;
  const withSms = matchedWithContacts.filter((j) => j.channel === "sms").length;
  console.log(`Contacts found — email: ${withEmail}, sms: ${withSms}`);

  const today = new Date().toISOString().slice(0, 10);
  const state = readState();
  bumpDay(state.email, today);
  bumpDay(state.sms, today);

  const results = [];
  const emailMode = String(process.env.OUTREACH_EMAIL_MODE || "sendgrid").toLowerCase();

  for (const item of matchedWithContacts) {
    if (item.channel === "email") {
      const mail = buildEmail(item);
      const already = state.email.ids.includes(item.jobId);
      let status = "ready";
      let skipReason = null;

      if (already) {
        status = "skipped";
        skipReason = "Already emailed this job today";
      } else if (state.email.count >= profile.limits.dailyEmail) {
        status = "skipped";
        skipReason = `Daily email limit (${profile.limits.dailyEmail})`;
      }

      const row = {
        ...item,
        ...mail,
        outreachType: "email",
        status,
        skipReason,
        mailtoUrl: buildMailtoUrl(mail),
      };

      if (status === "ready" && !profile.flags.dryRun && emailMode === "sendgrid") {
        if (!process.env.SENDGRID_API_KEY) {
          row.status = "skipped_no_sendgrid";
          row.loggedAt = new Date().toISOString();
        } else {
          const fromEmail =
            process.env.SENDGRID_FROM_EMAIL ||
            profile.candidate.email ||
            "noreply@applyai.app";
          try {
            await sendSendGrid({
              ...mail,
              fromEmail,
              fromName: profile.candidate.name,
              replyTo: profile.candidate.email || fromEmail,
              apiKey: process.env.SENDGRID_API_KEY,
            });
            state.email.count += 1;
            state.email.ids.push(item.jobId);
            row.status = "sent";
            row.provider = "sendgrid";
            row.fromEmail = fromEmail;
            row.sentAt = new Date().toISOString();
            console.log(`  AUTO-SENT → ${mail.to} (${item.jobTitle})`);
          } catch (err) {
            row.status = "send_failed";
            row.skipReason = err.message || String(err);
            row.loggedAt = new Date().toISOString();
            console.error(`  SEND FAILED → ${mail.to}: ${row.skipReason}`);
          }
        }
      } else if (status === "ready" && !profile.flags.dryRun && emailMode === "device") {
        openUrl(row.mailtoUrl);
        await sleep(1500);
        state.email.count += 1;
        state.email.ids.push(item.jobId);
        row.status = "opened_mail_app";
        row.provider = "device_mailto";
        row.sentAt = new Date().toISOString();
      } else if (status === "ready") {
        row.status = profile.flags.dryRun ? "dry_run" : "skipped";
        row.loggedAt = new Date().toISOString();
        if (profile.flags.dryRun) {
          console.log(`  DRY-RUN would auto-email → ${mail.to}`);
        }
      }

      results.push(row);
      continue;
    }

    if (item.channel === "sms") {
      const sms = buildSms(item);
      const already = state.sms.ids.includes(item.jobId);
      let status = "ready";
      let skipReason = null;

      if (already) {
        status = "skipped";
        skipReason = "Already SMS'd this job today";
      } else if (state.sms.count >= profile.limits.dailySms) {
        status = "skipped";
        skipReason = `Daily SMS limit (${profile.limits.dailySms})`;
      }

      const row = {
        ...item,
        ...sms,
        outreachType: "sms",
        status,
        skipReason,
      };

      const canSms =
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER;

      if (status === "ready" && !profile.flags.dryRun && canSms) {
        await sendTwilio({
          ...sms,
          sid: process.env.TWILIO_ACCOUNT_SID,
          token: process.env.TWILIO_AUTH_TOKEN,
          from: process.env.TWILIO_FROM_NUMBER,
        });
        state.sms.count += 1;
        state.sms.ids.push(item.jobId);
        row.status = "sent";
        row.sentAt = new Date().toISOString();
      } else if (status === "ready") {
        row.status = profile.flags.dryRun ? "dry_run" : "skipped_no_twilio";
        row.loggedAt = new Date().toISOString();
      }

      results.push(row);
      continue;
    }

    results.push({
      ...item,
      outreachType: "platform_only",
      status: "needs_smart_apply",
      note: "No public email/phone. Open smartApplyUrl (LinkedIn app opens if installed).",
      loggedAt: new Date().toISOString(),
    });
  }

  writeState(state);

  const logRows = results.map(toLogRow);
  const csv = rowsToCsv(logRows);
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, csv);
  } else if (logRows.length) {
    const dataLines = csv.trimEnd().split("\n").slice(1).join("\n");
    fs.appendFileSync(logPath, `\n${dataLines}\n`);
  }

  const summary = {
    fetched: rawJobs.length,
    matched: matched.length,
    email: results.filter((r) => r.outreachType === "email").length,
    sms: results.filter((r) => r.outreachType === "sms").length,
    smartApply: results.filter((r) => r.outreachType === "platform_only").length,
    dryRun: profile.flags.dryRun,
    logFile: logPath,
  };

  console.log("\n=== Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  const preview = results.slice(0, 5).map((r) => ({
    title: r.jobTitle,
    company: r.company,
    platform: r.platform,
    channel: r.outreachType,
    status: r.status,
    contact: r.to || r.contactEmail || r.contactPhone || null,
    apply: r.smartApplyUrl,
  }));
  console.log("\n=== Preview (first 5) ===");
  console.log(JSON.stringify(preview, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
