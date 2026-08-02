# Scope — AI Job Agent (v1)

**Document ID:** SCOPE-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02  

---

## 1. Purpose

Define what is **in scope** and **out of scope** for the first production-ready release (v1), so engineering, design, and stakeholders share the same boundary.

---

## 2. Product goal (v1)

Deliver a secure, modular AI Job Agent that helps a candidate:

1. Build an AI-enriched profile from a resume  
2. Discover and shortlist jobs from approved APIs  
3. Understand match quality  
4. Generate editable application materials  
5. Apply via compliance-safe assistive flows  
6. Track pipeline status and receive notifications  
7. View a dashboard with dark mode  
8. Allow admins to manage prompts and basic governance  

---

## 3. In scope (v1)

### 3.1 Planning & engineering foundation

- Complete Phase 1–14 deliverables per master process  
- Enterprise documentation set listed in master prompt  
- `SETUP_REQUIREMENTS.md` before feature implementation  
- Running project index/checklist  

### 3.2 Candidate product capabilities (P0 unless noted)

| Area | Included |
|------|----------|
| Auth | Email/password, session protection, password reset; Google OAuth (P1) |
| Resume | Upload PDF/DOCX, storage, AI parse, ATS score, edit profile, multi-version |
| Jobs | Search/filter, detail, save, today’s jobs, cache, provider integration or mock |
| Matching | Weighted score + breakdown; AI rationale / skill gap (P1) |
| AI writing | Cover letter (P0); outreach, interview Qs, advice, salary, follow-up (P1) |
| Apply | Smart Apply confirm → official URL → track; LinkedIn share assist (P1) |
| Tracking | Statuses, timeline, notes; interview calendar sync (P1) |
| Dashboard | Overview, module navigation, responsive UI, dark mode; charts (P1) |
| Notifications | In-app + preferences; email/Telegram/calendar (P1); Slack (P2) |
| Admin | User list/search, prompt versioning, activity logs (logs P1) |
| API | REST, validation, authz, rate limits, Swagger |
| Security | JWT/Firebase tokens, RBAC, HTTPS, XSS/CSRF controls as applicable, secrets mgmt |
| Quality | Unit/API tests for critical paths; documented broader test strategy |
| Deploy | Docker, Compose, GitHub Actions, env separation, monitoring basics |

### 3.3 Compliance boundary (in scope)

- Assistive application model that requires user confirmation  
- Opening official third-party pages  
- User-responsible final submission on external sites  
- Rate-limited outreach with explicit user action  

### 3.4 Documentation (in scope for overall program)

All required markdown guides and, after modules complete, the 15 PDF sources.

---

## 4. Out of scope (v1)

| Item | Reason |
|------|--------|
| Unauthorized scraping of LinkedIn/Indeed/Naukri HTML | ToS / legal risk |
| Headless bots that auto-submit applications on third-party sites | Policy compliance |
| Guaranteed job offers / placement agency licensing features | Not a product claim |
| Full employer ATS / recruiter hiring suite | Different product |
| Native mobile rewrite commitment | Pending clarification (Expo already exists) |
| Multi-tenant org workspaces / team seats | Pending clarification; default single-user accounts |
| Advanced ML model training on private user corpora | Cost/privacy; use hosted LLM |
| Real-time chat with recruiters inside the app | Future |
| Payment/billing/subscriptions marketplace | Future unless requested |
| Offline-only full feature parity | Best-effort progressive enhancement only |
| Legal counsel substitute / visa advice automation as certified advice | Liability |

---

## 5. Relationship to existing ApplyAI codebase

| Topic | Scope statement |
|-------|-----------------|
| `applyai/` Expo app | **Reference implementation / product baseline**, not automatically the v1 architecture |
| Feature parity | v1 P0 aims to cover ApplyAI’s current core flows (auth, resume, jobs, match, smart apply, cover letter, outreach, tracking, dashboard) |
| Stack change | React+MUI+Tailwind+Express+n8n is the **master-prompt target**, but adoption requires Phase 3 decision |

---

## 6. Success criteria (v1 release)

1. A new user can register, upload a resume, see parsed profile, search jobs, view match scores, generate a cover letter, Smart Apply, and track status end-to-end.  
2. Security baseline (authz, validation, rate limits, secrets) verified by checklist.  
3. APIs documented; core automated tests pass in CI.  
4. Deployment runnable via documented Docker/Compose path.  
5. No known ToS-violating automation in shipped features.  

---

## 7. Scope change control

Any new feature request during later phases must be:

1. Mapped to FR/US IDs  
2. Priority tagged (P0/P1/P2)  
3. Approved as scope increase or deferred to `07-FUTURE_SCOPE.md`  

---

## 8. Approval

| Role | Decision | Date |
|------|----------|------|
| Product Owner | Approve / Request changes | _TBD_ |
| Tech Lead | Approve / Request changes | _TBD_ |
