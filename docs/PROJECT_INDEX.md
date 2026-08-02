# AI Job Agent — Project Index & Checklist

**Product working name:** ApplyAI / AI Job Agent  
**Document status:** Phase 1 approved (implementation started) · Scaffold live  
**Last updated:** 2026-08-02  
**Owner:** Engineering team (architecture, product, security, QA)

---

## How to use this index

1. Complete one phase at a time.
2. Do not start the next phase until the current phase is reviewed and approved.
3. Mark items `[x]` only after deliverables exist and are reviewed.
4. Open questions that block a decision are listed under [Clarifications required](#clarifications-required).

---

## Existing workspace context

| Item | Location | Notes |
|------|----------|-------|
| Legacy / current app | `applyai/` | Expo (React Native) + Firebase Cloud Functions + OpenAI + JSearch |
| Existing PRD (PDF) | `PRD_ AI Job Application Automation Platform (ApplyAI).pdf` | Product baseline |
| Enterprise planning (this effort) | `docs/` | Phased enterprise rebuild / evolution docs |

> **Important:** The master build specification targets React + Material UI + Tailwind + Express + n8n. The current `applyai/` codebase uses Expo + Cloud Functions. Stack direction is a Phase 3 decision and requires stakeholder confirmation (see clarifications).

---

## Phase checklist

### Phase 1 — Project Planning

| Deliverable | Path | Status |
|-------------|------|--------|
| Functional Requirements | `docs/phase-01-planning/01-FUNCTIONAL_REQUIREMENTS.md` | [x] Draft complete |
| Non-Functional Requirements | `docs/phase-01-planning/02-NON_FUNCTIONAL_REQUIREMENTS.md` | [x] Draft complete |
| Software Requirement Specification (SRS) | `docs/phase-01-planning/03-SRS.md` | [x] Draft complete |
| User Stories | `docs/phase-01-planning/04-USER_STORIES.md` | [x] Draft complete |
| Use Cases | `docs/phase-01-planning/05-USE_CASES.md` | [x] Draft complete |
| Scope | `docs/phase-01-planning/06-SCOPE.md` | [x] Draft complete |
| Future Scope | `docs/phase-01-planning/07-FUTURE_SCOPE.md` | [x] Draft complete |
| Phase 1 overview | `docs/phase-01-planning/README.md` | [x] Draft complete |
| Setup / credentials checklist | `docs/SETUP_REQUIREMENTS.md` | [x] Draft complete |
| **Phase 1 review sign-off** | — | [x] Approved via implement request |

### Phase 2 — Architecture

| Deliverable | Status |
|-------------|--------|
| High-Level Architecture | [x] `phase-02-architecture/01-HIGH_LEVEL_ARCHITECTURE.md` |
| Low-Level Architecture | [x] `phase-02-architecture/02-LOW_LEVEL_ARCHITECTURE.md` |
| Component Diagram | [x] `phase-02-architecture/03-COMPONENT_DIAGRAM.md` |
| Sequence Diagrams | [x] `phase-02-architecture/04-SEQUENCE_DIAGRAMS.md` |
| Activity Diagrams | [x] `phase-02-architecture/05-ACTIVITY_DIAGRAMS.md` |
| ER Diagram | [x] `phase-02-architecture/06-ER_AND_DATABASE.md` |
| Database Diagram | [x] included with ER doc |
| Deployment Diagram | [x] `phase-02-architecture/07-DEPLOYMENT_DIAGRAM.md` |
| Class Diagram | [x] `phase-02-architecture/08-CLASS_DIAGRAM.md` |
| `ARCHITECTURE.md` | [x] `docs/ARCHITECTURE.md` |
| **Phase 2 review sign-off** | [ ] **Awaiting your approval** |

### Phase 3 — Technology Selection

| Deliverable | Status |
|-------------|--------|
| Technology decision records (ADRs) | [ ] Not started |
| Alternatives comparison matrix | [ ] Not started |

### Phase 4 — Folder Structure

| Deliverable | Status |
|-------------|--------|
| Complete repository layout | [x] Created |
| Folder explanations | [x] `docs/phase-04-structure/FOLDER_STRUCTURE.md` |

### Phase 5 — Frontend

| Deliverable | Status |
|-------------|--------|
| React + TypeScript app scaffold | [x] Running scaffold |
| Feature modules, auth, dashboard shells | [x] Overview/Jobs/Apps/Profile + dark mode |

### Phase 6 — Backend

| Deliverable | Status |
|-------------|--------|
| Node.js Express API | [x] Scaffold with demo mode |
| Auth, middleware, Swagger | [x] Demo Bearer + Swagger + rate limits |

### Phase 7 — Database

| Deliverable | Status |
|-------------|--------|
| Firestore collections design | [ ] Not started |
| `DATABASE.md` | [ ] Not started |

### Phase 8 — Automation (n8n)

| Deliverable | Status |
|-------------|--------|
| Workflow definitions + guide | [ ] Not started |
| `N8N_GUIDE.md` | [ ] Not started |

### Phase 9 — Artificial Intelligence

| Deliverable | Status |
|-------------|--------|
| Versioned prompts | [ ] Not started |
| `PROMPTS.md` | [ ] Not started |

### Phase 10 — Dashboard

| Deliverable | Status |
|-------------|--------|
| User + Admin dashboards | [ ] Not started |

### Phase 11 — Notifications

| Deliverable | Status |
|-------------|--------|
| Telegram, Email, Calendar, Slack | [ ] Not started |

### Phase 12 — Security

| Deliverable | Status |
|-------------|--------|
| Security controls + `SECURITY.md` | [ ] Not started |

### Phase 13 — Testing

| Deliverable | Status |
|-------------|--------|
| Test strategy + suites | [ ] Not started |
| `TESTING.md` | [ ] Not started |

### Phase 14 — Deployment

| Deliverable | Status |
|-------------|--------|
| Docker, CI/CD, ops runbooks | [ ] Not started |
| `DEPLOYMENT.md` | [ ] Not started |

### Cross-cutting documentation (required files)

| File | Status |
|------|--------|
| `README.md` (enterprise root) | [ ] Pending (after Phase 1 approval / structure) |
| `INSTALLATION.md` | [ ] Not started |
| `API_DOCUMENTATION.md` | [ ] Not started |
| `N8N_GUIDE.md` | [ ] Not started |
| `DEPLOYMENT.md` | [ ] Not started |
| `SECURITY.md` | [ ] Not started |
| `TESTING.md` | [ ] Not started |
| `ARCHITECTURE.md` | [ ] Not started |
| `DATABASE.md` | [ ] Not started |
| `PROMPTS.md` | [ ] Not started |
| `CHANGELOG.md` | [ ] Stub after Phase 1 |
| `LICENSE` | [ ] Not started |
| `CONTRIBUTING.md` | [ ] Not started |
| `SETUP_REQUIREMENTS.md` | [x] Draft complete |
| PDF pack (15 documents) | [ ] After all modules complete |

---

## Clarifications required

These decisions are **not assumed**. Please answer before Phase 2/3 proceed:

1. **Product direction:** Greenfield enterprise web platform (React + Express + n8n) **or** evolve the existing Expo `applyai/` app **or** dual-track (keep mobile, add enterprise web API)?
2. **Product name:** Keep **ApplyAI** or rename to **AI Job Agent**?
3. **Primary clients:** Web only, mobile only, or web + iOS/Android?
4. **Job data source:** Continue RapidAPI JSearch, add others, or allow pluggable providers?
5. **Application model:** Assistive (open official job page; user submits) only, or any automated form-fill within ToS?
6. **Multi-tenancy:** Single-user SaaS accounts only, or org/team workspaces in v1?
7. **Admin roles:** Platform admin + end user only, or recruiter/coach roles in v1?
8. **Compliance regions:** Target markets (e.g., India, US, EU) for privacy/data residency?
9. **License:** MIT, proprietary, or other?
10. **n8n hosting:** Self-hosted (Docker) required for v1, or Cloud Functions-only until later?

---

## Review gate

**Phase 1 is complete as a draft.**  
Reply with:

- `Phase 1 approved` — proceed to Phase 2 (Architecture), or  
- Specific change requests for planning documents, or  
- Answers to the clarifications above (recommended before Architecture).
