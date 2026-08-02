# User Stories — AI Job Agent

**Document ID:** US-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02  

**Format:** As a \<role\>, I want \<goal\>, so that \<benefit\>.  
**Acceptance criteria** use Given/When/Then where helpful.

---

## Epic map

| Epic | Stories |
|------|---------|
| E1 Authentication | US-AUTH-001 … 004 |
| E2 Resume & Profile | US-RES-001 … 005 |
| E3 Job Discovery | US-JOB-001 … 004 |
| E4 Matching | US-MATCH-001 … 003 |
| E5 AI Materials | US-AI-001 … 006 |
| E6 Apply & Outreach | US-APP-001 … 003 |
| E7 Tracking | US-TRK-001 … 004 |
| E8 Dashboard & Analytics | US-DASH-001 … 004 |
| E9 Notifications | US-NOT-001 … 003 |
| E10 Settings | US-SET-001 … 003 |
| E11 Admin | US-ADM-001 … 003 |

---

## E1 — Authentication

### US-AUTH-001 — Email signup
**As a** candidate, **I want** to create an account with email/password, **so that** I can securely use the platform.

**Priority:** P0 | **FR:** FR-AUTH-001  

**Acceptance**

- Given valid email/password, when I submit signup, then account is created and I land in an authenticated area.  
- Given duplicate email, when I signup, then I see a clear error.  
- Password rules are enforced and displayed.

### US-AUTH-002 — Login / logout
**As a** candidate, **I want** to log in and log out, **so that** I control access to my data.

**Priority:** P0 | **FR:** FR-AUTH-002, FR-AUTH-005  

**Acceptance**

- Protected routes redirect unauthenticated users to login.  
- Logout clears session and blocks protected APIs.

### US-AUTH-003 — Password reset
**As a** candidate, **I want** to reset my password by email, **so that** I can recover access.

**Priority:** P0 | **FR:** FR-AUTH-003  

### US-AUTH-004 — Google sign-in
**As a** candidate, **I want** to sign in with Google, **so that** I can onboard faster.

**Priority:** P1 | **FR:** FR-AUTH-004  

---

## E2 — Resume & profile

### US-RES-001 — Upload resume
**As a** candidate, **I want** to upload my PDF/DOCX resume, **so that** the system can build my profile.

**Priority:** P0 | **FR:** FR-RES-001, FR-RES-002  

**Acceptance**

- Reject files over size limit or wrong type with message.  
- Successful upload stores file under user-scoped path.

### US-RES-002 — AI parse resume
**As a** candidate, **I want** AI to extract skills/experience/education, **so that** I avoid manual data entry.

**Priority:** P0 | **FR:** FR-RES-003, FR-RES-006  

**Acceptance**

- Parsed fields populate profile.  
- ATS score shown with brief explanation.  
- Failures show recoverable error; no silent data loss.

### US-RES-003 — Edit profile
**As a** candidate, **I want** to edit parsed fields and preferences, **so that** my profile stays accurate.

**Priority:** P0 | **FR:** FR-RES-004, FR-RES-005  

### US-RES-004 — Manage resume versions
**As a** candidate, **I want** multiple resume versions and an active default, **so that** I can tailor materials per track.

**Priority:** P0 | **FR:** FR-RES-007  

### US-RES-005 — Tailor resume to a job
**As a** candidate, **I want** an AI-tailored resume draft for a job, **so that** I improve relevance/ATS fit.

**Priority:** P1 | **FR:** FR-RES-008, FR-RES-009  

---

## E3 — Job discovery

### US-JOB-001 — Search jobs
**As a** candidate, **I want** to search jobs by keywords and filters, **so that** I find relevant openings quickly.

**Priority:** P0 | **FR:** FR-JOB-001 … 003  

### US-JOB-002 — View job detail
**As a** candidate, **I want** a detailed job view with source link, **so that** I can evaluate the role.

**Priority:** P0 | **FR:** FR-JOB-005  

### US-JOB-003 — Save jobs
**As a** candidate, **I want** to save jobs for later, **so that** I can shortlist opportunities.

**Priority:** P0 | **FR:** FR-JOB-006  

### US-JOB-004 — Today’s jobs
**As a** candidate, **I want** a Today’s Jobs view, **so that** I focus on fresh opportunities.

**Priority:** P0 | **FR:** FR-JOB-007  

---

## E4 — Matching

### US-MATCH-001 — See match score
**As a** candidate, **I want** a match score on each job, **so that** I prioritize better fits.

**Priority:** P0 | **FR:** FR-MATCH-001, FR-MATCH-002  

### US-MATCH-002 — Score breakdown
**As a** candidate, **I want** component breakdowns, **so that** I understand why a job scores high/low.

**Priority:** P0 | **FR:** FR-MATCH-003  

### US-MATCH-003 — Skill gap analysis
**As a** candidate, **I want** skill-gap insights for a job, **so that** I know what to improve.

**Priority:** P1 | **FR:** FR-MATCH-005  

---

## E5 — AI materials

### US-AI-001 — Cover letter
**As a** candidate, **I want** an AI cover letter for a job that I can edit, **so that** I apply faster with quality writing.

**Priority:** P0 | **FR:** FR-AI-001, FR-AI-002, FR-AI-009  

### US-AI-002 — Recruiter email
**As a** candidate, **I want** AI to draft recruiter outreach, **so that** I can personalize outreach quickly.

**Priority:** P1 | **FR:** FR-AI-004  

### US-AI-003 — Interview questions
**As a** candidate, **I want** likely interview questions, **so that** I can prepare.

**Priority:** P1 | **FR:** FR-AI-005  

### US-AI-004 — Career advice
**As a** candidate, **I want** AI career advice from my profile/goals, **so that** I plan next steps.

**Priority:** P1 | **FR:** FR-AI-006  

### US-AI-005 — Salary analysis
**As a** candidate, **I want** salary insights for a role/location, **so that** I negotiate with context.

**Priority:** P1 | **FR:** FR-AI-007  

### US-AI-006 — Follow-up email
**As a** candidate, **I want** a follow-up email draft for an application, **so that** I stay professional and consistent.

**Priority:** P1 | **FR:** FR-AI-008  

---

## E6 — Apply & outreach

### US-APP-001 — Smart Apply
**As a** candidate, **I want** one-tap assistive apply that opens the official posting after confirmation, **so that** I apply without ToS-violating bots.

**Priority:** P0 | **FR:** FR-APP-001 … 003  

**Acceptance**

- Confirmation required before opening external URL.  
- Application record created/updated after confirmation.  
- No automated form submission on third-party sites.

### US-APP-002 — Send outreach email
**As a** candidate, **I want** to send an approved outreach email with limits, **so that** I contact recruiters responsibly.

**Priority:** P1 | **FR:** FR-APP-004, FR-AI-010  

### US-APP-003 — LinkedIn share assist
**As a** candidate, **I want** share templates that open LinkedIn’s official share flow, **so that** I increase visibility.

**Priority:** P1 | **FR:** FR-APP-005  

---

## E7 — Tracking

### US-TRK-001 — Application list
**As a** candidate, **I want** to see all applications with status filters, **so that** I manage my pipeline.

**Priority:** P0 | **FR:** FR-TRK-001, FR-TRK-002  

### US-TRK-002 — Update status
**As a** candidate, **I want** to update status and see history, **so that** my pipeline stays current.

**Priority:** P0 | **FR:** FR-TRK-003, FR-TRK-004  

### US-TRK-003 — Notes
**As a** candidate, **I want** notes on applications, **so that** I remember context for follow-ups.

**Priority:** P0 | **FR:** FR-TRK-005  

### US-TRK-004 — Interview calendar
**As a** candidate, **I want** interview times synced to Google Calendar, **so that** I don’t miss interviews.

**Priority:** P1 | **FR:** FR-TRK-006  

---

## E8 — Dashboard & analytics

### US-DASH-001 — Overview
**As a** candidate, **I want** an overview of stats, top matches, and recent activity, **so that** I know what to do next.

**Priority:** P0 | **FR:** FR-DASH-001, FR-DASH-002  

### US-DASH-002 — Pipeline views
**As a** candidate, **I want** views for Interviews / Offers / Rejected, **so that** I focus by outcome stage.

**Priority:** P1 | **FR:** FR-TRK-007, FR-DASH-004  

### US-DASH-003 — Analytics charts
**As a** candidate, **I want** charts of application activity, **so that** I measure consistency.

**Priority:** P1 | **FR:** FR-DASH-003  

### US-DASH-004 — Dark mode
**As a** candidate, **I want** dark/light mode, **so that** the UI is comfortable.

**Priority:** P0 | **FR:** FR-DASH-005  

---

## E9 — Notifications

### US-NOT-001 — In-app notifications
**As a** candidate, **I want** in-app alerts for important events, **so that** I stay informed.

**Priority:** P0 | **FR:** FR-NOT-001  

### US-NOT-002 — Channel preferences
**As a** candidate, **I want** to choose email/Telegram/etc., **so that** I control interruption.

**Priority:** P0 | **FR:** FR-NOT-005  

### US-NOT-003 — Telegram digests
**As a** candidate, **I want** Telegram alerts for new strong matches, **so that** I act quickly.

**Priority:** P1 | **FR:** FR-NOT-003  

---

## E10 — Settings

### US-SET-001 — Job preferences
**As a** candidate, **I want** to set role/location/salary preferences, **so that** discovery/matching improves.

**Priority:** P0 | **FR:** FR-SET-001  

### US-SET-002 — Connect integrations
**As a** candidate, **I want** to connect optional integrations, **so that** notifications/calendar work.

**Priority:** P1 | **FR:** FR-SET-004  

### US-SET-003 — Delete account
**As a** candidate, **I want** to delete my account/data, **so that** I can exercise privacy rights.

**Priority:** P0 | **FR:** FR-SET-005  

---

## E11 — Admin

### US-ADM-001 — Manage users
**As an** admin, **I want** to list/search users, **so that** I can support and govern the platform.

**Priority:** P0 | **FR:** FR-ADM-001  

### US-ADM-002 — Prompt versions
**As an** admin, **I want** to activate/rollback AI prompts, **so that** I control quality safely.

**Priority:** P0 | **FR:** FR-ADM-002  

### US-ADM-003 — Audit logs
**As an** admin, **I want** to view activity/audit logs, **so that** I can investigate issues.

**Priority:** P1 | **FR:** FR-ADM-003  

---

## Story sizing guidance (for later sprints)

| Size | Meaning |
|------|---------|
| S | ≤ 1 day |
| M | 2–3 days |
| L | 4–5 days; consider split |

Sizing is deferred until Phase 4–5 implementation planning.
