# Implementation Decisions (Approved defaults)

**Effective:** 2026-08-02  
**Trigger:** Stakeholder requested code/app implementation after Phase 1.

## Locked decisions

| Topic | Decision | Why |
|-------|----------|-----|
| Product direction | New enterprise web monorepo at repo root (`frontend/`, `backend/`, …) | Matches master prompt; `applyai/` kept as reference |
| Brand | **ApplyAI** (AI Job Agent) | Existing product name |
| Clients (this track) | Web (React) primary | Master prompt Phase 5 |
| Backend | Node.js + Express + TypeScript | Master prompt Phase 6 |
| Database / Auth | Firebase Auth + Firestore + Storage | Master prompt + existing project |
| Automation | n8n workflows in `n8n/` (optional until credentials ready) | Master prompt Phase 8 |
| Job provider | RapidAPI JSearch (mock fallback) | Existing ApplyAI baseline |
| Apply model | Assistive Smart Apply only | Compliance / Phase 1 scope |
| Roles | `user`, `admin` | Phase 1 RBAC |
| Multi-tenancy | Single-user accounts in v1 | Simplest secure v1 |
| License | MIT (see `LICENSE`) | Open default; change if needed |

## Relationship to `applyai/`

Expo app remains untouched as a mobile/reference baseline. New enterprise code does not delete or rewrite it in this pass.
