# ApplyAI — n8n Automation (Phase 8)

Accurate job discovery + compliant outreach for LinkedIn / Indeed / Google Jobs.

**Job sources (n8n workflow):** Apify LinkedIn Scraper + Apify Indeed Scraper + SerpApi Google Jobs → Normalize → **POST ApplyAI `/api/v1/jobs/ingest`** → Match → outreach.

**Local runner (`npm run outreach`):** still uses RapidAPI JSearch until updated separately.

**API bridge (local):** After Normalize, the workflow pushes jobs into the ApplyAI backend catalog. Set in `n8n/.env`:

```env
APPLYAI_API_BASE=http://localhost:4000/api/v1
INGEST_API_KEY=applyai-local-ingest
```

Backend needs the same `INGEST_API_KEY`, plus `PREFER_LIVE_CATALOG=true` and Apify/SerpApi keys for `POST /api/v1/jobs/refresh`.

```powershell
# Backend live refresh (no n8n)
cd backend; npm run jobs:refresh

# Sync workflow JSON into running n8n, then activate + webhook
cd ..\n8n
node ./scripts/sync-workflow-api.mjs
node ./scripts/run-via-webhook.mjs
```

Then open http://localhost:5173/jobs — filter chips include LinkedIn / Indeed / Google Jobs.

**Important:** Having LinkedIn on a phone does **not** give us LinkedIn job data. Jobs come from **Apify / SerpApi** (workflow) or **JSearch** (local runner). If LinkedIn is installed, opening a `smartApplyUrl` can launch the LinkedIn app so the user can apply.
## What is implemented

| Capability | Status |
|------------|--------|
| Fetch jobs (LinkedIn + Indeed + Google Jobs via Apify/SerpApi) | Done (n8n workflow) |
| Fetch jobs (JSearch — local runner) | Done (`npm run outreach`) |
| Match against resume skills | Done |
| Extract email / phone from job text | Done |
| Rate-limited email (SendGrid) | Done (dry-run default) |
| Rate-limited SMS (Twilio) | Done (dry-run default) |
| Platform-only → Smart Apply URL (opens LinkedIn app if installed) | Done |
| Platform filter (`PLATFORM_FILTER`) | Done |
| CSV outreach log | Done (`data/outreach-log.csv`) |
| Importable n8n workflow | Done |
| Push normalized jobs → ApplyAI API ingest | Done (`POST /jobs/ingest`) |
| Backend refresh from Apify/SerpApi | Done (`npm run jobs:refresh`) |
| Local runner (no Docker) | Done |

## Automatic emails to HR (SendGrid)

When a job post contains an email (hr@, careers@, etc.), the runner **auto-sends** an application.

```env
OUTREACH_EMAIL_MODE=sendgrid
APPLY_ENRICH_DETAILS=true
SENDGRID_API_KEY=SG.your_full_key
SENDGRID_FROM_EMAIL=your-verified@email.com
CANDIDATE_EMAIL=your-login@email.com
OUTREACH_DRY_RUN=false
```

1. Verify sender: https://app.sendgrid.com/settings/sender_auth (Single Sender)
2. Use the **full** API key starting with `SG.`
3. Set `OUTREACH_DRY_RUN=false`
4. Run `npm run outreach`

Flow:
- Find jobs → match skills → extract HR email (also via job-details) → **auto SendGrid email**
- No email in post → Smart Apply link only (`npm run open:links`)

Daily cap: `DAILY_EMAIL_LIMIT` (default 10).

## Send email from YOUR login / device (manual)

SendGrid **cannot** pretend to be any Gmail/Outlook address unless that address is verified.
To send as the email you use to log in:

1. Set in `n8n\.env`:
   ```env
   CANDIDATE_EMAIL=your-login@gmail.com
   OUTREACH_EMAIL_MODE=device
   OUTREACH_DRY_RUN=false
   ```
2. Run `npm run outreach`
3. When a job has a public email, your **default mail app** opens (Outlook / Gmail / Apple Mail) with To/Subject/Body filled
4. You press **Send** — the email goes from **your account on that device**

Optional server mode (SendGrid):
```env
OUTREACH_EMAIL_MODE=sendgrid
SENDGRID_FROM_EMAIL=verified-sender@yourdomain.com
```
`Reply-To` is still your `CANDIDATE_EMAIL` (login email).

## Open LinkedIn / Smart Apply links from CSV

After `npm run outreach`, open job pages in your browser:

```powershell
cd "d:\jobportal project\n8n"
npm run open:links              # first 5 LinkedIn Smart Apply links
npm run open:links -- --limit 3 # only 3
npm run open:links -- --list    # print URLs only
npm run open:links -- --all     # all platforms
```

Or open the file manually: `n8n\data\outreach-log.csv` → column `applyUrl`.

## Live email / SMS (SendGrid + Twilio)

### 1. SendGrid (email)

1. Create account: https://signup.sendgrid.com/
2. Settings → API Keys → Create API Key (Full Access or Mail Send)
3. Verify a sender identity (Single Sender or Domain)
4. In `n8n\.env`:

```env
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-sender@yourdomain.com
OUTREACH_DRY_RUN=false
```

### 2. Twilio (SMS)

1. Create account: https://www.twilio.com/try-twilio
2. Copy Account SID + Auth Token
3. Get a Twilio phone number
4. In `n8n\.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
OUTREACH_DRY_RUN=false
```

### 3. Run live (only sends when job text has email/phone)

```powershell
npm run outreach
```

Check `data\outreach-log.csv` — status becomes `sent` when a message actually went out.

**Safety:** keep daily limits low (`DAILY_EMAIL_LIMIT=5`). Most LinkedIn jobs have no public email, so they stay Smart Apply only.

## Sync candidate from resume

Put your real resume (PDF or TXT) and auto-fill `CANDIDATE_*`:

```powershell
cd "d:\jobportal project\n8n"
npm install
npm run sync:resume -- "D:\path\to\your-resume.pdf"
```

Or drop the file in `config\resumes\` and run:

```powershell
npm run sync:resume
```

This writes:
- `config/candidate.json` (used by outreach runner)
- updates `CANDIDATE_*` + `JSEARCH_QUERY` in `.env`

Optional: set `OPENAI_API_KEY` in `.env` for higher-quality AI parsing (same approach as ApplyAI). Without it, heuristic extraction still fills name/email/phone/skills/title.

Then:

```powershell
npm run outreach
```

## Quick start (Windows — Docker not required)

```powershell
cd "d:\jobportal project\n8n"
npm run setup
```

Edit `n8n\.env`:

1. Set `APIFY_TOKEN` + `SERPAPI_API_KEY` (required for n8n workflow)
2. Set your `CANDIDATE_*` fields
3. Keep `OUTREACH_DRY_RUN=true` until results look correct
4. Optional for local runner only: `RAPIDAPI_KEY`

```powershell
npm run validate
npm run outreach
```

That fetches jobs, matches skills, extracts contacts, and writes `data\outreach-log.csv` without sending anything.

### Optional: n8n UI

```powershell
npm run start:n8n
```

Open http://localhost:5678 → **Import from File** → `workflows\job-outreach-auto-apply.json` → run **Manual Test**.

### Optional: Docker (if installed later)

```powershell
cd "d:\jobportal project\docker"
docker compose -f docker-compose.n8n.yml up -d
```

## Env reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `APIFY_TOKEN` | Yes (n8n workflow) | Apify LinkedIn + Indeed scrapers |
| `SERPAPI_API_KEY` | Yes (n8n workflow) | Google Jobs via SerpApi |
| `JOB_SEARCH_QUERY` / `JOB_SEARCH_LOCATION` | No | Default search for Apify/SerpApi |
| `RAPIDAPI_KEY` | Yes (local runner) | JSearch job fetch |
| `CANDIDATE_*` | Yes | Matching + message content |
| `JSEARCH_COUNTRY` | No | Country code (`in`, `us`, …) for search-v2 |
| `OUTREACH_DRY_RUN` | No | `true` = log only (default) |
| `SENDGRID_*` | For live email | Send application emails |
| `TWILIO_*` | For live SMS | Send application texts |

## Flow

```text
Trigger
   ↓
Load Candidate Profile
   ├─ Apify LinkedIn Scraper ─┐
   ├─ Apify Indeed Scraper   ─┼─ Merge → Normalize Jobs → Match skills
   └─ SerpApi Google Jobs    ─┘              ↓
                                    email / sms / smart-apply
                                              ↓
                                    outreach log
```

## LinkedIn on device — accurate expectation

| Action | Works? |
|--------|--------|
| Read jobs because LinkedIn app is installed | No |
| Fetch LinkedIn-listed jobs via JSearch | Yes |
| Open job URL so LinkedIn app handles apply | Yes |
| Auto-click Easy Apply inside LinkedIn | No (ToS / not supported) |

Set LinkedIn-only discovery:

```env
PLATFORM_FILTER=linkedin
```

## Go live checklist

1. `npm run outreach` dry-run looks good
2. Add SendGrid and/or Twilio keys
3. Set `OUTREACH_DRY_RUN=false`
4. Re-run once and confirm `status=sent` in CSV
5. Import/activate n8n schedule for daily runs

## Files

```text
n8n/
  .env.example
  README.md
  package.json
  lib/outreach.mjs                 # shared accurate logic
  scripts/setup.ps1
  scripts/start.ps1
  scripts/validate-config.mjs
  scripts/job-outreach-runner.mjs  # local runner
  workflows/job-outreach-auto-apply.json
  config/candidate.example.json
  data/outreach-log.csv            # created after first run
```
