# ApplyAI — Database Schema & API Reference

Complete documentation of all Firestore collections, Storage structure, Cloud Functions, and external APIs.

---

## Table of Contents

- [Firestore Collections](#firestore-collections)
- [Firebase Storage Structure](#firebase-storage-structure)
- [Cloud Functions API](#cloud-functions-api)
- [External APIs](#external-apis)
- [Security Rules](#security-rules)
- [Indexes](#indexes)
- [Cost Estimation](#cost-estimation)

---

## Firestore Collections

### `users` Collection

Stores user profiles. One document per user, document ID = Firebase Auth UID.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `name` | string | Yes | Full name |
| `phone` | string | No | Phone number |
| `skills` | string[] | Yes | List of skills (e.g., `["React", "Python"]`) |
| `experience` | number | Yes | Years of work experience |
| `education` | Education[] | Yes | Array of education entries |
| `certifications` | string[] | Yes | List of certifications |
| `projects` | Project[] | Yes | Array of projects |
| `languages` | string[] | Yes | Spoken/written languages |
| `preferredLocation` | string | Yes | Preferred work location |
| `expectedSalary` | string | No | Expected salary (e.g., `"18 LPA"`) |
| `workAuthorization` | string | No | Work authorization country |
| `atsScore` | number | No | ATS compatibility score (0-100) |
| `resumeUrl` | string | No | Firebase Storage download URL |
| `resumeFileName` | string | No | Original resume file name |
| `summary` | string | No | Professional summary (AI-generated or manual) |
| `createdAt` | timestamp | Yes | Account creation time |
| `updatedAt` | timestamp | Yes | Last profile update time |

**Education sub-object:**

| Field | Type | Description |
|-------|------|-------------|
| `institution` | string | University/school name |
| `degree` | string | Degree type (e.g., `"Bachelor of Science"`) |
| `field` | string | Field of study (e.g., `"Computer Science"`) |
| `startYear` | number | Start year |
| `endYear` | number \| null | End year (null if currently studying) |

**Project sub-object:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Project name |
| `description` | string | One-sentence description |
| `technologies` | string[] | Technologies used |

**Example document:**
```json
{
  "email": "user@example.com",
  "name": "Sagar Kumar",
  "skills": ["React", "TypeScript", "Node.js", "Python", "AWS"],
  "experience": 3,
  "education": [
    {
      "institution": "IIT Delhi",
      "degree": "Bachelor of Technology",
      "field": "Computer Science",
      "startYear": 2018,
      "endYear": 2022
    }
  ],
  "certifications": ["AWS Cloud Practitioner"],
  "projects": [
    {
      "name": "E-Commerce Platform",
      "description": "Full-stack web app with React and Node.js",
      "technologies": ["React", "Node.js", "MongoDB"]
    }
  ],
  "languages": ["English", "Hindi"],
  "preferredLocation": "Remote",
  "expectedSalary": "18 LPA",
  "workAuthorization": "India",
  "atsScore": 82,
  "resumeUrl": "https://firebasestorage.googleapis.com/...",
  "resumeFileName": "sagar_resume.pdf",
  "summary": "Experienced full-stack developer with expertise in React and cloud technologies.",
  "createdAt": "2026-07-21T08:00:00Z",
  "updatedAt": "2026-07-21T09:30:00Z"
}
```

---

### `applications` Collection

Tracks job applications. One document per application.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | Firebase Auth UID of the applicant |
| `jobId` | string | Yes | Job ID (from JSearch or sample data) |
| `jobTitle` | string | Yes | Job title |
| `company` | string | Yes | Company name |
| `status` | string | Yes | Application status (see below) |
| `matchScore` | number | Yes | AI match score at time of application (0-100) |
| `appliedAt` | timestamp | Yes | When the application was submitted |
| `updatedAt` | timestamp | Yes | Last status update |
| `notes` | string | No | User notes |

**Status values:** `pending` → `applied` → `viewed` → `interview` → `offer` → `accepted` / `rejected`

---

### `coverLetters` Collection

AI-generated cover letters. Written by Cloud Functions only.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |
| `jobTitle` | string | Target job title |
| `company` | string | Target company |
| `content` | string | Full cover letter text |
| `createdAt` | timestamp | Generation time |

---

### `outreachEmails` Collection

Recruiter outreach emails sent via SendGrid. Written by Cloud Functions only.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Firebase Auth UID |
| `recruiterEmail` | string | Recipient email |
| `recruiterName` | string \| null | Recipient name |
| `jobTitle` | string | Related job title |
| `company` | string | Related company |
| `subject` | string | Email subject line |
| `body` | string | Email body text |
| `status` | string | `"sent"` or `"failed"` |
| `sentAt` | timestamp | When the email was sent |

---

### `jobCache` Collection

Server-side cache of JSearch API results. Managed by Cloud Functions only (no client access).

| Field | Type | Description |
|-------|------|-------------|
| `jobs` | object[] | Array of job objects (without matchScore) |
| `query` | string | Cache key (search query + filters) |
| `cachedAt` | timestamp | When the cache was created |

**Cache TTL:** 1 hour. After 1 hour, the next request fetches fresh data from JSearch.

---

## Firebase Storage Structure

```
resumes/
└── {userId}/
    └── {timestamp}_{filename}.pdf
```

| Constraint | Value |
|-----------|-------|
| Max file size | 10 MB |
| Allowed types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Access | Owner only (read/write/delete) |
| Path pattern | `resumes/{userId}/{timestamp}_{originalName}` |

---

## Cloud Functions API

All functions use `httpsCallable` (Firebase callable functions). They require a valid Firebase Auth token.

### `parseResume`

Parses an uploaded resume using OpenAI GPT-4o-mini and updates the user profile in Firestore.

**Input:**
```json
{
  "resumeUrl": "https://firebasestorage.googleapis.com/..."
}
```

**Output:**
```json
{
  "success": true,
  "profile": {
    "skills": ["React", "Python", "AWS"],
    "experience": 3,
    "education": [...],
    "certifications": [...],
    "projects": [...],
    "languages": ["English", "Hindi"],
    "summary": "...",
    "atsScore": 82
  }
}
```

**Security:** Verifies the resume URL belongs to the calling user's storage path.

**Cost:** ~$0.001 per call (GPT-4o-mini, ~2K tokens)

---

### `searchJobs`

Searches for jobs via JSearch API. Results are cached in Firestore for 1 hour.

**Input:**
```json
{
  "query": "react developer",
  "page": 1,
  "remote": true,
  "employmentType": "full-time"
}
```

**Output:**
```json
{
  "jobs": [
    {
      "id": "abc123",
      "title": "Senior React Developer",
      "company": "TechCorp",
      "location": "Bangalore, India",
      "salary": "INR 1,800,000 - 2,500,000",
      "employmentType": "full-time",
      "remote": true,
      "description": "...",
      "skills": ["React", "TypeScript"],
      "url": "https://...",
      "source": "JSearch",
      "postedAt": "2026-07-20T...",
      "matchScore": {
        "overall": 87,
        "skills": 95,
        "experience": 80,
        "education": 75,
        "location": 100,
        "salary": 85
      }
    }
  ],
  "fromCache": false
}
```

**Cost:** 1 JSearch API call per unique query (cached for 1 hour). Free tier = 100/month.

---

### `getRecommendedJobs`

Auto-generates a search query from the user's skills and returns matching jobs.

**Input:** None (reads from user profile in Firestore)

**Output:** Same as `searchJobs`

---

### `generateCoverLetter`

Generates a personalized cover letter using OpenAI.

**Input:**
```json
{
  "jobTitle": "Senior React Developer",
  "company": "TechCorp",
  "jobDescription": "We are looking for..."
}
```

**Output:**
```json
{
  "id": "firestore_doc_id",
  "content": "Dear Hiring Manager,\n\nI am excited to apply for the Senior React Developer position at TechCorp..."
}
```

**Cost:** ~$0.002 per call (GPT-4o-mini, ~1K tokens)

---

### `sendOutreachEmail`

Generates an outreach email with OpenAI and sends it via SendGrid.

**Input:**
```json
{
  "recruiterEmail": "recruiter@techcorp.com",
  "recruiterName": "Jane Smith",
  "jobTitle": "Senior React Developer",
  "company": "TechCorp"
}
```

**Output:**
```json
{
  "id": "firestore_doc_id",
  "subject": "Interest in Senior React Developer Role at TechCorp",
  "body": "Hi Jane,\n\nI came across the Senior React Developer position..."
}
```

**Rate limit:** 10 emails per user per day.

**Cost:** ~$0.001 (OpenAI) + 1 SendGrid email (free tier: 100/day)

---

## External APIs

### OpenAI API

| Detail | Value |
|--------|-------|
| **Endpoint** | `https://api.openai.com/v1/chat/completions` |
| **Model** | `gpt-4o-mini` |
| **Used for** | Resume parsing, cover letter generation, email outreach |
| **Auth** | API key (stored as Firebase Secret) |
| **Pricing** | Input: $0.15/1M tokens, Output: $0.60/1M tokens |
| **Rate limits** | Tier 1: 500 RPM, 200K TPM |
| **Sign up** | [platform.openai.com](https://platform.openai.com) |

### RapidAPI JSearch

| Detail | Value |
|--------|-------|
| **Endpoint** | `https://jsearch.p.rapidapi.com/search` |
| **Used for** | Real job listings search |
| **Auth** | `x-rapidapi-key` header (stored as Firebase Secret) |
| **Free tier** | 100 requests/month |
| **Paid** | $30/month (10K requests) |
| **Sign up** | [rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |
| **Caching** | Results cached in Firestore for 1 hour to reduce API calls |

### SendGrid

| Detail | Value |
|--------|-------|
| **Endpoint** | SendGrid v3 Mail Send API |
| **Used for** | Sending recruiter outreach emails |
| **Auth** | API key (stored as Firebase Secret) |
| **Free tier** | 100 emails/day |
| **Paid** | $19.95/month (50K emails) |
| **Sign up** | [sendgrid.com](https://sendgrid.com) |
| **Requirement** | Must verify sender email address |

---

## Security Rules

### Firestore Rules Summary

```
users/{userId}        → Read/Write: owner only
applications/{id}     → Read/Write: owner only (via userId field)
coverLetters/{id}     → Read: owner only, Write: Cloud Functions only
outreachEmails/{id}   → Read: owner only, Write: Cloud Functions only
jobCache/{id}         → Read/Write: Cloud Functions only (admin SDK)
everything else       → Denied
```

### Storage Rules Summary

```
resumes/{userId}/*    → Read/Write/Delete: owner only
                        Max size: 10 MB
                        Content type: PDF or DOCX only
everything else       → Denied
```

---

## Indexes

Composite indexes required for Firestore queries:

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `applications` | `userId` (ASC), `updatedAt` (DESC) | List user's applications sorted by recent |
| `coverLetters` | `userId` (ASC), `createdAt` (DESC) | List user's cover letters sorted by recent |
| `outreachEmails` | `userId` (ASC), `sentAt` (DESC) | List user's outreach emails sorted by recent |

These are defined in `firebase/firestore.indexes.json` and deployed automatically with `firebase deploy --only firestore`.

---

## Cost Estimation Details

### Per-Action Cost Breakdown

| Action | Firestore Reads | Firestore Writes | OpenAI Tokens | JSearch Calls | SendGrid Emails |
|--------|----------------|-----------------|---------------|--------------|----------------|
| Sign up | 1 | 1 | 0 | 0 | 0 |
| Login | 0 | 0 | 0 | 0 | 0 |
| Upload resume | 0 | 1 | 0 | 0 | 0 |
| Parse resume (AI) | 1 | 1 | ~2,000 | 0 | 0 |
| Search jobs | 2 | 0-1 (cache) | 0 | 0-1 (cached) | 0 |
| View job detail | 0 | 0 | 0 | 0 | 0 |
| Apply to job | 1 | 1 | 0 | 0 | 0 |
| Generate cover letter | 1 | 1 | ~1,500 | 0 | 0 |
| Send outreach email | 2 | 1 | ~800 | 0 | 1 |
| View dashboard | 2 | 0 | 0 | 0 | 0 |
| View applications | 1 | 0 | 0 | 0 | 0 |

### Monthly Estimate for 1,000 Active Users

Assuming each user: searches 20 times, parses 2 resumes, applies 10 times, generates 5 cover letters, sends 3 emails:

| Resource | Usage | Free Tier | Overage Cost |
|----------|-------|-----------|-------------|
| Firestore reads | ~80K | 50K/day (1.5M/month) | $0 |
| Firestore writes | ~25K | 20K/day (600K/month) | $0 |
| Storage | ~1 GB | 5 GB | $0 |
| OpenAI tokens | ~8M input, ~4M output | — | ~$3.60 |
| JSearch calls | ~200 (cached) | 100/month | ~$0 or $30 |
| SendGrid emails | ~3,000 | 3,000/month | $0 |
| **Total** | | | **$3.60 - $33.60/month** |

---

## Troubleshooting

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing or insufficient permissions` | Firestore rules not deployed | Run `firebase deploy --only firestore` |
| `CORS policy` on storage uploads | Storage bucket CORS not set | Run `gsutil cors set cors.json gs://...` |
| `Cloud Function not found` | Functions not deployed | Run `firebase deploy --only functions` |
| `OpenAI API key not configured` | Secret not set | Run `firebase functions:secrets:set OPENAI_API_KEY` |
| `JSearch API error: 403` | Invalid or expired RapidAPI key | Check key at [rapidapi.com](https://rapidapi.com) |
| `Daily email limit reached` | User sent 10+ emails today | Wait until tomorrow (rate limit resets) |
| `Cross-Origin-Opener-Policy` warnings | Expo dev server hot reload | Ignore — harmless in development |
