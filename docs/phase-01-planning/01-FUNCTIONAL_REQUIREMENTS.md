# Functional Requirements — AI Job Agent

**Document ID:** FR-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02

---

## 1. Purpose

Define the capabilities the AI Job Agent must provide for job seekers (and platform admins) to discover jobs, match them with AI, prepare application materials, track applications, receive notifications, and view analytics — while complying with third-party platform policies.

---

## 2. Actors

| Actor | Description |
|-------|-------------|
| Candidate (User) | Authenticated job seeker using the product |
| Admin | Platform operator managing users, prompts, system health |
| System | Automated jobs, AI services, workflows, schedulers |
| External Provider | OpenAI, job APIs, email, Telegram, calendar, etc. |

---

## 3. Requirement conventions

| Priority | Meaning |
|----------|---------|
| **P0** | Must-have for v1 release |
| **P1** | Should-have for v1 if schedule allows |
| **P2** | Nice-to-have; may move to future scope |

IDs use `FR-<AREA>-<NNN>`.

---

## 4. Authentication & account management

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTH-001 | P0 | Users shall register with email and password. |
| FR-AUTH-002 | P0 | Users shall sign in and sign out securely. |
| FR-AUTH-003 | P0 | Users shall reset forgotten passwords via email link. |
| FR-AUTH-004 | P1 | Users shall sign in with Google OAuth. |
| FR-AUTH-005 | P0 | Unauthenticated users shall not access protected routes/APIs. |
| FR-AUTH-006 | P0 | Sessions shall expire and be refreshable per security policy. |
| FR-AUTH-007 | P0 | Admins shall authenticate with elevated privileges (RBAC). |

---

## 5. Profile & resume management

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-RES-001 | P0 | Users shall upload resume files (PDF, DOCX) within a size limit (default 10 MB). |
| FR-RES-002 | P0 | System shall store resumes in secure object storage. |
| FR-RES-003 | P0 | System shall parse resumes with AI into structured profile fields. |
| FR-RES-004 | P0 | Users shall view and edit parsed profile data (skills, experience, education, summary, preferences). |
| FR-RES-005 | P0 | System shall compute profile completeness percentage. |
| FR-RES-006 | P0 | System shall compute an ATS compatibility score with explanation. |
| FR-RES-007 | P0 | Users shall manage multiple resume versions (list, set active, delete). |
| FR-RES-008 | P1 | Users shall generate a tailored resume draft for a selected job. |
| FR-RES-009 | P1 | Users shall download/export tailored resume content. |

---

## 6. Job discovery

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-JOB-001 | P0 | Users shall search jobs by keywords, title, skills, and location. |
| FR-JOB-002 | P0 | Users shall filter by remote/hybrid/onsite, platform, date, and other available metadata. |
| FR-JOB-003 | P0 | System shall fetch jobs from approved provider APIs (not unauthorized scraping). |
| FR-JOB-004 | P0 | System shall cache job results for performance and cost control. |
| FR-JOB-005 | P0 | Users shall view job detail pages with description, company, location, and source link. |
| FR-JOB-006 | P0 | Users shall save/unsave jobs. |
| FR-JOB-007 | P0 | System shall show “Today’s Jobs” (new or refreshed matches for the current day). |
| FR-JOB-008 | P1 | System shall allow scheduled discovery refresh via automation (n8n or cron). |

---

## 7. AI job matching

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-MATCH-001 | P0 | System shall compute a match score between user profile and each job. |
| FR-MATCH-002 | P0 | Match score shall consider at least skills, experience, education, location, and salary preference when data exists. |
| FR-MATCH-003 | P0 | Users shall see score breakdown (component contributions). |
| FR-MATCH-004 | P1 | System shall provide natural-language match rationale via AI. |
| FR-MATCH-005 | P1 | System shall perform skill-gap analysis for a selected job. |
| FR-MATCH-006 | P2 | System shall suggest learning resources for skill gaps. |

---

## 8. Application materials (AI generation)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AI-001 | P0 | Users shall generate a cover letter for a selected job. |
| FR-AI-002 | P0 | Users shall edit generated cover letters before save/use. |
| FR-AI-003 | P0 | System shall version and store prompt templates used for generation. |
| FR-AI-004 | P1 | Users shall generate recruiter outreach email (subject + body). |
| FR-AI-005 | P1 | Users shall generate interview questions for a job/role. |
| FR-AI-006 | P1 | Users shall request career advice based on profile + goals. |
| FR-AI-007 | P1 | Users shall request salary analysis for a role/location. |
| FR-AI-008 | P1 | Users shall generate follow-up emails for existing applications. |
| FR-AI-009 | P0 | All AI outputs shall be labeled as AI-assisted and editable by the user. |
| FR-AI-010 | P0 | System shall enforce per-user AI rate limits and daily quotas. |

---

## 9. Apply & outreach (compliance-first)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-APP-001 | P0 | Users shall initiate “Smart Apply” that opens the official job posting after explicit confirmation. |
| FR-APP-002 | P0 | System shall **not** bypass platform authentication or submit applications without user action on third-party sites. |
| FR-APP-003 | P0 | After user confirmation, system shall create an application tracking record. |
| FR-APP-004 | P1 | Users shall send recruiter emails through approved providers (SendGrid/Gmail) with consent and rate limits. |
| FR-APP-005 | P1 | Users shall generate LinkedIn share content and open the official share flow. |
| FR-APP-006 | P0 | System shall record application source platform (LinkedIn, Indeed, Naukri, Other). |

---

## 10. Application tracking

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-TRK-001 | P0 | Users shall view all applications in a list with status filters. |
| FR-TRK-002 | P0 | Supported statuses shall include at least: Saved, Applied, Interview, Offer, Rejected, Withdrawn (and optional Viewed). |
| FR-TRK-003 | P0 | Users shall update application status manually. |
| FR-TRK-004 | P0 | System shall maintain a status timeline/history per application. |
| FR-TRK-005 | P0 | Users shall add notes to applications. |
| FR-TRK-006 | P1 | Users shall attach interview date/time and sync to Google Calendar. |
| FR-TRK-007 | P1 | Users shall filter views: Interviews, Offers, Rejected. |

---

## 11. Dashboard & analytics

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-DASH-001 | P0 | Users shall see an Overview dashboard (stats, top matches, recent activity). |
| FR-DASH-002 | P0 | Dashboard shall show counts for Applied, Interviews, Offers, Rejected. |
| FR-DASH-003 | P1 | Users shall view analytics charts (applications over time, status distribution, match score trends). |
| FR-DASH-004 | P0 | Users shall access Today’s Jobs, Saved Jobs, Applications, Notifications, Settings, Profile, Resume Manager. |
| FR-DASH-005 | P0 | UI shall support light and dark mode. |
| FR-DASH-006 | P0 | UI shall be responsive (desktop and mobile viewports). |
| FR-DASH-007 | P1 | Admin dashboard shall show system metrics (users, AI usage, error rates, workflow health). |

---

## 12. Notifications

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-NOT-001 | P0 | System shall create in-app notifications for key events (new matches, status reminders). |
| FR-NOT-002 | P1 | Users shall receive email notifications for configurable events. |
| FR-NOT-003 | P1 | Users shall receive Telegram notifications if connected. |
| FR-NOT-004 | P2 | Users shall receive Slack notifications if connected. |
| FR-NOT-005 | P0 | Users shall configure notification preferences. |
| FR-NOT-006 | P1 | System shall create Google Calendar events for interviews when authorized. |

---

## 13. Settings & preferences

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-SET-001 | P0 | Users shall manage job preferences (roles, locations, remote, salary range). |
| FR-SET-002 | P0 | Users shall manage theme (light/dark/system). |
| FR-SET-003 | P0 | Users shall manage notification channels. |
| FR-SET-004 | P1 | Users shall connect/disconnect optional integrations (Telegram, Calendar, Gmail). |
| FR-SET-005 | P0 | Users shall delete account / request data deletion (privacy). |

---

## 14. Admin & governance

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-ADM-001 | P0 | Admins shall list/search users and view basic account status. |
| FR-ADM-002 | P0 | Admins shall manage AI prompt versions (activate/rollback). |
| FR-ADM-003 | P1 | Admins shall view audit/activity logs. |
| FR-ADM-004 | P1 | Admins shall configure global rate limits and feature flags. |
| FR-ADM-005 | P0 | System shall write activity logs for security-sensitive actions. |

---

## 15. Automation (n8n / workflows)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-AUTO-001 | P1 | System shall support workflows for scheduled job refresh. |
| FR-AUTO-002 | P1 | System shall support workflows for match digest notifications. |
| FR-AUTO-003 | P1 | Workflows shall include error handling, retries, and logging. |
| FR-AUTO-004 | P1 | Workflows shall integrate HTTP API, OpenAI, Sheets/Drive, Telegram, Gmail as configured. |

---

## 16. API & documentation (product-facing engineering)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-API-001 | P0 | Backend shall expose versioned REST APIs for core resources. |
| FR-API-002 | P0 | APIs shall be documented (OpenAPI/Swagger). |
| FR-API-003 | P0 | APIs shall validate inputs and return consistent error shapes. |

---

## 17. Traceability notes

Functional requirements map forward to:

- User Stories → `04-USER_STORIES.md`  
- Use Cases → `05-USE_CASES.md`  
- Scope → `06-SCOPE.md`  

Existing ApplyAI feature parity baseline: `applyai/docs/FEATURES.md` (resume, jobs, match, smart apply, cover letter, outreach, tracking, dashboard).
