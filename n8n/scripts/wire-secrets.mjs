import fs from "node:fs";

const p = "d:/jobportal project/n8n/workflows/job-outreach-auto-apply.json";
const wf = JSON.parse(fs.readFileSync(p, "utf8"));
const profile = wf.nodes.find((n) => n.name === "Load Candidate Profile");
const a = profile.parameters.assignments.assignments;

function ensure(id, name, value, type) {
  const existing = a.find((x) => x.name === name);
  if (existing) {
    existing.value = value;
    existing.type = type;
    return;
  }
  a.push({ id, name, value, type });
}

ensure("a20", "secrets.apifyToken", "={{ $env.APIFY_TOKEN || '' }}", "string");
ensure(
  "a21",
  "secrets.serpApiKey",
  "={{ $env.SERPAPI_API_KEY || '' }}",
  "string"
);
ensure(
  "a22",
  "secrets.linkedinActorId",
  "={{ $env.APIFY_LINKEDIN_ACTOR_ID || 'curious_coder/linkedin-jobs-scraper' }}",
  "string"
);
ensure(
  "a23",
  "secrets.indeedActorId",
  "={{ $env.APIFY_INDEED_ACTOR_ID || 'misceres/indeed-scraper' }}",
  "string"
);

for (const n of wf.nodes) {
  if (n.name === "Apify LinkedIn Scraper") {
    n.parameters.url =
      "={{ 'https://api.apify.com/v2/acts/' + String($json.secrets.linkedinActorId || $env.APIFY_LINKEDIN_ACTOR_ID || 'curious_coder/linkedin-jobs-scraper').replace('/', '~') + '/run-sync-get-dataset-items?token=' + ($json.secrets.apifyToken || $env.APIFY_TOKEN) }}";
  }
  if (n.name === "Apify Indeed Scraper") {
    n.parameters.url =
      "={{ 'https://api.apify.com/v2/acts/' + String($json.secrets.indeedActorId || $env.APIFY_INDEED_ACTOR_ID || 'misceres/indeed-scraper').replace('/', '~') + '/run-sync-get-dataset-items?token=' + ($json.secrets.apifyToken || $env.APIFY_TOKEN) }}";
  }
  if (n.name === "SerpApi Google Jobs") {
    const apiParam = n.parameters.queryParameters.parameters.find(
      (p) => p.name === "api_key"
    );
    if (apiParam) {
      apiParam.value = "={{ $json.secrets.serpApiKey || $env.SERPAPI_API_KEY }}";
    }
  }
  if (n.name === "Merge Job Sources") n.typeVersion = 3;
}

fs.writeFileSync(p, JSON.stringify(wf, null, 2) + "\n");
fs.writeFileSync(
  "d:/jobportal project/n8n/workflows/_import-temp.json",
  JSON.stringify([wf])
);
console.log("ok secrets + merge v3");
