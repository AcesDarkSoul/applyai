# Setup Requirements & Credentials Checklist

**Purpose:** Inventory of every service, tool, and credential required before feature implementation.  
**Status:** Draft (Phase 1)  
**Last updated:** 2026-08-02

---

## 1. Master credentials table

| Service | Required | Purpose | How to Obtain |
|---------|----------|---------|---------------|
| OpenAI API Key | Yes | AI generation (resume, matching, letters, emails) | [OpenAI Platform](https://platform.openai.com/) → API keys |
| Firebase Project ID | Yes | Project identity, Auth, Firestore, Storage | [Firebase Console](https://console.firebase.google.com/) |
| Firebase Web API Key | Yes | Client authentication / Firebase SDK | Firebase Console → Project settings |
| Firebase Service Account | Yes | Backend Admin SDK access | Firebase Console → Project settings → Service accounts |
| Node.js (LTS) | Yes | Backend / tooling runtime | [nodejs.org](https://nodejs.org/) |
| Git | Yes | Version control | [git-scm.com](https://git-scm.com/) |
| Docker + Docker Compose | Yes (for target deploy) | Containerized deploy of API / n8n | [docker.com](https://www.docker.com/) |
| RapidAPI JSearch Key | Recommended | Job discovery aggregation | [RapidAPI JSearch](https://rapidapi.com/) |
| Gmail OAuth Credentials | Optional | User/system email sending via Gmail | Google Cloud Console → OAuth client |
| Google Sheets Credentials | Optional | Application / analytics tracking sheets | Google Cloud Console → Service account or OAuth |
| Google Drive Credentials | Optional | Resume / document storage sync | Google Cloud Console |
| Google Calendar API | Optional | Interview scheduling | Google Cloud Console |
| Telegram Bot Token | Optional | Push-style notifications | Telegram [@BotFather](https://t.me/BotFather) |
| Slack App Token | Optional | Team notifications | [api.slack.com](https://api.slack.com/) |
| SendGrid API Key | Optional (alt. to Gmail) | Transactional email | [SendGrid](https://sendgrid.com/) |
| n8n instance | Optional in MVP* | Workflow automation | Self-host or n8n Cloud |
| Domain + TLS cert | Production | HTTPS for web/API | Registrar + Let's Encrypt / cloud LB |

\*n8n is required by the master architecture target; timing depends on clarification #10 in `PROJECT_INDEX.md`.

---

## 2. Integration details

### 2.1 OpenAI

| Field | Detail |
|-------|--------|
| What | LLM API for text generation and structured extraction |
| Why | Resume analysis, tailoring, cover letters, matching rationale, outreach copy |
| Required | Yes |
| Env vars | `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g. `gpt-4o-mini`) |
| Security | Server-side only; never expose in frontend; budget alerts; rate limits |

**Obtain**

1. Create/login at platform.openai.com  
2. Add billing / set usage limits  
3. Create a restricted API key  
4. Store in secret manager / `.env` (never commit)

**Config example**

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2048
```

---

### 2.2 Firebase (Auth, Firestore, Storage)

| Field | Detail |
|-------|--------|
| What | Auth, NoSQL database, file storage, optional Cloud Functions |
| Why | Identity, persistence, resume files, security rules |
| Required | Yes |
| Env vars (client) | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` |
| Env vars (server) | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or path to JSON) |

**Obtain**

1. Create Firebase project  
2. Enable Authentication (Email/Password; Google optional)  
3. Create Firestore database  
4. Enable Storage  
5. Register web app → copy config  
6. Generate service account JSON for backend  

**Security**

- Restrict API keys by HTTP referrer / app ID where possible  
- Never commit service account JSON  
- Enforce Firestore/Storage security rules before production  

---

### 2.3 Job search provider (JSearch / RapidAPI)

| Field | Detail |
|-------|--------|
| What | Aggregated job listings API |
| Why | Job discovery without scraping ToS-restricted sites |
| Required | Recommended for real jobs (sample/mock data for local demo) |
| Env vars | `RAPIDAPI_KEY`, `RAPIDAPI_JSEARCH_HOST` |

**Security:** Call only from backend; cache results; respect provider rate limits.

---

### 2.4 Gmail OAuth (optional)

| Field | Detail |
|-------|--------|
| What | OAuth 2.0 client for sending mail as user or system mailbox |
| Why | Recruiter outreach / notifications via Gmail |
| Required | Optional |
| Env vars | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, encrypted refresh tokens per user |

**Obtain**

1. Google Cloud Console → create project  
2. Enable Gmail API  
3. Configure OAuth consent screen  
4. Create OAuth client (Web)  
5. Store tokens encrypted at rest  

**Security:** Least privilege scopes (`gmail.send` only if possible); user consent; audit sends.

---

### 2.5 Google Sheets / Drive (optional)

| Field | Detail |
|-------|--------|
| What | Sheets for tracking exports; Drive for document sync |
| Why | Ops reporting, optional resume archive |
| Required | Optional |
| Env vars | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, sheet/folder IDs |

---

### 2.6 Telegram Bot (optional)

| Field | Detail |
|-------|--------|
| What | Bot token for chat notifications |
| Why | Instant alerts for new matches / interviews |
| Required | Optional |
| Env vars | `TELEGRAM_BOT_TOKEN`, user-linked `TELEGRAM_CHAT_ID` |

**Obtain:** Message BotFather → `/newbot` → store token server-side.

---

### 2.7 Docker / Node / Git

| Tool | Why | Required |
|------|-----|----------|
| Node.js LTS | Run API, scripts, local tooling | Yes |
| Git | Source control, CI | Yes |
| Docker Compose | Reproducible API + n8n + reverse proxy | Yes for target production topology |

---

## 3. Local development baseline

```bash
# Verify toolchain
node -v    # >= 20 LTS recommended
npm -v
git --version
docker --version
docker compose version
```

Copy env templates (to be generated in implementation phases):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

## 4. Security recommendations (all credentials)

1. Use a secrets manager in production (GCP Secret Manager, GitHub Actions secrets, Doppler, etc.).  
2. Rotate keys on a schedule and after any exposure.  
3. Separate **dev / staging / prod** projects and keys.  
4. Never commit `.env`, service accounts, or private keys.  
5. Apply least privilege on every OAuth scope and IAM role.  
6. Enable billing alerts for OpenAI, Firebase, and RapidAPI.  
7. Log credential failures without logging secret values.

---

## 5. Pre-implementation gate

Before Phase 5+ coding begins, confirm:

| Check | Owner | Done |
|-------|-------|------|
| Firebase project created | DevOps | [ ] |
| OpenAI key with spend cap | AI Eng | [ ] |
| Job API key (or mock mode accepted) | Backend | [ ] |
| `.gitignore` excludes secrets | All | [ ] |
| `SETUP_REQUIREMENTS.md` reviewed | Tech Lead | [ ] |

---

## 6. Related documents

- Phase 1 planning: `docs/phase-01-planning/`  
- Project checklist: `docs/PROJECT_INDEX.md`  
- Existing app setup notes: `applyai/docs/SETUP.md`
