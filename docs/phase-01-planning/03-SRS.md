# Software Requirements Specification (SRS)

**Product:** AI Job Agent (working name; may retain ApplyAI brand)  
**Document ID:** SRS-AJAGENT-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft — pending approval  
**Last updated:** 2026-08-02  

---

## Table of contents

1. Introduction  
2. Overall description  
3. System features  
4. External interface requirements  
5. System requirements (functional summary)  
6. Non-functional requirements (summary)  
7. Data requirements  
8. Constraints & assumptions  
9. Compliance & ethics  
10. Appendices  

---

## 1. Introduction

### 1.1 Purpose

This SRS specifies requirements for building a production-ready AI Job Agent that helps candidates discover jobs, match opportunities with AI, prepare application materials, track applications, receive notifications, and analyze progress — under enterprise engineering standards.

### 1.2 Scope of product

**In product terms:** A modular web (and optionally mobile) platform with backend APIs, Firebase persistence, AI prompt services, optional n8n automations, and an admin surface.

**Out of product terms for v1:** Unauthorized botting of third-party career sites, guaranteed interview outcomes, or acting as an employer ATS.

Detailed in/out lists: `06-SCOPE.md`.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Smart Apply | User-confirmed open of official job URL + local tracking record |
| Match score | Weighted compatibility between profile and job |
| Prompt version | Immutable prompt template revision with activate/rollback |
| Application | Tracked attempt/status for a job opportunity |
| RBAC | Role-based access control |

### 1.4 References

- Master enterprise build prompt (stakeholder)  
- Existing ApplyAI docs: `applyai/docs/*`  
- Existing PRD PDF in workspace root  
- `SETUP_REQUIREMENTS.md`, FR/NFR documents in this folder  

### 1.5 Overview

Sections 2–3 describe stakeholders and features. Sections 4–7 define interfaces and data. Sections 8–9 capture constraints and compliance. Detailed stories/use cases live in companion docs.

---

## 2. Overall description

### 2.1 Product perspective

```
[Candidate UI] ──REST/SDK──► [API / Functions]
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
           [Firestore]      [Object Storage]   [Auth]
                │
                ├──► [OpenAI]
                ├──► [Job Provider API]
                ├──► [Email / Telegram / Calendar]
                └──► [n8n Workflows] (optional/target)
```

### 2.2 User classes

| Class | Responsibilities |
|-------|------------------|
| Candidate | Profile, jobs, AI tools, applications, settings |
| Admin | Users, prompts, limits, audit, system health |
| Operator (DevOps) | Deploy, secrets, monitoring (non-UI) |

### 2.3 Operating environment

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari)  
- Mobile responsive web; native mobile TBD (clarification)  
- Cloud-hosted Firebase + containerized API/n8n  

### 2.4 Design & implementation constraints

- Clean architecture, repository pattern, strong typing  
- Secrets server-side only  
- Policy-compliant job apply flows  
- Phased delivery; no phase skip without approval  

### 2.5 Assumptions

1. Stakeholders will confirm stack direction (Expo evolve vs enterprise React/Express).  
2. Users own the accuracy of materials they submit to employers.  
3. Third-party APIs remain available under commercial terms.  
4. OpenAI (or approved equivalent) remains the primary LLM.  

### 2.6 Dependencies

OpenAI, Firebase, job search API, optional Google/Telegram/Slack, Docker, GitHub Actions.

---

## 3. System features (SRS feature groups)

| Feature group | Summary | FR refs |
|---------------|---------|---------|
| F1 Auth | Register, login, reset, OAuth, RBAC | FR-AUTH-* |
| F2 Resume & profile | Upload, parse, edit, versions, ATS | FR-RES-* |
| F3 Job discovery | Search, filter, save, today’s jobs | FR-JOB-* |
| F4 Matching | Scores, rationale, skill gaps | FR-MATCH-* |
| F5 AI writing | Cover letter, outreach, advice, etc. | FR-AI-* |
| F6 Apply assistance | Smart Apply, share, compliant outreach | FR-APP-* |
| F7 Tracking | Status pipeline, notes, interviews | FR-TRK-* |
| F8 Dashboard | Overview, analytics, dark mode | FR-DASH-* |
| F9 Notifications | In-app + optional channels | FR-NOT-* |
| F10 Settings | Preferences, integrations, deletion | FR-SET-* |
| F11 Admin | Users, prompts, logs, flags | FR-ADM-* |
| F12 Automation | Scheduled digests, sync workflows | FR-AUTO-* |
| F13 API platform | Versioned REST + OpenAPI | FR-API-* |

---

## 4. External interface requirements

### 4.1 User interfaces

- Auth screens; dashboard modules listed in master prompt Phase 10  
- Loading/error/empty states; form validation  
- Dark/light theme  

### 4.2 Hardware interfaces

None beyond standard client devices and cloud hosts.

### 4.3 Software interfaces

| Interface | Direction | Protocol |
|-----------|-----------|----------|
| Firebase Auth | Bidirectional | SDK / REST |
| Firestore | Bidirectional | SDK / Admin |
| Firebase Storage | Bidirectional | SDK / Admin |
| OpenAI API | Outbound | HTTPS |
| Job provider API | Outbound | HTTPS |
| SendGrid / Gmail | Outbound | HTTPS / OAuth |
| Telegram Bot API | Outbound | HTTPS |
| Google Calendar | Outbound | OAuth HTTPS |
| n8n | Bidirectional webhooks | HTTPS |

### 4.4 Communications interfaces

- TLS 1.2+  
- JSON request/response for APIs  
- Webhooks for workflow callbacks  

---

## 5. Functional requirements (summary)

Full normative list: `01-FUNCTIONAL_REQUIREMENTS.md`.

Minimum v1 capability set (P0):

1. Secure auth and protected access  
2. Resume upload + AI parse + editable profile  
3. Job search/filter/detail/save + today’s jobs  
4. Match scoring with breakdown  
5. Cover letter generation with edit/save  
6. Smart Apply (confirm → official URL → track)  
7. Application tracking with timeline  
8. Overview dashboard + dark mode + responsive UI  
9. In-app notifications + preferences  
10. Admin basics + activity logging  
11. Documented REST API with validation & rate limits  

---

## 6. Non-functional requirements (summary)

Full normative list: `02-NON_FUNCTIONAL_REQUIREMENTS.md`.

Highlights: p95 API ≤ 500 ms (non-AI), HTTPS, RBAC, rate limits, Docker + CI/CD, structured logs, ≥ 99.5% availability target, ToS-compliant apply model.

---

## 7. Data requirements

Logical entities (detailed in Phase 7):

| Entity | Description |
|--------|-------------|
| User | Auth identity + profile + preferences |
| Resume | File metadata + parsed content + versions |
| Job | Normalized job posting + cache metadata |
| Application | User–job link + status history |
| Prompt | Versioned AI templates |
| Notification | In-app notification records |
| AnalyticsEvent | Aggregatable usage events |
| ActivityLog | Security/ops audit entries |
| Settings | User and system settings |

Relationships (conceptual): User 1—N Resumes; User 1—N Applications; Job 1—N Applications; User 1—N Notifications; Prompt N used by AI generations.

---

## 8. Constraints & assumptions

### 8.1 Constraints

- No unauthorized automation against third-party sites  
- Budget-aware AI and job API usage  
- Must produce maintainable modular codebase  

### 8.2 Open decisions (blockers for Architecture/Tech Selection)

See `PROJECT_INDEX.md` → Clarifications required (product direction, clients, job source, multi-tenancy, license, n8n timing).

---

## 9. Compliance & ethics

1. **User agency:** AI drafts are suggestions; user remains responsible for submissions.  
2. **Transparency:** Label AI-generated content.  
3. **Anti-abuse:** Rate limits on email/outreach; consent required.  
4. **Platform ToS:** Assistive apply only unless legal/product explicitly expands.  
5. **Privacy:** Minimize PII; deletion pathway required.  

---

## 10. Appendices

### A. Document control

| Version | Date | Author role | Notes |
|---------|------|-------------|-------|
| 1.0.0-draft | 2026-08-02 | Technical Writer + Architect | Initial Phase 1 SRS |

### B. Traceability matrix (sample)

| SRS Feature | User Stories | Use Cases |
|-------------|--------------|-----------|
| F1 Auth | US-AUTH-* | UC-01, UC-02 |
| F2 Resume | US-RES-* | UC-03, UC-04 |
| F3 Jobs | US-JOB-* | UC-05 |
| F4 Match | US-MATCH-* | UC-06 |
| F5 AI writing | US-AI-* | UC-07, UC-08 |
| F6 Apply | US-APP-* | UC-09 |
| F7 Tracking | US-TRK-* | UC-10 |
| F8 Dashboard | US-DASH-* | UC-11 |
| F11 Admin | US-ADM-* | UC-12 |

### C. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | _TBD_ | | |
| Tech Lead | _TBD_ | | |
| Security Reviewer | _TBD_ | | |
