# Folder Structure

```
jobportal project/
├── applyai/                 # Existing Expo reference app (unchanged)
├── frontend/                # React + TypeScript + MUI + Tailwind (enterprise web)
├── backend/                 # Node.js Express TypeScript API
├── n8n/workflows/           # Automation workflow exports (next module)
├── docs/                    # Planning + architecture docs
├── docker/                  # Dockerfiles + Compose
├── scripts/                 # Ops scripts
├── firebase/                # Rules/indexes (Phase 7)
├── prompts/                 # Versioned AI prompts (Phase 9)
├── assets/                  # Static brand assets
├── database/seed/           # Seed data
├── tests/                   # Cross-cutting test plans/suites
└── .github/workflows/       # CI/CD (Phase 14)
```

## frontend/

Feature-based clean architecture:

- `src/app` — routing, providers, guards  
- `src/features/*` — auth, dashboard, jobs, applications, profile  
- `src/shared/api` — Axios client + repository pattern  
- `src/shared/components` — layout shells  
- `src/shared/theme` — MUI theme  

## backend/

Layered API:

- `controllers` → HTTP adapters  
- `services` → business logic  
- `repositories` → persistence (memory now; Firestore next)  
- `middleware` → auth, errors, request ids  
- `domain` → types  
