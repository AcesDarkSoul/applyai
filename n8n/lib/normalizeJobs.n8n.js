/**
 * n8n Code node — Standardize + dedupe jobs from:
 *   - Apify LinkedIn Jobs Scraper
 *   - Apify Indeed Scraper
 *   - SerpApi Google Jobs
 *
 * Paste this entire file into an n8n "Code" node (Run Once for All Items).
 *
 * Upstream: Merge (or multiple inputs) from the three scrape nodes.
 * Downstream: one item per unique job matching the schema below.
 *
 * Schema:
 *   jobId, sourcePlatform, title, company, location,
 *   isRemote, description, applyUrl, postedAt
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function asString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = asString(v);
    if (s) return s;
  }
  return "";
}

function normalizeKey(title, company) {
  return `${title}|${company}`
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectRemote(job, location, description) {
  if (typeof job.isRemote === "boolean") return job.isRemote;
  if (typeof job.remote === "boolean") return job.remote;
  if (typeof job.is_remote === "boolean") return job.is_remote;

  const workplace = firstNonEmpty(
    job.workplaceType,
    job.workplace,
    job.workType,
    job.job_type,
    job.schedule_type,
    job.detected_extensions?.schedule_type,
    job.detected_extensions?.work_from_home
  ).toLowerCase();

  const hay = `${workplace} ${location} ${description}`.toLowerCase();
  if (/\b(remote|work from home|wfh|fully remote|100%\s*remote)\b/i.test(hay)) {
    return true;
  }
  if (/\b(on[- ]?site|in[- ]?office|hybrid)\b/i.test(workplace) && !/\bremote\b/i.test(workplace)) {
    return false;
  }
  return false;
}

function toIsoDate(value) {
  if (value == null || value === "") return null;

  // Unix seconds / millis
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Relative phrases from scrapers: "2 days ago", "Just posted"
  const relative = raw.match(
    /^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/i
  );
  if (relative) {
    const n = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    const d = new Date();
    const map = {
      minute: "Minutes",
      hour: "Hours",
      day: "Date",
      week: "Date",
      month: "Month",
      year: "FullYear",
    };
    if (unit === "week") d.setDate(d.getDate() - n * 7);
    else if (unit === "day") d.setDate(d.getDate() - n);
    else if (unit === "minute") d.setMinutes(d.getMinutes() - n);
    else if (unit === "hour") d.setHours(d.getHours() - n);
    else if (unit === "month") d.setMonth(d.getMonth() - n);
    else if (unit === "year") d.setFullYear(d.getFullYear() - n);
    return d.toISOString();
  }
  if (/^just\s+(posted|now)$/i.test(raw) || /^today$/i.test(raw)) {
    return new Date().toISOString();
  }
  if (/^yesterday$/i.test(raw)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return null;
}

function stableHash(input) {
  // Simple non-crypto hash for synthetic jobIds when source has none
  let h = 2166136261;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function pickApplyUrl(job) {
  // SerpApi apply_options: [{ link, title }, ...]
  const applyOptions = Array.isArray(job.apply_options) ? job.apply_options : [];
  const applyOptionLink = applyOptions
    .map((o) => o?.link || o?.url)
    .find((u) => asString(u));

  const related = Array.isArray(job.related_links) ? job.related_links : [];
  const relatedApply = related
    .map((o) => o?.link || o?.url)
    .find((u) => /apply|linkedin|indeed|greenhouse|lever|workday/i.test(String(u || "")));

  return firstNonEmpty(
    job.applyUrl,
    job.apply_url,
    job.applicationUrl,
    job.externalApplyLink,
    job.jobUrl,
    job.job_url,
    job.url,
    job.link,
    job.share_link,
    applyOptionLink,
    relatedApply,
    job.job_google_link,
    job.google_link
  );
}

function detectSourcePlatform(job, nodeHint) {
  const hint = String(nodeHint || job.sourcePlatform || job.source || job.via || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  if (hint.includes("linkedin")) return "LinkedIn";
  if (hint.includes("indeed")) return "Indeed";
  if (hint.includes("google")) return "GoogleJobs";

  const hay = [
    job.jobUrl,
    job.url,
    job.link,
    job.applyUrl,
    job.job_url,
    job.share_link,
    job.publisher,
    job.job_publisher,
    job.via,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (hay.includes("linkedin")) return "LinkedIn";
  if (hay.includes("indeed")) return "Indeed";
  if (hay.includes("google") || job.job_id || job.detected_extensions) return "GoogleJobs";

  // Apify LinkedIn often has linkedinJobId / postedAt + companyName
  if (job.linkedinJobId || job.companyName && job.title && /urn:li:|linkedin/i.test(JSON.stringify(job).slice(0, 500))) {
    return "LinkedIn";
  }
  // Apify Indeed often has positionName
  if (job.positionName || job.positionId) return "Indeed";

  return "GoogleJobs";
}

function unwrapRawJobs(payload) {
  if (payload == null) return [];

  // Already a job object
  if (!Array.isArray(payload) && typeof payload === "object") {
    // Apify dataset item / SerpApi jobs_results wrapper
    if (Array.isArray(payload.jobs_results)) return payload.jobs_results;
    if (Array.isArray(payload.jobs)) return payload.jobs;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    // Single job record
    if (payload.title || payload.positionName || jobLike(payload)) return [payload];
    return [];
  }

  if (Array.isArray(payload)) {
    // Nested arrays from Merge node
    return payload.flatMap((entry) => unwrapRawJobs(entry));
  }

  return [];
}

function jobLike(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.title ||
      obj.positionName ||
      obj.job_title ||
      obj.company ||
      obj.company_name ||
      obj.companyName ||
      obj.description ||
      obj.job_description
  );
}

function normalizeJob(raw, nodeHint) {
  const title = firstNonEmpty(
    raw.title,
    raw.positionName,
    raw.job_title,
    raw.jobTitle,
    raw.name
  );
  const company = firstNonEmpty(
    raw.company,
    raw.companyName,
    raw.company_name,
    raw.employer_name,
    raw.employer
  );
  const location = firstNonEmpty(
    raw.location,
    raw.locationName,
    raw.job_location,
    raw.formattedLocation,
    raw.city,
    Array.isArray(raw.locations) ? raw.locations.join(", ") : ""
  );
  const description = stripHtml(
    firstNonEmpty(
      raw.description,
      raw.descriptionHtml,
      raw.descriptionHTML,
      raw.jobDescription,
      raw.job_description,
      raw.descriptionText,
      raw.snippet
    )
  );
  const applyUrl = pickApplyUrl(raw);
  const sourcePlatform = detectSourcePlatform(raw, nodeHint);
  const postedAt =
    toIsoDate(
      firstNonEmpty(
        raw.postedAt,
        raw.posted_at,
        raw.publishedAt,
        raw.datePublished,
        raw.postedDate,
        raw.posted_date,
        raw.detected_extensions?.posted_at,
        raw.postedTime,
        raw.relativeTime
      )
    ) || new Date().toISOString();

  const jobId = firstNonEmpty(
    raw.jobId,
    raw.job_id,
    raw.id,
    raw.linkedinJobId,
    raw.positionId,
    raw.key,
    `${sourcePlatform}-${stableHash(`${title}|${company}|${applyUrl}`)}`
  );

  if (!title || !company) return null;

  return {
    jobId,
    sourcePlatform,
    title,
    company,
    location: location || "Not specified",
    isRemote: detectRemote(raw, location, description),
    description,
    applyUrl,
    postedAt,
  };
}

// ---------------------------------------------------------------------------
// Collect from all incoming items (and optionally named upstream nodes)
// ---------------------------------------------------------------------------

const namedSources = [
  { name: "Apify LinkedIn Scraper", hint: "LinkedIn" },
  { name: "Apify Indeed Scraper", hint: "Indeed" },
  { name: "SerpApi Google Jobs", hint: "GoogleJobs" },
  { name: "LinkedIn Jobs", hint: "LinkedIn" },
  { name: "Indeed Jobs", hint: "Indeed" },
  { name: "Google Jobs", hint: "GoogleJobs" },
];

const collected = [];

// Prefer current Code-node input (Merge → Code). Only fall back to named
// upstream nodes when Merge produced nothing (so we never double-count).
for (const item of items) {
  const hint =
    item.json?.sourcePlatform ||
    item.json?.source ||
    item.json?._source ||
    "";
  const jobs = unwrapRawJobs(item.json);
  for (const job of jobs) {
    collected.push({ job, hint });
  }
  // If the item itself is a flat job (Apify dataset row)
  if (jobs.length === 0 && jobLike(item.json)) {
    collected.push({ job: item.json, hint });
  }
}

if (collected.length === 0) {
  for (const src of namedSources) {
    try {
      const nodeItems = $(src.name).all();
      for (const item of nodeItems) {
        const jobs = unwrapRawJobs(item.json);
        if (jobs.length) {
          for (const job of jobs) collected.push({ job, hint: src.hint });
        } else if (jobLike(item.json)) {
          collected.push({ job: item.json, hint: src.hint });
        }
      }
    } catch {
      // Node not in this execution path — ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Normalize + dedupe (title + company)
// ---------------------------------------------------------------------------

const seen = new Map();
const output = [];

for (const { job, hint } of collected) {
  const normalized = normalizeJob(job, hint);
  if (!normalized) continue;

  const key = normalizeKey(normalized.title, normalized.company);
  if (seen.has(key)) continue;
  seen.set(key, true);
  output.push({ json: normalized });
}

// Always return an array for n8n "Run Once for All Items"
return output;
