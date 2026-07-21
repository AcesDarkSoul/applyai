# ApplyAI — Features Documentation

Complete guide to all features in the ApplyAI platform.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Resume Upload & AI Parsing](#2-resume-upload--ai-parsing)
3. [AI Candidate Profile](#3-ai-candidate-profile)
4. [Job Discovery](#4-job-discovery)
5. [AI Job Matching](#5-ai-job-matching)
6. [Smart Apply (LinkedIn, Indeed, Naukri)](#6-smart-apply)
7. [LinkedIn Share](#7-linkedin-share)
8. [Cover Letter Generator](#8-cover-letter-generator)
9. [Recruiter Outreach](#9-recruiter-outreach)
10. [Application Tracking](#10-application-tracking)
11. [Dashboard](#11-dashboard)

---

## 1. Authentication

**Screens:** Login, Sign Up, Forgot Password

| Feature | Details |
|---------|---------|
| Email/Password | Sign up and sign in with email |
| Google Sign-In | Available on Web and Mobile (OAuth) |
| Password Reset | Email link via Firebase Auth |
| Session | Persisted via AsyncStorage (mobile) / browser (web) |
| Auth Guard | Auto-redirect to login if not authenticated |

**User Flow:**
```
Open App → Login/Signup → Dashboard
```

---

## 2. Resume Upload & AI Parsing

**Screen:** Resume Upload (`/resume/upload`)

| Feature | Details |
|---------|---------|
| Formats | PDF, DOCX |
| Max Size | 10 MB |
| Storage | Firebase Storage (`resumes/{userId}/`) |
| AI Parsing | OpenAI GPT-4o-mini via Cloud Function |
| Fallback | Mock parser if Cloud Functions not deployed |

**Extracted Data:**
- Name, email, phone
- Skills array
- Years of experience
- Education history
- Certifications
- Projects
- Languages
- Professional summary
- ATS compatibility score (0–100)

**User Flow:**
```
Profile/Dashboard → Upload Resume → Pick File → Upload & Parse → Profile Updated
```

---

## 3. AI Candidate Profile

**Screen:** Profile (`/(tabs)/profile`)

| Field | Editable | Source |
|-------|----------|--------|
| Name, Email | Yes | Auth / Resume |
| Phone | Yes | Manual / Resume |
| Skills | Yes | AI / Manual |
| Experience | Yes | AI / Manual |
| Education | Yes | AI / Manual |
| Preferred Location | Yes | Manual |
| Expected Salary | Yes | Manual |
| Work Authorization | Yes | Manual |
| Summary | Yes | AI / Manual |
| ATS Score | Read-only | AI |
| Resume | Upload | Storage |

**Profile Completeness:** Calculated as percentage of filled fields (8 fields total).

---

## 4. Job Discovery

**Screen:** Find Jobs (`/(tabs)/jobs`)

| Feature | Details |
|---------|---------|
| Data Source | JSearch API (RapidAPI) via Cloud Function |
| Fallback | Sample jobs if API unavailable |
| Search | By title, company, skills |
| Filters | Platform (LinkedIn/Indeed/Naukri), Remote |
| Cache | 1 hour in Firestore `jobCache` collection |

**Platform Filters:**
- All jobs
- LinkedIn only
- Indeed only
- Naukri only
- Remote only

---

## 5. AI Job Matching

Every job receives a compatibility score:

| Parameter | Weight | Description |
|-----------|--------|-------------|
| Skills | 20% | Match between user skills and job requirements |
| Experience | 20% | Years of experience vs job level |
| Education | 20% | Degree relevance |
| Location | 20% | Remote preference, location match |
| Salary | 20% | Expected vs offered salary |
| **Overall** | 100% | Average of all parameters |

Displayed on job cards and job detail screen with progress bars.

---

## 6. Smart Apply

**Screen:** Smart Apply (`/(tabs)/apply`)

Apply to jobs on **LinkedIn**, **Indeed**, and **Naukri** with one tap.

### How It Works

1. User selects a job from Smart Apply tab
2. App detects platform from job URL (LinkedIn/Indeed/Naukri)
3. User confirms application
4. App opens official job page in browser
5. Application is saved to Firestore
6. User completes form on the platform (user-approved)

### Platform Support

| Platform | Apply | Share | Detection |
|----------|-------|-------|-----------|
| LinkedIn | ✅ | ✅ | URL contains `linkedin.com` |
| Indeed | ✅ | ❌ | URL contains `indeed.com` |
| Naukri | ✅ | ❌ | URL contains `naukri.com` |
| Other | ✅ | ❌ | Generic apply link |

### Important (Compliance)

Smart Apply does **not** use unauthorized bots. It:
- Opens the official job posting
- Requires user confirmation before opening
- Lets the user submit the application manually
- Tracks the application in ApplyAI dashboard

This complies with platform Terms of Service and the ApplyAI PRD requirement for explicit user authorization.

---

## 7. LinkedIn Share

**Screens:** Share on LinkedIn (`/share/linkedin`), Job Detail, Dashboard

### Quick Templates

| Template | Use Case |
|----------|----------|
| #OpenToWork | Announce you're job searching |
| Exploring New Role | Share interest in new opportunities |
| Career Update | General career visibility post |

### Custom Post

User can write and share a custom LinkedIn post.

### Share from Job Detail

When viewing a LinkedIn job, user can share that specific role on their feed.

**Technical:** Uses LinkedIn share URL (`linkedin.com/sharing/share-offsite/` on web).

---

## 8. Cover Letter Generator

**Screen:** Job Detail (`/job/[id]`)

| Feature | Details |
|---------|---------|
| AI Model | GPT-4o-mini |
| Input | User profile + job title, company, description |
| Output | 3–4 paragraph personalized cover letter |
| Storage | Saved to Firestore `coverLetters` collection |
| Cost | ~$0.002 per generation |

---

## 9. Recruiter Outreach

**Screen:** Job Detail (`/job/[id]`)

| Feature | Details |
|---------|---------|
| AI Email | GPT-4o-mini generates subject + body |
| Delivery | SendGrid |
| Rate Limit | 10 emails per user per day |
| Storage | Firestore `outreachEmails` collection |

**User Flow:**
```
Job Detail → Recruiter Outreach → Enter email → Send AI Email
```

---

## 10. Application Tracking

**Screen:** Applied (`/(tabs)/applications`)

### Status Timeline

```
Applied → Viewed → Interview → Offer → Accepted
                                    ↘ Rejected
```

| Status | Color | Description |
|--------|-------|-------------|
| pending | Yellow | Not yet submitted |
| applied | Blue | Application sent |
| viewed | Green | Employer viewed profile |
| interview | Green | Interview scheduled |
| offer | Purple | Offer received |
| accepted | Green | Offer accepted |
| rejected | Red | Application rejected |

Users can withdraw applications from this screen.

---

## 11. Dashboard

**Screen:** Home (`/(tabs)/index`)

| Section | Content |
|---------|---------|
| Hero Banner | Greeting, upload resume CTA, share on LinkedIn |
| Profile Strength | Completeness bar with percentage |
| Stats | Applied, Pending, Interviews, Offers |
| Platform Cards | Quick access to LinkedIn, Indeed, Naukri Smart Apply |
| Top Matches | Top 3 recommended jobs |
| Recent Activity | Last 3 applications |

---

## Screen Map

```
App
├── (auth)
│   ├── login
│   ├── signup
│   └── forgot-password
├── (tabs)
│   ├── index          → Home / Dashboard
│   ├── jobs           → Find Jobs
│   ├── apply          → Smart Apply
│   ├── applications   → Applied Jobs
│   └── profile        → User Profile
├── job/[id]           → Job Detail
├── share/linkedin     → LinkedIn Share
└── resume/upload      → Upload Resume
```

---

## Feature Dependencies

| Feature | Requires |
|---------|----------|
| AI Resume Parsing | OpenAI API key + Cloud Functions deployed |
| Real Job Search | RapidAPI JSearch key + Cloud Functions |
| Cover Letter | OpenAI API key + Cloud Functions |
| Recruiter Email | SendGrid + OpenAI + Cloud Functions |
| Smart Apply | Works offline with sample jobs |
| LinkedIn Share | Works without backend (URL-based) |
| Auth | Firebase project configured |

---

*See [SETUP.md](./SETUP.md) for configuration steps.*
