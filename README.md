# ApplyAI — AI Job Application Automation Platform

> Cross-platform React Native app (iOS, Android, Web) that automates job search, resume optimization, and application tracking — powered by Firebase and AI.

📚 **[Full Documentation →](./docs/INDEX.md)**

---

## Table of Contents

- [Features](#features)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Cost Breakdown](#cost-breakdown)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Security](#security)
- [Roadmap](#roadmap)

---

## Features

### Implemented (v1.0)

| Module | Description |
|--------|-------------|
| Authentication | Email/password, Google sign-in, password reset |
| Resume Upload | PDF/DOCX upload (10 MB max) to Firebase Storage |
| AI Resume Parsing | GPT-4o-mini extracts skills, experience, education, ATS score |
| AI Candidate Profile | Editable profile with ATS score and completeness meter |
| Job Discovery | JSearch API jobs with LinkedIn, Indeed, Naukri filters |
| AI Job Matching | Compatibility score (skills, experience, education, location, salary) |
| **Smart Apply** | One-tap apply on LinkedIn, Indeed, Naukri |
| **LinkedIn Share** | Post templates (#OpenToWork) and custom career updates |
| Cover Letter Generator | AI-personalized cover letters per job |
| Recruiter Outreach | AI emails via SendGrid (10/day limit) |
| Application Tracking | Timeline: Applied → Viewed → Interview → Offer → Accepted |
| Dashboard | Stats, platform cards, top matches, recent activity |
| **Modern UI** | Yellow, green, white theme with animations, responsive design |

### Phase 2 (Planned)

- Push notifications for new matching jobs
- Resume/cover letter templates
- Application status auto-update
- Weekly summary emails

### Phase 3 (Planned)

- AI interview coach
- Browser extension for one-click apply
- LinkedIn OAuth API integration

---

## Documentation

All documentation is in the [`docs/`](./docs/) folder:

| Document | Description |
|----------|-------------|
| [INDEX.md](./docs/INDEX.md) | Documentation home & quick links |
| [FEATURES.md](./docs/FEATURES.md) | All features with user flows |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture & data flow |
| [DATABASE.md](./docs/DATABASE.md) | Firestore schema, APIs, costs |
| [UI_GUIDE.md](./docs/UI_GUIDE.md) | Design system (yellow/green/white) |
| [PLATFORMS.md](./docs/PLATFORMS.md) | LinkedIn, Indeed, Naukri integration |
| [SETUP.md](./docs/SETUP.md) | Complete setup guide |

---

## Tech Stack

### Client App

| Technology | Purpose | Version |
|-----------|---------|---------|
| Expo (React Native) | Cross-platform mobile + web framework | SDK 57 |
| React | UI library | 19.2.3 |
| TypeScript | Type safety | 6.0 |
| Expo Router | File-based routing | 57.0.7 |
| Zustand | State management | 5.0 |
| expo-linear-gradient | UI gradients | 57.0 |
| date-fns | Date formatting | 4.4 |
| expo-document-picker | Resume file picker | 57.0 |
| expo-auth-session | Google OAuth | 57.0 |

### Backend (Firebase Cloud Functions)

| Technology | Purpose | Version |
|-----------|---------|---------|
| Firebase Cloud Functions | Serverless backend | v2 (6.3) |
| Firebase Admin SDK | Server-side Firestore/Storage access | 13.0 |
| OpenAI SDK | Resume parsing, cover letters, email generation | 4.80 |
| @sendgrid/mail | Email delivery | 8.1 |
| Node.js | Runtime | 20 |

### Firebase Services

| Service | Purpose |
|---------|---------|
| Firebase Authentication | User login/signup (email + Google) |
| Cloud Firestore | Database for users, applications, cover letters, emails, job cache |
| Firebase Storage | Resume file storage (PDF/DOCX) |
| Firebase Cloud Functions | Server-side API calls (OpenAI, JSearch, SendGrid) |
| Firebase Hosting | Web app hosting (optional) |

---

## Cost Breakdown

### Firebase (Spark Free Plan)

| Service | Free Tier Limit | Enough For |
|---------|----------------|------------|
| Authentication | 50,000 MAU | ~50K monthly active users |
| Firestore reads | 50,000/day | ~500 active users/day |
| Firestore writes | 20,000/day | ~200 applications/day |
| Firestore storage | 1 GB | ~10K user profiles |
| Firebase Storage | 5 GB | ~5,000 resumes (1 MB avg) |
| Cloud Functions invocations | 2M/month | ~66K function calls/day |
| Cloud Functions compute | 400K GB-seconds/month | Sufficient for MVP |
| Hosting | 10 GB transfer/month | ~10K web visits/day |

### External APIs

| API | Free Tier | Cost After Free Tier | Monthly Estimate (1K users) |
|-----|-----------|---------------------|---------------------------|
| OpenAI GPT-4o-mini | $5 credit (new accounts) | ~$0.15/1M input tokens, ~$0.60/1M output tokens | ~$2-5/month |
| RapidAPI JSearch | 100 requests/month | $30/month (10K requests) | $0 (free tier) to $30 |
| SendGrid | 100 emails/day (3K/month) | $19.95/month (50K emails) | $0 (free tier) |

### Total Estimated Monthly Cost

| Scale | Firebase | OpenAI | JSearch | SendGrid | Total |
|-------|---------|--------|---------|----------|-------|
| 0-100 users | $0 | $0-1 | $0 | $0 | **$0-1/month** |
| 100-1K users | $0 | $2-5 | $0 | $0 | **$2-5/month** |
| 1K-10K users | $25 (Blaze) | $10-25 | $30 | $0 | **$65-80/month** |
| 10K-50K users | $50-100 | $50-100 | $30-100 | $20 | **$150-320/month** |

> **Note:** Firebase Blaze plan is pay-as-you-go with the same free tier included. You only pay for usage beyond free limits.

---

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org))
- **npm** 9+ (comes with Node.js)
- **Expo CLI** (`npx expo` — no global install needed)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Android Studio** (for Android builds) or **Xcode** (for iOS, macOS only)
- **Google Cloud SDK** (optional, for `gsutil` CORS config)

---

## Quick Start

```bash
# 1. Clone and install
cd "d:\jobportal project\applyai"
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Firebase credentials

# 3. Run on web
npm run web

# 4. Run on Android
npm run android

# 5. Run on iOS (macOS only)
npm run ios
```

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project** → name it `applyai-444b2` (or your preferred name)
3. Disable Google Analytics if you want (optional)

### Step 2: Enable Services

| Service | How to Enable |
|---------|--------------|
| **Authentication** | Authentication → Sign-in method → Enable **Email/Password** and **Google** |
| **Firestore** | Firestore Database → Create database → Start in **production mode** |
| **Storage** | Storage → Get started → Start in **production mode** |

### Step 3: Register Apps

**Web App:**
1. Project Settings → General → Add app → Web
2. Copy the `firebaseConfig` values into your `.env` file

**Android App:**
1. Project Settings → General → Add app → Android
2. Package name: `com.applyai.app`
3. Add SHA-1 fingerprint for Google Sign-In:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
4. Download `google-services.json` (already in project root)

### Step 4: Deploy Rules and Indexes

```bash
firebase login
firebase use applyai-444b2
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Step 5: Configure Storage CORS

```bash
gsutil cors set cors.json gs://applyai-444b2.firebasestorage.app
```

Or via [Google Cloud Shell](https://shell.cloud.google.com):
1. Upload `cors.json`
2. Run the gsutil command above

---

## API Keys Setup

All API keys are stored as **Firebase Secrets** (encrypted, server-side only). They never touch the client app.

### OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set it:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```

**Used by:** Resume parsing, cover letter generation, outreach email generation

**Cost:** ~$0.001 per resume parse, ~$0.002 per cover letter

### RapidAPI JSearch Key

1. Go to [rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Subscribe to the free plan (100 requests/month)
3. Copy your `X-RapidAPI-Key`
4. Set it:
   ```bash
   firebase functions:secrets:set RAPIDAPI_KEY
   ```

**Used by:** Job search and recommended jobs

**Cost:** Free for 100 req/month, then $30/month for 10K

### SendGrid API Key

1. Go to [sendgrid.com](https://sendgrid.com) → Create account
2. Settings → API Keys → Create API Key (Full Access)
3. Verify a sender email address under Settings → Sender Authentication
4. Set both:
   ```bash
   firebase functions:secrets:set SENDGRID_API_KEY
   firebase functions:secrets:set FROM_EMAIL
   ```

**Used by:** Recruiter outreach emails

**Cost:** Free for 100 emails/day

---

## Deployment

### Deploy Everything (Recommended)

```powershell
# PowerShell
cd "d:\jobportal project\applyai"
.\deploy.ps1
```

### Deploy Individually

```bash
# Firestore rules + indexes
firebase deploy --only firestore --project applyai-444b2

# Storage rules
firebase deploy --only storage --project applyai-444b2

# Cloud Functions
cd functions && npm run build && cd ..
firebase deploy --only functions --project applyai-444b2

# Everything at once
firebase deploy --project applyai-444b2
```

### Build Native Apps

```bash
# Android APK
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Or use EAS Build (recommended for production)
npx eas build --platform android
npx eas build --platform ios
```

---

## Project Structure

```
applyai/
├── app/                          # Screens (Expo Router)
│   ├── (auth)/                   # Login, signup, forgot password
│   ├── (tabs)/                   # Home, Jobs, Smart Apply, Applied, Profile
│   ├── job/[id].tsx              # Job detail
│   ├── share/linkedin.tsx        # LinkedIn share
│   └── resume/upload.tsx         # Resume upload
├── components/                   # UI + AnimatedView
├── constants/theme.ts            # Yellow/green/white design system
├── docs/                         # 📚 Full documentation
│   ├── INDEX.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── UI_GUIDE.md
│   ├── PLATFORMS.md
│   └── SETUP.md
├── firebase/                     # Security rules & indexes
├── functions/                    # Cloud Functions (OpenAI, JSearch, SendGrid)
├── lib/                          # Firebase client + services
├── stores/                       # Zustand auth state
├── types/                        # TypeScript interfaces
├── README.md                     # This file
└── deploy.ps1                    # Deploy script
```

---

## Security

### Authentication

- Firebase Authentication with email/password and Google OAuth
- JWT tokens managed by Firebase SDK (auto-refresh)
- Auth persistence: AsyncStorage (mobile), browser storage (web)
- Minimum password: 8 characters (enforced client-side)

### Firestore Security Rules

| Collection | Read | Write | Notes |
|-----------|------|-------|-------|
| `users/{userId}` | Owner only | Owner only | User can only access own profile |
| `applications/{id}` | Owner only | Owner only | Checked via `userId` field |
| `coverLetters/{id}` | Owner only | Cloud Functions only | Client cannot write |
| `outreachEmails/{id}` | Owner only | Cloud Functions only | Client cannot write |
| `jobCache/{id}` | Denied | Denied | Only Cloud Functions (admin SDK) |
| Everything else | Denied | Denied | Default deny |

### Storage Security Rules

| Path | Read | Write | Constraints |
|------|------|-------|------------|
| `resumes/{userId}/*` | Owner only | Owner only | Max 10 MB, PDF/DOCX only |
| Everything else | Denied | Denied | Default deny |

### API Key Security

- Firebase client config (API key, project ID) is safe to expose — restricted by domain/app
- OpenAI, RapidAPI, SendGrid keys stored as **Firebase Secrets** (encrypted, server-side only)
- Keys never appear in client code or bundle
- Rate limiting: 10 outreach emails per user per day

### Data Privacy

- All user data is scoped per user (no cross-user access)
- Resume files stored in per-user directories
- HTTPS enforced on all Firebase services
- GDPR-ready: users can delete their data via profile

---

## Environment Variables

### Client (.env)

```bash
# Firebase web app config (safe to expose)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

### Cloud Functions (Firebase Secrets)

```bash
firebase functions:secrets:set OPENAI_API_KEY      # OpenAI API key
firebase functions:secrets:set RAPIDAPI_KEY         # RapidAPI JSearch key
firebase functions:secrets:set SENDGRID_API_KEY     # SendGrid API key
firebase functions:secrets:set FROM_EMAIL           # Verified sender email
```

---

## Cloud Functions Reference

| Function | Trigger | Input | Output | API Used |
|----------|---------|-------|--------|----------|
| `parseResume` | onCall | `{ resumeUrl }` | `{ success, profile }` | OpenAI GPT-4o-mini |
| `searchJobs` | onCall | `{ query, page, remote, employmentType }` | `{ jobs[], fromCache }` | RapidAPI JSearch |
| `getRecommendedJobs` | onCall | (none — reads user profile) | `{ jobs[], fromCache }` | RapidAPI JSearch |
| `generateCoverLetter` | onCall | `{ jobTitle, company, jobDescription }` | `{ id, content }` | OpenAI GPT-4o-mini |
| `sendOutreachEmail` | onCall | `{ recruiterEmail, recruiterName?, jobTitle, company }` | `{ id, subject, body }` | SendGrid + OpenAI |

All functions require authentication (`request.auth` must be present).

---

## License

Private — All rights reserved.
