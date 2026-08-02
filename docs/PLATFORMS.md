# ApplyAI — Platform Integration Guide

How ApplyAI integrates with LinkedIn, Indeed, and Naukri for Smart Apply and sharing.

---

## Overview

ApplyAI supports three major job platforms:

| Platform | Smart Apply | Share | Job Source |
|----------|-------------|-------|------------|
| **LinkedIn** | ✅ | ✅ | JSearch API + job URLs |
| **Indeed** | ✅ | ❌ | JSearch API + job URLs |
| **Naukri** | ✅ | ❌ | JSearch API + job URLs |

---

## Platform Detection

Automatic detection from job URL or source field:

```typescript
// lib/services/platforms.ts
detectPlatform(url, source)

linkedin.com  → 'linkedin'
indeed.com    → 'indeed'
naukri.com    → 'naukri'
other         → 'other'
```

---

## Smart Apply

### What It Does

1. Detects which platform the job is on
2. Shows platform-specific apply button ("Apply on LinkedIn", etc.)
3. Asks user to confirm
4. Opens the official job posting in browser/app
5. Saves application to Firestore for tracking

### What It Does NOT Do

- Does not auto-fill forms without user action
- Does not use scraping or unauthorized bots
- Does not submit applications without user review

This ensures compliance with platform Terms of Service.

### User Flow

```
Smart Apply Tab
    → Filter by platform (LinkedIn / Indeed / Naukri)
    → Tap "Apply on [Platform]"
    → Confirm dialog
    → Browser opens job page
    → User completes application on platform
    → ApplyAI tracks status in Applications tab
```

### Code Reference

```typescript
import { openSmartApply, detectPlatform } from '@/lib/services/platforms';

const platform = detectPlatform(job.url, job.source);
await openSmartApply({
  job,
  platform,
  resumeUrl: profile.resumeUrl,
  profile,
});
```

---

## LinkedIn Share

### Share Types

| Type | Screen | Description |
|------|--------|-------------|
| Job Share | Job Detail | Share specific job on feed |
| Template Post | /share/linkedin | #OpenToWork, Career Update, etc. |
| Custom Post | /share/linkedin | User-written post |

### Templates

1. **#OpenToWork** — Announce job search with skills
2. **Exploring New Role** — Professional opportunity post
3. **Career Update** — General visibility post

### Technical Implementation

**Web:**
```
https://www.linkedin.com/sharing/share-offsite/?url={jobUrl}
```

**Mobile:**
```
https://www.linkedin.com/feed/?shareActive=true&text={encodedPost}
```

Opens via `Linking.openURL()` or `window.open()`.

### Post Content

Auto-generated from user profile:
- Name
- Skills (top 3–5)
- Job title and company (if sharing a job)
- Hashtags: #OpenToWork #JobSearch #Hiring

---

## Indeed Integration

### Apply Flow

1. Job URL from JSearch typically points to `indeed.com/viewjob?jk=...`
2. Smart Apply opens URL in browser
3. User logs into Indeed if needed
4. User applies with Indeed profile or uploads resume

### Filters

Jobs screen and Smart Apply tab can filter to show only Indeed jobs.

---

## Naukri Integration

### Apply Flow

1. Job URL from JSearch points to `naukri.com/job-listings-...`
2. Smart Apply opens Naukri job page
3. User applies with Naukri profile (common in India)

### Filters

Dedicated Naukri filter chip on Jobs screen.

---

## JSearch API (Job Data)

All three platforms' jobs are fetched via **RapidAPI JSearch**:

```
GET https://jsearch.p.rapidapi.com/search
Headers:
  x-rapidapi-key: {RAPIDAPI_KEY}
  x-rapidapi-host: jsearch.p.rapidapi.com
Query:
  query, page, remote_jobs_only, employment_types
```

Results include jobs from LinkedIn, Indeed, Naukri, and others.

### Caching

- Results cached in Firestore `jobCache` for 1 hour
- Reduces API usage (free tier: 100 requests/month)
- Match scores calculated per user (not cached)

---

## Firebase Configuration for Platforms

### Android (Google Sign-In for LinkedIn OAuth)

| Setting | Value |
|---------|-------|
| Package | `com.applyai.app` |
| SHA-1 (debug) | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| google-services.json | Project root |

### Web Client ID

```
859226958585-ksld13kmkdth9a8jq47go92p1u5oj31n.apps.googleusercontent.com
```

Used for Google Sign-In (can extend to LinkedIn OAuth later).

---

## Future Enhancements

| Feature | Platform | Status |
|---------|----------|--------|
| LinkedIn OAuth API | LinkedIn | Planned |
| Indeed Apply API | Indeed | Requires partnership |
| Naukri API | Naukri | Requires partnership |
| Browser extension | All | Phase 3 |
| Auto-fill forms (with consent) | All | Phase 3 |

---

## Compliance Checklist

- [x] User must confirm before opening job link
- [x] No unauthorized scraping
- [x] No bot auto-submit without user action
- [x] Official job URLs only
- [x] Application tracking with user consent
- [x] Rate limits on email outreach (10/day)

---

*See [FEATURES.md](./FEATURES.md) for user-facing feature descriptions.*
