# ApplyAI — Complete Setup Guide

Step-by-step instructions to set up and run ApplyAI from scratch.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Comes with Node.js |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| Expo | SDK 57 | Included in project |
| Git | Any | [git-scm.com](https://git-scm.com) |

**Optional:**
- Android Studio (for Android builds)
- Xcode (for iOS, macOS only)
- Google Cloud SDK (for Storage CORS via `gsutil`)

---

## Step 1: Clone & Install

```bash
cd "d:\jobportal project\applyai"
npm install
cd functions
npm install
cd ..
```

---

## Step 2: Firebase Project Setup

### 2.1 Create Project (if not done)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project: **applyai-444b2** (or create new)

### 2.2 Enable Services

| Service | Steps |
|---------|-------|
| **Authentication** | Auth → Sign-in method → Enable Email/Password + Google |
| **Firestore** | Firestore → Create database → Production mode |
| **Storage** | Storage → Get started |
| **Functions** | Upgrade to **Blaze plan** (required for Cloud Functions) |

### 2.3 Register Apps

**Web App:**
- Project Settings → Add app → Web
- Copy config to `.env`

**Android App:**
- Add app → Android
- Package: `com.applyai.app`
- Add SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- Download `google-services.json` (already in project)

---

## Step 3: Environment Variables

### Client `.env`

```bash
cp .env.example .env
```

Fill in from Firebase Console → Project Settings → Web app:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=applyai-444b2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=applyai-444b2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=applyai-444b2.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=859226958585
EXPO_PUBLIC_FIREBASE_APP_ID=1:859226958585:web:...
EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID=1:859226958585:android:...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=859226958585-....apps.googleusercontent.com
```

---

## Step 4: Deploy Firebase Rules

```bash
firebase login
firebase use applyai-444b2
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Or use the deploy script:

```powershell
.\deploy.ps1
```

---

## Step 5: Storage CORS (Required for Web Upload)

```bash
gsutil cors set cors.json gs://applyai-444b2.firebasestorage.app
```

Or via [Google Cloud Shell](https://shell.cloud.google.com):
1. Upload `cors.json`
2. Run the gsutil command above

---

## Step 6: API Keys (Cloud Functions)

Enable [Secret Manager API](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=applyai-444b2) first.

### OpenAI (Resume parsing, cover letters)

1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create API key
3. Set secret:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY --project applyai-444b2
   ```

### RapidAPI JSearch (Job listings)

1. [rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Subscribe to free plan
3. Copy `X-RapidAPI-Key`
4. Set secret:
   ```bash
   firebase functions:secrets:set RAPIDAPI_KEY --project applyai-444b2
   ```

### SendGrid (Recruiter emails)

1. [sendgrid.com](https://sendgrid.com) → Create account
2. Verify sender email (Settings → Sender Authentication)
3. Create API key (Settings → API Keys)
4. Set secrets:
   ```bash
   firebase functions:secrets:set SENDGRID_API_KEY --project applyai-444b2
   firebase functions:secrets:set FROM_EMAIL --project applyai-444b2
   ```

### Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions --project applyai-444b2
```

---

## Step 7: Run the App

```bash
# Start Expo dev server
npm start

# Or directly:
npm run web      # Web browser → http://localhost:8081
npm run android  # Android emulator/device
npm run ios      # iOS simulator (macOS only)
```

---

## Step 8: Verify Everything Works

| Test | Expected Result |
|------|-----------------|
| Sign up with email | Account created, redirect to dashboard |
| Google sign-in (web) | Login successful |
| Upload resume | File uploads, profile updates |
| Find Jobs | Jobs list loads (sample or JSearch) |
| Smart Apply | Opens job link in browser |
| Share on LinkedIn | Opens LinkedIn share dialog |
| Profile edit | Changes saved to Firestore |

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Missing or insufficient permissions` | Deploy Firestore rules: `firebase deploy --only firestore` |
| CORS error on resume upload | Run `gsutil cors set cors.json gs://...` |
| `Cloud Function not found` | Deploy functions: `firebase deploy --only functions` |
| `OpenAI API key not configured` | Set secret and redeploy functions |
| `JSearch API error: 403` | Check RapidAPI subscription and key |
| Blank screen on web | Check `.env` has all Firebase variables |
| Google sign-in fails | Add SHA-1 to Firebase Android app |

---

## Production Build

### Web (Firebase Hosting)

```bash
npx expo export --platform web
firebase deploy --only hosting
```

### Android APK

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

### EAS Build (Recommended)

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

---

## Project Credentials Summary

| Item | Value |
|------|-------|
| Firebase Project ID | applyai-444b2 |
| Android Package | com.applyai.app |
| iOS Bundle ID | com.applyai.app |
| Storage Bucket | applyai-444b2.firebasestorage.app |
| Debug SHA-1 | 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 |

---

*See [INDEX.md](./INDEX.md) for full documentation list.*
