# Use Cases — AI Job Agent

**Document ID:** UC-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02  

---

## Use case index

| ID | Name | Primary actor | Priority |
|----|------|---------------|----------|
| UC-01 | Register Account | Candidate | P0 |
| UC-02 | Authenticate Session | Candidate | P0 |
| UC-03 | Upload & Parse Resume | Candidate | P0 |
| UC-04 | Maintain Profile | Candidate | P0 |
| UC-05 | Discover Jobs | Candidate | P0 |
| UC-06 | Evaluate Job Match | Candidate | P0 |
| UC-07 | Generate Cover Letter | Candidate | P0 |
| UC-08 | Generate Outreach Email | Candidate | P1 |
| UC-09 | Smart Apply to Job | Candidate | P0 |
| UC-10 | Track Application Pipeline | Candidate | P0 |
| UC-11 | Use Candidate Dashboard | Candidate | P0 |
| UC-12 | Administer Prompts & Users | Admin | P0 |
| UC-13 | Receive Notifications | Candidate / System | P0/P1 |
| UC-14 | Run Scheduled Job Digest | System / n8n | P1 |

---

## UC-01 — Register Account

| Field | Detail |
|-------|--------|
| **Goal** | Create a new candidate account |
| **Preconditions** | User is not authenticated; email not registered |
| **Trigger** | User submits signup form |
| **Main success** | 1) Validate input 2) Create auth user 3) Create user profile doc 4) Redirect to onboarding/dashboard |
| **Extensions** | Weak password → validation error; email exists → conflict error |
| **Postconditions** | User exists in Auth + Firestore; session established |
| **FR** | FR-AUTH-001 |

---

## UC-02 — Authenticate Session

| Field | Detail |
|-------|--------|
| **Goal** | Establish authenticated session |
| **Preconditions** | Account exists |
| **Trigger** | Login submit or OAuth callback |
| **Main success** | Verify credentials → issue/obtain token → load profile → enter app |
| **Extensions** | Wrong password; disabled account; OAuth cancel |
| **Postconditions** | Protected routes accessible |
| **FR** | FR-AUTH-002, FR-AUTH-004, FR-AUTH-005 |

---

## UC-03 — Upload & Parse Resume

| Field | Detail |
|-------|--------|
| **Goal** | Store resume and extract structured profile |
| **Preconditions** | User authenticated |
| **Trigger** | User selects file and confirms upload |
| **Main success** | Validate file → store → invoke AI parse → update profile/resume record → show ATS score |
| **Extensions** | Unsupported type; too large; AI timeout → retry/fallback message |
| **Postconditions** | Resume metadata stored; profile fields updated; activity logged |
| **FR** | FR-RES-001 … 006 |

**Activity (happy path)**

```
User → UI: select PDF/DOCX
UI → API: upload
API → Storage: save object
API → AI: parse content
AI → API: structured JSON + ATS score
API → DB: upsert resume + profile
API → UI: success + editable fields
```

---

## UC-04 — Maintain Profile

| Field | Detail |
|-------|--------|
| **Goal** | Keep candidate profile accurate |
| **Preconditions** | Profile exists |
| **Trigger** | User edits and saves profile/preferences |
| **Main success** | Validate → persist → recompute completeness → confirm |
| **Postconditions** | Profile updated; match inputs refreshed |
| **FR** | FR-RES-004, FR-RES-005, FR-SET-001 |

---

## UC-05 — Discover Jobs

| Field | Detail |
|-------|--------|
| **Goal** | Find relevant job postings |
| **Preconditions** | User authenticated; provider configured or mock mode |
| **Trigger** | Search/filter or Today’s Jobs open |
| **Main success** | Query cache/provider → normalize jobs → attach match scores → render list |
| **Extensions** | Provider outage → cached/sample + warning |
| **Postconditions** | Optional cache write; search analytics event |
| **FR** | FR-JOB-001 … 007 |

---

## UC-06 — Evaluate Job Match

| Field | Detail |
|-------|--------|
| **Goal** | Understand fit for a specific job |
| **Preconditions** | Profile sufficiently complete; job loaded |
| **Trigger** | Open job detail / request analysis |
| **Main success** | Compute weighted score → show breakdown → optional AI rationale/skill gaps |
| **Postconditions** | Score available in UI; optional saved insight |
| **FR** | FR-MATCH-001 … 005 |

---

## UC-07 — Generate Cover Letter

| Field | Detail |
|-------|--------|
| **Goal** | Produce editable cover letter for a job |
| **Preconditions** | User authenticated; job + profile available; AI quota remaining |
| **Trigger** | User clicks Generate Cover Letter |
| **Main success** | Load active prompt version → call LLM → return draft → user edits → save |
| **Extensions** | Quota exceeded; model error |
| **Postconditions** | Cover letter stored; AI usage counted; labeled AI-assisted |
| **FR** | FR-AI-001, FR-AI-002, FR-AI-003, FR-AI-009, FR-AI-010 |

---

## UC-08 — Generate Outreach Email

| Field | Detail |
|-------|--------|
| **Goal** | Draft (and optionally send) recruiter email |
| **Preconditions** | Job selected; email channel configured for send path |
| **Trigger** | User requests outreach draft/send |
| **Main success** | Generate subject/body → user reviews → optional send via provider → log |
| **Extensions** | Daily send limit; invalid recipient; provider failure |
| **Postconditions** | Outreach record saved; notification optional |
| **FR** | FR-AI-004, FR-APP-004 |

---

## UC-09 — Smart Apply to Job

| Field | Detail |
|-------|--------|
| **Goal** | Assist user in applying via official channel while tracking locally |
| **Preconditions** | Job has apply/source URL |
| **Trigger** | User clicks Smart Apply |
| **Main success** | Show confirmation → open official URL → create/update Application as Applied (or Pending→Applied per rules) → show success |
| **Extensions** | User cancels confirmation → no record change (or keep Saved) |
| **Postconditions** | Application exists with timeline entry; **no** automated third-party form submit |
| **FR** | FR-APP-001 … 003, FR-APP-006 |

**Compliance note:** This use case is intentionally assistive. Expanding to automated form-fill requires explicit legal/product approval and is out of default v1 scope.

---

## UC-10 — Track Application Pipeline

| Field | Detail |
|-------|--------|
| **Goal** | Maintain application statuses and notes |
| **Preconditions** | Applications exist |
| **Trigger** | User opens Applications / updates status |
| **Main success** | List/filter → update status → append timeline → optional interview date |
| **Postconditions** | Status history immutable append; dashboard stats refresh |
| **FR** | FR-TRK-001 … 007 |

---

## UC-11 — Use Candidate Dashboard

| Field | Detail |
|-------|--------|
| **Goal** | Provide daily command center |
| **Preconditions** | Authenticated |
| **Trigger** | Open Overview |
| **Main success** | Aggregate stats, top matches, recent activity, CTAs (upload resume / today’s jobs) |
| **Postconditions** | None required beyond read models |
| **FR** | FR-DASH-001 … 006 |

---

## UC-12 — Administer Prompts & Users

| Field | Detail |
|-------|--------|
| **Goal** | Govern AI quality and user support |
| **Preconditions** | Actor has `admin` role |
| **Trigger** | Admin opens admin dashboard |
| **Main success** | List users; create/activate prompt version; view logs |
| **Extensions** | Non-admin → 403 |
| **Postconditions** | Prompt activation audited |
| **FR** | FR-ADM-001 … 005 |

---

## UC-13 — Receive Notifications

| Field | Detail |
|-------|--------|
| **Goal** | Inform user of important events |
| **Preconditions** | Preferences allow channel |
| **Trigger** | Domain event (new high match, interview reminder, etc.) |
| **Main success** | Create in-app notification → fan-out to enabled channels |
| **Extensions** | Channel misconfigured → in-app only + warning in settings |
| **FR** | FR-NOT-001 … 006 |

---

## UC-14 — Run Scheduled Job Digest

| Field | Detail |
|-------|--------|
| **Goal** | Periodically refresh jobs and notify about strong matches |
| **Preconditions** | Automation enabled; credentials present |
| **Trigger** | Cron / n8n schedule |
| **Main success** | Fetch jobs → score users (batch rules) → write notifications → log run |
| **Extensions** | Partial failure → retry failed branch; alert ops |
| **FR** | FR-AUTO-001 … 004 |

---

## Cross-cutting alternate flows (all UCs)

1. **Unauthenticated API call** → 401  
2. **Forbidden role** → 403  
3. **Validation failure** → 400 with field errors  
4. **Rate limited** → 429 with retry guidance  
5. **Dependency down** → 503 / degraded mode message  
