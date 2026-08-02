# Future Scope — AI Job Agent

**Document ID:** FUTURE-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02  

---

## 1. Purpose

Capture post-v1 opportunities without expanding the current delivery boundary. Items here are **candidates**, not commitments.

---

## 2. Horizon roadmap

### Horizon A — Near-term (after v1 stabilization)

| Item | Value | Depends on |
|------|-------|------------|
| Push notifications (mobile/web) | Faster engagement on new matches | Client platform decision |
| Application status auto-suggestions | Less manual pipeline upkeep | Email parsing / user confirmations |
| Weekly email/Telegram summary digests | Retention | Automation (n8n) maturity |
| Resume templates library | Faster tailoring | Prompt + document export |
| Browser extension (assistive only) | Faster apply from job pages | Security review |
| Slack notifications GA | Team/coach workflows | Slack app approval |
| Rich analytics cohort views | Product insights | Event pipeline |

### Horizon B — Mid-term

| Item | Value | Notes |
|------|-------|-------|
| AI interview coach (mock interviews) | Preparation depth | Voice optional later |
| LinkedIn official OAuth API integrations | Better share/profile sync | Must stay within LinkedIn policies |
| Multi-resume targeting by persona (e.g., SWE vs Data) | Better match quality | UX complexity |
| Chrome/Edge extension + web dual clients | Coverage | Shared API backend |
| Org/team workspaces (career coaches) | B2B | Multi-tenancy, billing |
| Subscription billing (Stripe) | Monetization | Entitlements, quotas UI |
| Advanced skill-gap learning paths | Outcomes | Partner content APIs |

### Horizon C — Long-term

| Item | Value | Notes |
|------|-------|-------|
| Employer/recruiter portal | Two-sided marketplace | Major product shift |
| Internal ranking models fine-tuned on consented data | Differentiation | Privacy + MLOps |
| Autonomous agents with user-in-the-loop approvals | Scale outreach safely | Strict policy engine |
| Regional localization (i18n) + data residency modes | Global markets | Compliance program |
| Credibility signals (verified projects, assessments) | Trust | Proctoring partners |

---

## 3. Explicitly deferred risky ideas

These require legal/product approval before design:

1. Automated form filling on third-party career sites  
2. Credential sharing / storing employer portal passwords  
3. Mass unsolicited recruiter messaging  
4. Scraping behind logins  

Default stance: **assistive, transparent, user-authorized**.

---

## 4. Alignment with existing ApplyAI roadmap

From `applyai/README.md` planned phases:

| ApplyAI planned item | Future horizon mapping |
|----------------------|------------------------|
| Push notifications | Horizon A |
| Resume/cover letter templates | Horizon A |
| Application status auto-update | Horizon A |
| Weekly summary emails | Horizon A |
| AI interview coach | Horizon B |
| Browser extension | Horizon A/B |
| LinkedIn OAuth API | Horizon B |

---

## 5. Intake process for future items

1. Write a one-page problem statement  
2. Map risks (ToS, privacy, cost)  
3. Estimate cost (AI tokens, eng weeks)  
4. Priority vs v1 success metrics  
5. Promote to a numbered FR/US only after approval  

---

## 6. Success metrics to guide prioritization (post-v1)

| Metric | Why it matters |
|--------|----------------|
| Weekly active applicants | Engagement |
| Median time resume → first Smart Apply | Activation |
| Cover letter accept/edit rate | AI usefulness |
| Applications moved to Interview | Outcome proxy |
| AI cost per active user | Unit economics |
| Support tickets per 100 users | Quality |
