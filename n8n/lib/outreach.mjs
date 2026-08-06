/**
 * Shared ApplyAI outreach helpers — used by the local Node runner.
 * Keep behavior aligned with n8n/workflows/job-outreach-auto-apply.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g;
const BLOCKED_EMAIL =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\.com)/i;

function readCandidateJson() {
  try {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const file = path.join(root, "config", "candidate.json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function loadCandidateFromEnv(env = process.env) {
  const fromFile = readCandidateJson();

  const skillsFromEnv = String(env.CANDIDATE_SKILLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const skills =
    (Array.isArray(fromFile?.skills) && fromFile.skills.length
      ? fromFile.skills
      : skillsFromEnv.length
        ? skillsFromEnv
        : ["JavaScript", "React", "Node.js"]
    ).map(String);

  const platforms = String(env.PLATFORM_FILTER || "linkedin,indeed,naukri,other")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const title =
    fromFile?.title || env.CANDIDATE_TITLE || "Software Developer";
  const location =
    fromFile?.location || env.CANDIDATE_LOCATION || "Remote";
  const defaultQuery =
    (Array.isArray(fromFile?.searchQueries) && fromFile.searchQueries[0]) ||
    `${title} India`;

  return {
    candidate: {
      name: fromFile?.name || env.CANDIDATE_NAME || "Your Name",
      email: fromFile?.email || env.CANDIDATE_EMAIL || "",
      phone: fromFile?.phone || env.CANDIDATE_PHONE || "",
      title,
      location,
      skills,
      resumeUrl:
        fromFile?.resumeUrl ||
        fromFile?.resumeFile ||
        env.CANDIDATE_RESUME_URL ||
        "",
      yearsExperience: Number(
        fromFile?.yearsExperience ?? env.CANDIDATE_YEARS_EXP ?? 0
      ),
      summary: fromFile?.summary || "",
      linkedin: fromFile?.linkedin || "",
    },
    search: {
      query: env.JSEARCH_QUERY || defaultQuery,
      pages: Math.max(1, Number(env.JSEARCH_PAGES || 1)),
    },
    limits: {
      dailyEmail: Number(
        fromFile?.dailyEmailLimit ?? env.DAILY_EMAIL_LIMIT ?? 10
      ),
      dailySms: Number(fromFile?.dailySmsLimit ?? env.DAILY_SMS_LIMIT ?? 5),
      minMatchScore: Number(
        fromFile?.minMatchScore ?? env.MIN_MATCH_SCORE ?? 50
      ),
    },
    flags: {
      dryRun: String(env.OUTREACH_DRY_RUN || "true").toLowerCase() !== "false",
      platforms,
      profileSource: fromFile ? "candidate.json" : "env",
    },
  };
}

export function detectPlatform(job = {}) {
  const hay = [
    job.job_apply_link,
    job.job_google_link,
    job.job_publisher,
    job.employer_name,
    job.employer_website,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (hay.includes("linkedin")) return "linkedin";
  if (hay.includes("indeed")) return "indeed";
  if (hay.includes("naukri")) return "naukri";
  if (hay.includes("glassdoor")) return "glassdoor";
  return "other";
}

export function buildSmartApplyUrls(job = {}, platform) {
  const applyUrl = job.job_apply_link || job.job_google_link || "";
  const linkedInWeb =
    platform === "linkedin" && applyUrl.includes("linkedin.com")
      ? applyUrl
      : platform === "linkedin"
        ? applyUrl
        : null;

  // Opens LinkedIn app when installed (mobile OS handles https → app)
  const linkedInAppUrl = linkedInWeb
    ? linkedInWeb.replace("https://www.linkedin.com", "https://www.linkedin.com")
    : null;

  return {
    applyUrl,
    smartApplyUrl: applyUrl,
    linkedInAppUrl,
  };
}

export function scoreJob(job, skills = []) {
  const title = String(job.job_title || "").toLowerCase();
  const desc = String(job.job_description || "").toLowerCase();
  const req = (job.job_required_skills || []).map((s) => String(s).toLowerCase());
  const blob = `${title} ${desc} ${req.join(" ")}`;
  if (!skills.length) return 50;
  const normSkills = skills.map((s) => String(s).toLowerCase());
  const hits = normSkills.filter((s) => blob.includes(s));
  const base = Math.round((hits.length / normSkills.length) * 100);
  const remoteBoost = job.job_is_remote ? 5 : 0;
  return Math.min(100, base + remoteBoost);
}

export function extractContacts(text = "") {
  const emails = [
    ...new Set((text.match(EMAIL_RE) || []).filter((e) => !BLOCKED_EMAIL.test(e))),
  ];
  const phones = [
    ...new Set(
      (text.match(PHONE_RE) || []).map((p) => p.replace(/\s+/g, " ").trim())
    ),
  ];
  return {
    contactEmail: emails[0] || null,
    contactPhone: phones[0] || null,
    allEmails: emails,
    allPhones: phones,
  };
}

/** Prefer HR-looking addresses when several emails appear in a post */
export function pickBestEmail(emails = []) {
  if (!emails.length) return null;
  const scored = emails.map((email) => {
    const e = email.toLowerCase();
    let score = 0;
    if (/^(hr|careers|jobs|recruit|talent|hiring|people|apply)@/.test(e)) score += 5;
    if (/hr|career|recruit|talent|hiring|jobs/.test(e)) score += 3;
    if (/info@|hello@|contact@|support@/.test(e)) score += 1;
    if (/gmail|yahoo|outlook|hotmail/.test(e)) score += 1;
    return { email, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].email;
}

export function applyContactsToItem(item, text) {
  const contacts = extractContacts(text || "");
  const bestEmail = pickBestEmail(contacts.allEmails);
  const contactEmail = bestEmail || contacts.contactEmail;
  const contactPhone = contacts.contactPhone;
  let channel = "platform_only";
  if (contactEmail) channel = "email";
  else if (contactPhone) channel = "sms";
  return {
    ...item,
    contactEmail,
    contactPhone,
    channel,
    allEmails: contacts.allEmails,
    allPhones: contacts.allPhones,
  };
}

export function processJobs(rawJobs, profile) {
  const skills = profile.candidate.skills || [];
  const minScore = profile.limits.minMatchScore;
  const allowed = new Set(profile.flags.platforms || []);
  const dryRun = profile.flags.dryRun;
  const jobs = Array.isArray(rawJobs) ? rawJobs : [];
  const out = [];

  for (const job of jobs) {
    const platform = detectPlatform(job);
    if (allowed.size && !allowed.has(platform) && !allowed.has("all")) continue;

    const matchScore = scoreJob(job, skills);
    if (matchScore < minScore) continue;

    const description = job.job_description || "";
    const contacts = extractContacts(description);
    const urls = buildSmartApplyUrls(job, platform);

    let channel = "platform_only";
    const bestEmail = pickBestEmail(contacts.allEmails);
    if (bestEmail || contacts.contactEmail) channel = "email";
    else if (contacts.contactPhone) channel = "sms";

    out.push({
      jobId: job.job_id,
      jobTitle: job.job_title,
      company: job.employer_name,
      location: [job.job_city, job.job_state, job.job_country]
        .filter(Boolean)
        .join(", "),
      isRemote: !!job.job_is_remote,
      platform,
      matchScore,
      channel,
      contactEmail: bestEmail || contacts.contactEmail,
      contactPhone: contacts.contactPhone,
      allEmails: contacts.allEmails,
      allPhones: contacts.allPhones,
      postedAt: job.job_posted_at_datetime_utc || null,
      dryRun,
      ...urls,
      candidate: profile.candidate,
      limits: profile.limits,
      descriptionSnippet: String(description).slice(0, 400),
    });
  }

  return out;
}

export function buildEmail(item) {
  const name = item.candidate?.name || "Candidate";
  const skills = (item.candidate?.skills || []).slice(0, 3).join(", ");
  const resume = item.candidate?.resumeUrl || "";
  const fromEmail = item.candidate?.email || "";
  return {
    to: item.contactEmail,
    fromEmail,
    subject: `Application for ${item.jobTitle} at ${item.company} — ${name}`,
    body: `Hello Hiring Team,\n\nI am ${name}, interested in the ${item.jobTitle} role at ${item.company}.\n\nRelevant skills: ${skills}.\nResume: ${resume}\n\nI would welcome a short conversation about fit.\n\nBest regards,\n${name}\n${fromEmail}\n${item.candidate?.phone || ""}`,
  };
}

/** Opens in the user's default mail app — email is sent FROM their logged-in/device account */
export function buildMailtoUrl({ to, subject, body }) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${encodeURIComponent(to || "")}?${params.toString()}`;
}

export function buildSms(item) {
  const name = item.candidate?.name || "Candidate";
  const resume = item.candidate?.resumeUrl || "";
  return {
    to: item.contactPhone,
    message: `Hi, I'm ${name} applying for ${item.jobTitle} at ${item.company}. Resume: ${resume}`,
  };
}

export function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toLogRow(item) {
  return {
    timestamp: item.sentAt || item.loggedAt || new Date().toISOString(),
    jobId: item.jobId || "",
    jobTitle: item.jobTitle || "",
    company: item.company || "",
    platform: item.platform || "",
    matchScore: item.matchScore ?? "",
    channel: item.outreachType || item.channel || "",
    contact: item.to || item.contactEmail || item.contactPhone || "",
    status: item.status || "",
    applyUrl: item.smartApplyUrl || item.applyUrl || "",
    notes: item.skipReason || item.note || "",
  };
}

export function rowsToCsv(rows) {
  const headers = [
    "timestamp",
    "jobId",
    "jobTitle",
    "company",
    "platform",
    "matchScore",
    "channel",
    "contact",
    "status",
    "applyUrl",
    "notes",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}
