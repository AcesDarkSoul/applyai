/**
 * Insert Prepare API Ingest + POST ApplyAI Jobs Ingest after Normalize Jobs.
 * Keeps Match + Extract Contacts on the parallel branch from Normalize Jobs.
 */
import fs from 'node:fs';

const path = new URL('../workflows/job-outreach-auto-apply.json', import.meta.url);
const w = JSON.parse(fs.readFileSync(path, 'utf8'));

const prepareNode = {
  id: 'code-ingest-prep-001',
  name: 'Prepare API Ingest',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1200, 200],
  parameters: {
    mode: 'runOnceForAllItems',
    language: 'javaScript',
    jsCode: `const profile = $('Load Candidate Profile').first().json;
const jobs = items
  .map((i) => i.json)
  .filter((j) => j && j.title && j.company && !j.skipped)
  .map((j) => ({
    jobId: j.jobId,
    sourcePlatform: j.sourcePlatform,
    title: j.title,
    company: j.company,
    location: j.location,
    isRemote: !!j.isRemote,
    description: j.description || '',
    applyUrl: j.applyUrl || '',
    postedAt: j.postedAt || null,
  }));

const apiBase = String(
  profile.secrets?.applyAiApiBase ||
    $env.APPLYAI_API_BASE ||
    'http://localhost:4000/api/v1'
).replace(/\\/$/, '');
const ingestKey = String(
  profile.secrets?.ingestApiKey || $env.INGEST_API_KEY || 'applyai-local-ingest'
);

return [
  {
    json: {
      url: \`\${apiBase}/jobs/ingest\`,
      ingestKey,
      count: jobs.length,
      body: { source: 'n8n', jobs },
    },
  },
];`,
  },
};

const postNode = {
  id: 'http-ingest-001',
  name: 'POST ApplyAI Jobs Ingest',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [1440, 200],
  parameters: {
    method: 'POST',
    url: '={{ $json.url }}',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Ingest-Key', value: '={{ $json.ingestKey }}' },
      ],
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ $json.body }}',
    options: {
      timeout: 60000,
      response: { neverError: true },
    },
  },
};

// Remove old versions if re-running
w.nodes = w.nodes.filter(
  (n) => n.name !== 'Prepare API Ingest' && n.name !== 'POST ApplyAI Jobs Ingest',
);
w.nodes.push(prepareNode, postNode);

// Profile secrets for API base + ingest key
const profile = w.nodes.find((n) => n.name === 'Load Candidate Profile');
const assigns = profile.parameters.assignments.assignments;
for (const a of [
  {
    id: 'a24',
    name: 'secrets.applyAiApiBase',
    value: "={{ $env.APPLYAI_API_BASE || 'http://localhost:4000/api/v1' }}",
    type: 'string',
  },
  {
    id: 'a25',
    name: 'secrets.ingestApiKey',
    value: "={{ $env.INGEST_API_KEY || 'applyai-local-ingest' }}",
    type: 'string',
  },
]) {
  const i = assigns.findIndex((x) => x.name === a.name);
  if (i >= 0) assigns[i] = a;
  else assigns.push(a);
}

// Connections: Normalize → Prepare → POST, and keep Normalize → Match
w.connections['Normalize Jobs'] = {
  main: [
    [
      { node: 'Match + Extract Contacts', type: 'main', index: 0 },
      { node: 'Prepare API Ingest', type: 'main', index: 0 },
    ],
  ],
};
w.connections['Prepare API Ingest'] = {
  main: [[{ node: 'POST ApplyAI Jobs Ingest', type: 'main', index: 0 }]],
};

fs.writeFileSync(path, JSON.stringify(w, null, 2) + '\n');
console.log('Patched workflow: Normalize → Match + Prepare → POST ApplyAI Jobs Ingest');
console.log('nodes:', w.nodes.filter((n) => /Ingest|Normalize|Match \+/.test(n.name)).map((n) => n.name));
