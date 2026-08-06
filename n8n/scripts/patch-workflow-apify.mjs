/**
 * One-shot patcher: replace JSearch with Apify LinkedIn + Indeed + SerpApi Google Jobs.
 * Run: node scripts/patch-workflow-apify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowPath = path.join(root, "workflows", "job-outreach-auto-apply.json");
const normalizePath = path.join(root, "lib", "normalizeJobs.n8n.js");

const wf = JSON.parse(fs.readFileSync(workflowPath, "utf8"));
const normalizeCode = fs.readFileSync(normalizePath, "utf8");

wf.meta = {
  ...wf.meta,
  description:
    "Fetches LinkedIn/Indeed/Google Jobs via Apify + SerpApi, normalizes schema, matches resume skills, then rate-limited email/SMS. Dry-run safe by default.",
};

const sticky = wf.nodes.find((n) => n.name === "Setup Notes");
if (sticky) {
  sticky.parameters.content = `## ApplyAI Job Outreach (Apify + SerpApi)

1. Fill \`n8n/.env\`: APIFY_TOKEN + SERPAPI_API_KEY + candidate
2. Keep **OUTREACH_DRY_RUN=true** until logs look right
3. Import this workflow → run **Manual Test**
4. Flow: scrape 3 sources → Normalize → Match → outreach
5. Filter via PLATFORM_FILTER=linkedin,indeed,googlejobs

Docs: \`n8n/README.md\``;
}

const profile = wf.nodes.find((n) => n.name === "Load Candidate Profile");
if (profile) {
  const assignments = profile.parameters.assignments.assignments;
  const byName = Object.fromEntries(assignments.map((a) => [a.name, a]));

  byName["search.query"].value =
    "={{ ($json.body && $json.body.query) || $env.JOB_SEARCH_QUERY || $env.JSEARCH_QUERY || 'Full Stack Developer' }}";

  if (!byName["search.location"]) {
    assignments.push({
      id: "a15",
      name: "search.location",
      value:
        "={{ ($json.body && $json.body.location) || $env.JOB_SEARCH_LOCATION || 'India' }}",
      type: "string",
    });
  } else {
    byName["search.location"].value =
      "={{ ($json.body && $json.body.location) || $env.JOB_SEARCH_LOCATION || 'India' }}";
  }

  if (!byName["search.limit"]) {
    assignments.push({
      id: "a16",
      name: "search.limit",
      value: "={{ Number($env.JOB_SEARCH_LIMIT || 25) }}",
      type: "number",
    });
  }

  byName["flags.platforms"].value =
    "={{ ($env.PLATFORM_FILTER || 'linkedin,indeed,googlejobs').split(',').map(s => s.trim().toLowerCase()).filter(Boolean) }}";
}

// Remove JSearch node
wf.nodes = wf.nodes.filter((n) => n.name !== "Fetch Jobs (JSearch)");

const matchCode = `const profile = $('Load Candidate Profile').first().json;
const skills = (profile.candidate.skills || []).map((s) => String(s).toLowerCase());
const minScore = Number(profile.limits.minMatchScore || 50);
const dryRun = Boolean(profile.flags.dryRun);
const allowed = new Set((profile.flags.platforms || []).map((p) => String(p).toLowerCase()));

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\\+|00)?[0-9][0-9\\s().-]{7,}[0-9]/g;
const BLOCKED_EMAIL = /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\\.com)/i;

function platformKey(sourcePlatform) {
  const map = { LinkedIn: 'linkedin', Indeed: 'indeed', GoogleJobs: 'googlejobs' };
  if (map[sourcePlatform]) return map[sourcePlatform];
  return String(sourcePlatform || 'other').toLowerCase().replace(/\\s+/g, '');
}

function scoreJob(job) {
  const blob = \`\${job.title || ''} \${job.description || ''} \${job.company || ''}\`.toLowerCase();
  if (!skills.length) return 50;
  const hits = skills.filter((s) => blob.includes(s));
  const base = Math.round((hits.length / skills.length) * 100);
  const remoteBoost = job.isRemote ? 5 : 0;
  return Math.min(100, base + remoteBoost);
}

function extractContacts(text = '') {
  const emails = [...new Set((String(text).match(EMAIL_RE) || []).filter((e) => !BLOCKED_EMAIL.test(e)))];
  const phones = [...new Set((String(text).match(PHONE_RE) || []).map((p) => p.replace(/\\s+/g, ' ').trim()))];
  return { contactEmail: emails[0] || null, contactPhone: phones[0] || null };
}

const jobs = items.map((i) => i.json).filter((j) => j && j.title && j.company && !j.skipped);
const out = [];

for (const job of jobs) {
  const platform = platformKey(job.sourcePlatform);
  if (allowed.size && !allowed.has('all') && !allowed.has(platform)) continue;

  const matchScore = scoreJob(job);
  if (matchScore < minScore) continue;

  const description = job.description || '';
  const contacts = extractContacts(description);
  const applyUrl = job.applyUrl || '';

  let channel = 'platform_only';
  if (contacts.contactEmail) channel = 'email';
  else if (contacts.contactPhone) channel = 'sms';

  out.push({
    json: {
      jobId: job.jobId,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      isRemote: !!job.isRemote,
      applyUrl,
      smartApplyUrl: applyUrl,
      linkedInAppUrl: platform === 'linkedin' ? applyUrl : null,
      platform,
      sourcePlatform: job.sourcePlatform,
      matchScore,
      channel,
      contactEmail: contacts.contactEmail,
      contactPhone: contacts.contactPhone,
      postedAt: job.postedAt || null,
      dryRun,
      candidate: profile.candidate,
      limits: profile.limits,
      descriptionSnippet: String(description).slice(0, 400),
    },
  });
}

if (!out.length) {
  return [{ json: { skipped: true, reason: 'No jobs matched skills / platform / min score', searched: jobs.length, minScore, dryRun } }];
}

return out;`;

const newNodes = [
  {
    id: "http-li-001",
    name: "Apify LinkedIn Scraper",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [520, 240],
    continueOnFail: true,
    parameters: {
      method: "POST",
      url: "={{ 'https://api.apify.com/v2/acts/' + String($env.APIFY_LINKEDIN_ACTOR_ID || 'curious_coder/linkedin-jobs-scraper').replace('/', '~') + '/run-sync-get-dataset-items?token=' + $env.APIFY_TOKEN }}",
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        '={{ JSON.stringify({ urls: ["https://www.linkedin.com/jobs/search/?keywords=" + encodeURIComponent($json.search.query) + "&location=" + encodeURIComponent($json.search.location) + "&f_TPR=r604800"], count: Number($json.search.limit || 25), scrapeCompany: false }) }}',
      options: {
        timeout: 300000,
        response: {
          response: {
            neverError: true,
          },
        },
      },
    },
  },
  {
    id: "http-in-001",
    name: "Apify Indeed Scraper",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [520, 400],
    continueOnFail: true,
    parameters: {
      method: "POST",
      url: "={{ 'https://api.apify.com/v2/acts/' + String($env.APIFY_INDEED_ACTOR_ID || 'misceres/indeed-scraper').replace('/', '~') + '/run-sync-get-dataset-items?token=' + $env.APIFY_TOKEN }}",
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        '={{ JSON.stringify({ position: $json.search.query, location: $json.search.location, country: ($env.JSEARCH_COUNTRY || "in").toUpperCase() === "IN" ? "IN" : ($env.JSEARCH_COUNTRY || "US").toUpperCase(), maxItemsPerSearch: Number($json.search.limit || 25), saveOnlyUniqueItems: true }) }}',
      options: {
        timeout: 300000,
        response: {
          response: {
            neverError: true,
          },
        },
      },
    },
  },
  {
    id: "http-gg-001",
    name: "SerpApi Google Jobs",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [520, 560],
    continueOnFail: true,
    parameters: {
      method: "GET",
      url: "https://serpapi.com/search.json",
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: "engine", value: "google_jobs" },
          { name: "q", value: "={{ $json.search.query }}" },
          { name: "location", value: "={{ $json.search.location }}" },
          { name: "api_key", value: "={{ $env.SERPAPI_API_KEY }}" },
          { name: "hl", value: "en" },
        ],
      },
      options: {
        timeout: 60000,
        response: {
          response: {
            neverError: true,
          },
        },
      },
    },
  },
  {
    id: "merge-001",
    name: "Merge Job Sources",
    type: "n8n-nodes-base.merge",
      typeVersion: 3,
    position: [760, 400],
    parameters: {
      mode: "append",
      numberInputs: 3,
    },
  },
  {
    id: "code-norm-001",
    name: "Normalize Jobs",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [980, 400],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: normalizeCode,
    },
  },
];

// Insert new nodes before Match
const matchIdx = wf.nodes.findIndex((n) => n.name === "Match + Extract Contacts");
const matchNode = wf.nodes[matchIdx];
matchNode.position = [1200, 400];
matchNode.parameters.jsCode = matchCode;

wf.nodes.splice(matchIdx, 0, ...newNodes);

// Shift later nodes a bit right if needed — Has Matched Jobs
const hasMatched = wf.nodes.find((n) => n.name === "Has Matched Jobs?");
if (hasMatched) hasMatched.position = [1440, 400];

// Connections
delete wf.connections["Fetch Jobs (JSearch)"];

wf.connections["Load Candidate Profile"] = {
  main: [
    [
      { node: "Apify LinkedIn Scraper", type: "main", index: 0 },
      { node: "Apify Indeed Scraper", type: "main", index: 0 },
      { node: "SerpApi Google Jobs", type: "main", index: 0 },
    ],
  ],
};

wf.connections["Apify LinkedIn Scraper"] = {
  main: [[{ node: "Merge Job Sources", type: "main", index: 0 }]],
};
wf.connections["Apify Indeed Scraper"] = {
  main: [[{ node: "Merge Job Sources", type: "main", index: 1 }]],
};
wf.connections["SerpApi Google Jobs"] = {
  main: [[{ node: "Merge Job Sources", type: "main", index: 2 }]],
};
wf.connections["Merge Job Sources"] = {
  main: [[{ node: "Normalize Jobs", type: "main", index: 0 }]],
};
wf.connections["Normalize Jobs"] = {
  main: [[{ node: "Match + Extract Contacts", type: "main", index: 0 }]],
};

fs.writeFileSync(workflowPath, JSON.stringify(wf, null, 2) + "\n");
console.log("Patched", workflowPath);
console.log("Nodes:", wf.nodes.map((n) => n.name).join(" | "));
