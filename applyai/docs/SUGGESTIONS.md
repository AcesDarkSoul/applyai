# ApplyAI — Product Suggestions

**Date:** 2026-08-10  
**Based on:** PRD (v1.0), `FEATURES.md`, `README.md`, `PROJECT_STATE.md`  
**Purpose:** Prioritized ideas to grow ApplyAI from a job-apply helper into a full AI career assistant.

---

## 1. Ship next (highest impact)

| # | Suggestion | Why | PRD / roadmap link |
|---|------------|-----|--------------------|
| 1 | Push + email notifications for new high-match jobs, interview updates, weekly summary | Keeps users returning; core retention loop | Module 10; Phase 2 |
| 2 | Resume tailored per job (ATS-optimized variants from JD + resume) | Cover letters alone are not enough for ATS | Module 6 |
| 3 | Skill-gap analysis + short learning roadmap after match score | Positions ApplyAI as a career coach, not only an apply tool | Module 11 |
| 4 | Application status auto-sync (reduce manual timeline edits) | Dashboard value depends on accurate status | Module 9; Phase 2 |
| 5 | Stronger consent UX for Smart Apply (per-platform toggle, confirm, audit log) | Matches assistive-only policy (AD-002) and compliance | Risks & Compliance |

---

## 2. Product / UX

| # | Suggestion | Notes |
|---|------------|--------|
| 6 | Onboarding checklist | Signup → Upload resume → Complete profile → First match → First apply — **shipped** on Home |
| 7 | Match score breakdown UI | Tap overall score → Skills / Experience / Education / Location / Salary — **shipped** |
| 8 | Profile completeness nudges | e.g. “Add expected salary to improve matches” — **shipped** |
| 9 | Job save / shortlist | Save for later without applying — **shipped** (Jobs → Saved filter) |
| 10 | Duplicate-apply guard | Warn if already applied to same job or company — **shipped** |

---

## 3. Differentiation (career assistant, not auto-bot)

| # | Suggestion | Notes |
|---|------------|--------|
| 11 | AI interview coach | Role-specific mock Q&A from JD + resume (Phase 3) |
| 12 | Salary guidance | Band estimate by role/location vs user expectation |
| 13 | Recruiter outreach sequencing | Draft → schedule follow-up → track replies (Module 8) |
| 14 | Weekly AI coach digest | “3 jobs to prioritize, 1 profile fix, 1 outreach draft” |

---

## 4. Platforms & growth

| # | Suggestion | Notes |
|---|------------|--------|
| 15 | LinkedIn OAuth | Deeper profile sync and safer share/apply flows |
| 16 | Browser extension | One-click assist on LinkedIn / Indeed / Naukri (Phase 3) |
| 17 | Stronger India-friendly sources | Deepen Naukri; consider company career pages |
| 18 | Shareable success stories | Interview/offer wins for referrals (privacy-safe) |

---

## 5. Monetization (supports ~10% paid conversion goal)

| Tier | Include |
|------|---------|
| **Free** | Resume parse, limited matches, basic application tracking |
| **Pro** | Unlimited tailored resumes/cover letters, outreach, AI coach, priority matching |
| **Usage caps** | e.g. outreach daily limit (pattern already used: 10/day) |

---

## 6. Technical / quality

| # | Suggestion | Notes |
|---|------------|--------|
| 19 | Finish Phase 3 technology decisions | Then harden production auth (Firebase ID tokens, not demo Bearer) |
| 20 | Full Firestore persistence | Move off in-memory repositories |
| 21 | Tests before heavy automation | Unit + integration + e2e |
| 22 | User-approved apply only | Never silent auto-submit on third-party job sites |

---

## 7. Future (PRD §15)

- AI voice interview prep
- Multi-language resume support
- Portfolio website generator & GitHub profile analysis
- LinkedIn profile optimization & referral matching
- AI networking & salary negotiation assistants
- Enterprise university and recruitment partnerships

---

## Suggested build order

### This month
1. Notifications (push + email)
2. Per-job resume customization
3. Match score breakdown + profile nudges
4. Consent / audit improvements for Smart Apply

### Next 1–2 months
5. Skill-gap + learning roadmap
6. Status auto-update
7. Save/shortlist + duplicate-apply guard
8. Outreach follow-up sequencing

### Later
9. Interview coach + salary guidance
10. LinkedIn OAuth + browser extension
11. Monetization (Free / Pro) and weekly coach digest

---

## Related docs

- [FEATURES.md](./FEATURES.md) — current feature set
- [PLATFORMS.md](./PLATFORMS.md) — LinkedIn, Indeed, Naukri
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- Root PRD: `PRD_ AI Job Application Automation Platform (ApplyAI).pdf`
- Root state: `PROJECT_STATE.md`
