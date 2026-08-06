/**
 * Local E2E: refresh jobs from Apify/SerpApi into API catalog, then print /jobs/today summary.
 * Usage: node --env-file=.env ../backend is wrong — run from backend via npm run jobs:refresh
 */
const API = process.env.API_BASE || 'http://localhost:4000/api/v1';
const TOKEN = process.env.DEMO_TOKEN || 'demo-user-sagar';

async function main() {
  console.log('1) POST /jobs/refresh (SerpApi + Apify Indeed)…');
  const refreshRes = await fetch(`${API}/jobs/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const refreshJson = await refreshRes.json();
  if (!refreshRes.ok) {
    console.error('refresh failed', refreshRes.status, refreshJson);
    process.exit(1);
  }
  console.log('sources:', refreshJson.data?.sources);
  console.log('catalog:', refreshJson.data?.catalog);
  console.log('scraped jobs:', refreshJson.data?.jobs?.length ?? 0);

  console.log('\n2) GET /jobs/today…');
  const todayRes = await fetch(`${API}/jobs/today`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const todayJson = await todayRes.json();
  if (!todayRes.ok) {
    console.error('today failed', todayRes.status, todayJson);
    process.exit(1);
  }
  const jobs = todayJson.data || [];
  const bySource = {};
  for (const j of jobs) {
    bySource[j.source] = (bySource[j.source] || 0) + 1;
  }
  console.log('today count:', jobs.length);
  console.log('by source:', bySource);
  console.log('sample:', jobs.slice(0, 3).map((j) => ({ title: j.title, company: j.company, source: j.source })));

  console.log('\n3) POST /jobs/ingest smoke (n8n-shaped payload)…');
  const ingestRes = await fetch(`${API}/jobs/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Ingest-Key': process.env.INGEST_API_KEY || 'applyai-local-ingest',
    },
    body: JSON.stringify({
      source: 'n8n-self-test',
      jobs: [
        {
          jobId: 'n8n-test-1',
          sourcePlatform: 'LinkedIn',
          title: 'n8n Pipeline Test Engineer',
          company: 'ApplyAI Test Co',
          location: 'Remote',
          isRemote: true,
          description: 'Synthetic job from ingest self-test.',
          applyUrl: 'https://www.linkedin.com/jobs/view/test',
          postedAt: new Date().toISOString(),
        },
      ],
    }),
  });
  const ingestJson = await ingestRes.json();
  console.log('ingest:', ingestRes.status, ingestJson.data);

  console.log('\nOK — open http://localhost:5173/jobs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
