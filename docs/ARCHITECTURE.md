# ApplyAI — System Architecture

Technical architecture documentation for developers.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Expo App)                         │
│  iOS · Android · Web — React Native + TypeScript + Zustand       │
├─────────────────────────────────────────────────────────────────┤
│  Screens          Components         Services                    │
│  app/(auth)       components/ui      lib/firebase/*              │
│  app/(tabs)       AnimatedView       lib/services/jobs           │
│  app/job          hooks              lib/services/platforms      │
│  app/share        stores/authStore   types/*                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Firebase SDK (client)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE (Google Cloud)                     │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Auth         │ Firestore    │ Storage      │ Cloud Functions    │
│ Email/Google │ users        │ resumes/     │ parseResume        │
│              │ applications │              │ searchJobs         │
│              │ coverLetters │              │ generateCoverLetter│
│              │ outreachEmails│             │ sendOutreachEmail  │
│              │ jobCache     │              │                    │
└──────────────┴──────────────┴──────────────┴─────────┬──────────┘
                                                        │
                           ┌────────────────────────────┼────────────┐
                           ▼                            ▼            ▼
                    ┌──────────┐              ┌──────────────┐  ┌──────────┐
                    │ OpenAI   │              │ RapidAPI     │  │ SendGrid │
                    │ GPT-4o   │              │ JSearch      │  │ Email    │
                    └──────────┘              └──────────────┘  └──────────┘
```

---

## Client Architecture

### Routing (Expo Router)

File-based routing in `app/` directory:

| Route | File | Auth Required |
|-------|------|---------------|
| `/` | Redirects to tabs or login | — |
| `/(auth)/login` | Login screen | No |
| `/(auth)/signup` | Sign up screen | No |
| `/(tabs)/` | Tab navigator | Yes |
| `/job/[id]` | Job detail | Yes |
| `/share/linkedin` | LinkedIn share | Yes |
| `/resume/upload` | Resume upload | Yes |

### Auth Guard

`app/_layout.tsx` wraps the app with `AuthGuard`:
- If not logged in → redirect to `/(auth)/login`
- If logged in on auth screen → redirect to `/(tabs)`

### State Management

**Zustand** store (`stores/authStore.ts`):
- `user` — Firebase Auth user object
- `profile` — Firestore user profile
- `loading` — Auth initialization state
- `refreshProfile()` — Reload profile from Firestore

### Firebase Client SDK

`lib/firebase/config.ts`:
- Initializes Firebase App
- Exports `auth`, `db` (Firestore), `storage`
- Analytics (web only, lazy loaded)

---

## Backend Architecture (Cloud Functions)

All external API calls happen **server-side** in Cloud Functions. API keys are stored as Firebase Secrets.

### Function: `parseResume`

```
Client upload resume → Storage
Client calls parseResume(resumeUrl)
  → Function downloads file from Storage
  → OpenAI GPT-4o-mini extracts structured data
  → Updates users/{uid} in Firestore
  → Returns parsed profile
```

### Function: `searchJobs`

```
Client calls searchJobs({ query, page, remote })
  → Check jobCache in Firestore (1hr TTL)
  → If miss: call JSearch API
  → Map results to Job schema
  → Calculate match scores per user
  → Cache raw jobs in Firestore
  → Return jobs with matchScore
```

### Function: `generateCoverLetter`

```
Client calls generateCoverLetter({ jobTitle, company, jobDescription })
  → Load user profile from Firestore
  → OpenAI generates personalized letter
  → Save to coverLetters collection
  → Return content
```

### Function: `sendOutreachEmail`

```
Client calls sendOutreachEmail({ recruiterEmail, jobTitle, company })
  → Rate limit check (10/day per user)
  → OpenAI generates email subject + body
  → SendGrid sends email
  → Save to outreachEmails collection
  → Return confirmation
```

---

## Data Flow Diagrams

### User Registration

```
Signup Form → Firebase Auth createUser
           → Firestore users/{uid} document created
           → Redirect to Dashboard
```

### Smart Apply Flow

```
Smart Apply Tab → Select Job
               → detectPlatform(job.url)
               → openSmartApply() → Alert confirmation
               → Linking.openURL(job.url)
               → createApplication() → Firestore applications/
```

### LinkedIn Share Flow

```
Share Screen → Select template or write custom
            → buildLinkedInShareUrl()
            → Open LinkedIn in browser (web popup / mobile deep link)
```

---

## Security Model

### Client-Side
- Firebase config (API key, project ID) — safe to expose, restricted by app
- No OpenAI, RapidAPI, or SendGrid keys in client bundle

### Server-Side (Cloud Functions)
- All secrets via `defineSecret()` + Firebase Secret Manager
- Functions require `request.auth` (logged-in user)

### Firestore Rules
- Users: read/write own document only
- Applications: read/write own documents only
- coverLetters, outreachEmails: read own, write denied (Functions use Admin SDK)
- jobCache: all access denied from client

### Storage Rules
- `resumes/{userId}/*`: owner read/write/delete only
- Max 10 MB, PDF/DOCX only

---

## External Integrations

| Service | Purpose | Auth Method | Called From |
|---------|---------|-------------|-------------|
| Firebase Auth | Login/signup | Client SDK | Client |
| Cloud Firestore | Database | Client SDK + Admin SDK | Client + Functions |
| Firebase Storage | Resume files | Client SDK + Admin SDK | Client + Functions |
| OpenAI API | AI parsing, letters, emails | API key (secret) | Functions only |
| RapidAPI JSearch | Job listings | API key (secret) | Functions only |
| SendGrid | Email delivery | API key (secret) | Functions only |
| LinkedIn | Share posts | Public share URL | Client (Linking) |
| Indeed/Naukri | Apply | Public job URLs | Client (Linking) |

---

## Deployment Architecture

```
Developer Machine
    │
    ├── npm run web / android / ios  → Local Expo dev server
    │
    └── firebase deploy
            ├── firestore:rules      → Firestore security rules
            ├── firestore:indexes    → Composite indexes
            ├── storage              → Storage security rules
            └── functions            → Cloud Functions (Node 20)
```

**Production web:** Can deploy static export to Firebase Hosting:
```bash
npx expo export --platform web
firebase deploy --only hosting
```

---

## Environment Configuration

### Client (`.env`)
```
EXPO_PUBLIC_FIREBASE_*     → Firebase web config
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID → Google OAuth
```

### Functions (Firebase Secrets)
```
OPENAI_API_KEY
RAPIDAPI_KEY
SENDGRID_API_KEY
FROM_EMAIL
```

### Local Functions Dev (`functions/.env`)
Used only for local emulator testing. Never commit.

---

## Scalability Notes

| Component | Scale Strategy |
|-----------|----------------|
| Firestore | Automatic scaling, composite indexes for queries |
| Cloud Functions | Auto-scales per invocation, maxInstances limits |
| Job Cache | Reduces JSearch API calls, 1hr TTL |
| Storage | CDN-backed, per-user folders |
| Auth | Firebase handles up to millions of users |

---

*See [DATABASE.md](./DATABASE.md) for schema details and cost estimates.*
