# PROJECT_STATE.md — ApplyAI / AI Job Agent

**Last updated:** 2026-08-02  
**Current formal phase:** Phase 2 — Architecture (**complete — awaiting approval**)  
**Process mode:** Enterprise phased delivery (module-by-module, stop after each module)

---

## 1. Completed modules

| Module | Status | Location |
|--------|--------|----------|
| Phase 1 — Project Planning | Complete | `docs/phase-01-planning/` |
| SETUP_REQUIREMENTS | Complete | `docs/SETUP_REQUIREMENTS.md` |
| Early scaffold (provisional) | Partial | `frontend/`, `backend/`, `docker/` |
| Phase 2 — Architecture | Complete (awaiting approval) | `docs/phase-02-architecture/`, `docs/ARCHITECTURE.md` |

---

## 2. Pending modules (formal order)

1. Phase 3 — Technology Decisions (comparisons + ADRs)  
2. Phase 4 — Project Initialization (lint/format/CI/config hardening to production standards)  
3. Phase 5 — Frontend (production features per stack: Redux Toolkit, React Query, RHF, Zod)  
4. Phase 6 — Backend (Firebase Auth/JWT production path, DTOs, DI, Multer, compression)  
5. Phase 7 — Database (Firestore collections)  
6. Phase 8 — n8n Automation  
7. Phase 9 — AI Prompt Library  
8. Phase 10 — Dashboard completeness  
9. Phase 11 — Notifications  
10. Phase 12 — Security hardening  
11. Phase 13 — Testing suites  
12. Phase 14 — Deployment / ops  

---

## 3. Architecture decisions (locked / provisional)

| ID | Decision | Status |
|----|----------|--------|
| AD-001 | Enterprise web monorepo at repo root; keep `applyai/` Expo as reference | Locked |
| AD-002 | Assistive Smart Apply only (no unauthorized third-party bots) | Locked |
| AD-003 | Backend: Node.js + Express + TypeScript, Clean Architecture layers | Locked (Phase 2) |
| AD-004 | Data: Firebase Auth + Firestore + Storage | Locked (Phase 2); confirmed in Phase 3 |
| AD-005 | Automation: n8n (self-hosted via Docker) | Locked (Phase 2) |
| AD-006 | AI: OpenAI API with versioned prompts | Locked (Phase 2) |
| AD-007 | Frontend state: Redux Toolkit + React Query (target) | Target — see tech debt |
| AD-008 | Demo mode for local boot without credentials | Provisional until Firebase wired |

---

## 4. Technical debt

| Item | Severity | Resolution phase |
|------|----------|------------------|
| Scaffold used Zustand instead of Redux Toolkit | Medium | Phase 4–5 refactor |
| React Query / RHF / Zod not yet on frontend | Medium | Phase 5 |
| In-memory repositories instead of Firestore | High | Phase 6–7 |
| Demo Bearer auth instead of Firebase ID token + claims | High | Phase 6 |
| Missing ESLint/Prettier/EditorConfig at monorepo root | Medium | Phase 4 |
| Missing unit/integration/e2e tests for scaffold | High | Phase 4 gate + Phase 13 |
| Stack comparisons (Phase 3) not yet written | Medium | Phase 3 next |

### Recent UX polish (2026-08-02)

- Colorful animated login hero, glass surfaces, page transitions (Framer Motion)
- Shared `JobCard` / `StatTile`, gradient CTAs, clearer empty states
- Does not replace formal Phase 3–5 enterprise refactor

---

## 5. Process correction

Early scaffolding started before Phase 2/3 completed.  
**Corrective action:** Freeze new feature work until Phase 2 and Phase 3 are approved. Treat existing `frontend/` + `backend/` as a bootstrap that will be refactored to match approved architecture and stack.

---

## 6. Future improvements

- Prompt management admin UI  
- AI chat assistant  
- Google Drive/Sheets/Calendar + Telegram production connectors  
- Playwright e2e in CI  
- Multi-region disaster recovery  

---

## 7. Sign-off log

| Phase | Decision | Date |
|-------|----------|------|
| Phase 1 | Approved (implement request) | 2026-08-02 |
| Phase 2 | Delivered — awaiting stakeholder approval | 2026-08-02 |
