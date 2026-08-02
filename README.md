# ApplyAI — AI Job Agent (Enterprise)

Production-oriented web platform for AI-assisted job discovery, matching, cover letters, compliant Smart Apply, and application tracking.

> Existing Expo app remains in [`applyai/`](./applyai/). This monorepo track is the enterprise web + Express API.

## Quick start (demo mode)

### Prerequisites

- Node.js 20+
- npm 9+

### 1. Backend

```bash
cd backend
cp .env.example .env   # already seeded with DEMO_MODE=true
npm install
npm run dev
```

API: http://localhost:4000  
Swagger: http://localhost:4000/api/docs  
Health: http://localhost:4000/api/v1/health  

Demo auth header: `Authorization: Bearer demo-user-sagar`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173  

Click **Continue as Candidate** to enter the dashboard.

## What's working now

| Area | Status |
|------|--------|
| Auth (demo Bearer token) | ✅ |
| Profile get/update | ✅ |
| Job search + today's jobs (sample / JSearch) | ✅ |
| Match scoring + breakdown | ✅ |
| Save jobs | ✅ |
| Smart Apply (confirm → open official URL → track) | ✅ |
| Application status updates | ✅ |
| Cover letter generation (OpenAI or demo draft) | ✅ |
| Dark mode + responsive shell | ✅ |
| Swagger + rate limiting + validation | ✅ |

## Documentation

- [Project index](./docs/PROJECT_INDEX.md)
- [Phase 1 planning](./docs/phase-01-planning/README.md)
- [Setup / credentials](./docs/SETUP_REQUIREMENTS.md)
- [Decisions](./docs/DECISIONS.md)
- [Folder structure](./docs/phase-04-structure/FOLDER_STRUCTURE.md)

## Next modules

1. Firestore repositories + Firebase Auth (replace demo token)  
2. Resume upload + AI parse  
3. n8n workflows  
4. Full prompt pack  
5. Admin dashboard + analytics charts  
6. CI/CD + production hardening  

## Compliance

Smart Apply never auto-submits on LinkedIn/Indeed/Naukri. It opens the official posting after explicit user confirmation and records the application locally.
