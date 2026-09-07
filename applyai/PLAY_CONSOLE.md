# ApplyAI — Google Play Console Guide

Single source of truth for Android Play Store releases. Keep this file updated every time you ship.

---

## App identity

| Field | Value |
|-------|-------|
| **App name** | ApplyAI |
| **Package name (applicationId)** | `com.applyai.app` |
| **Play Console** | [play.google.com/console](https://play.google.com/console) |
| **Firebase project** | `applyai-444b2` |
| **Default language** | English (en-US) — add Hindi (hi-IN) if targeting India |
| **Category** | Business / Productivity |
| **Contact email** | Use your real support inbox (same as Content ratings contact) |
| **Privacy policy URL** | https://applyai-privacy.web.app |

Deep link / URL scheme: `applyai://`

---

## Content ratings (IARC)

| Field | Answer |
|-------|--------|
| **Category** | **All other app types** (not Game, not Social/communication) |
| **Email** | Your real contact email (Play/IARC may email you) |
| **Terms** | Check: I agree to the IARC Terms of Use |

Typical questionnaire answers for ApplyAI (job search / productivity):

| Topic | Answer |
|-------|--------|
| Violence | No |
| Sexual content / nudity | No |
| Language (profanity) | No |
| Controlled substances (alcohol, tobacco, drugs) | No |
| Gambling / simulated gambling | No |
| User-generated content that is shared publicly | No (private profile / apps only; outreach is email you send, not a social feed) |
| Users can interact / communicate | No as primary purpose — choose **No** unless the form asks about any messaging; ApplyAI is not a chat/social app |
| Shares location | No (preferred location is typed preference, not live GPS tracking) |
| Purchases / unrestricted web browsing | No (unless you add IAP or in-app browser later) |

Expect a mature / everyone-style rating (often **PEGI 3** / **Everyone**), not Teen/Mature, as long as answers above stay No.

---

## Data safety — per-type answers (ApplyAI)

For each selected data type: **Collected + Shared** unless noted. Encryption in transit = Yes. Account deletion URL = `https://applyai-privacy.web.app/account-deletion.html`.

### Name / Email / User IDs / Phone
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** |
| Required or optional? | **Required** for Name, Email, User IDs; Phone = **Users can choose** |
| Why collected? | **App functionality**, **Account management** (add **Analytics** for Name/Email if Crashlytics attributes are set) |
| Why shared? | **App functionality**, **Account management** (add **Analytics** if Crashlytics) |

### Other financial info (expected salary)
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** |
| Required or optional? | **Users can choose** |
| Why collected / shared? | **App functionality**, **Personalisation** (job matching) |

### Emails (outreach)
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** (drafts may be stored; sending uses SendGrid) |
| Required or optional? | **Users can choose** |
| Why collected / shared? | **App functionality** |

### Files and docs (resume)
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** for on-device/metadata; AI parse may be short-lived but disclose as **No** if any longer retention / profile derived |
| Required or optional? | **Users can choose** |
| Why collected / shared? | **App functionality**, **Personalisation** |

### Other user-generated content / In-app search history / App interactions
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** |
| Required or optional? | Search/UGC = **Users can choose**; App interactions = **Required** (Analytics SDK) |
| Why collected / shared? | **App functionality** and/or **Analytics** / **Personalisation** as fits |

### Crash logs / Diagnostics / Device or other IDs
| Question | Answer |
|----------|--------|
| Ephemeral? | **No** |
| Required or optional? | **Required** (SDK collection) |
| Why collected / shared? | **Analytics**, **App functionality** (stability) |

---

## Current release versions

Update these **together** on every release:

| Location | Field | Current value |
|----------|-------|---------------|
| `android/app/build.gradle` → `defaultConfig` | `versionCode` | **10** (integer; must increase every Play upload) |
| `android/app/build.gradle` → `defaultConfig` | `versionName` | **1.0.9** (user-visible) |
| `app.json` → `expo.version` | version | **1.0.9** |
| `package.json` → `version` | version | **1.0.9** |

**Rule:** Every new AAB uploaded to Play must have a **higher `versionCode`** than any previous upload (including internal / closed / open tracks).

Suggested bump pattern:

| Change type | versionName | versionCode |
|-------------|-------------|-------------|
| Hotfix / patch | 1.0.0 → 1.0.1 | +1 |
| Minor feature | 1.0.x → 1.1.0 | +1 |
| Major release | 1.x → 2.0.0 | +1 |

---

## Signing / keystore (critical)

Losing this keystore means you **cannot update** the same Play listing.

| Item | Value |
|------|-------|
| **Keystore file** | `android/app/applyai.keystore` |
| **Key alias** | `applyai` |
| **Passwords file** | `android/keystore.properties` (gitignored) |
| **Template** | `android/keystore.properties.example` |
| **Cert owner** | `CN=ApplyAI, OU=Mobile, O=ApplyAI, C=IN` |
| **Valid until** | 22 Dec 2053 |

### Release certificate fingerprints

Use these in Firebase (Google Sign-In), Play App Signing, and API key restrictions:

```
SHA-1:   B0:BC:B8:A9:06:DF:B6:A9:11:A2:1C:41:9D:26:C4:3B:89:CC:C3:E1
SHA-256: 92:35:CC:6A:E8:A3:A6:4D:81:B9:04:6E:5F:21:A8:11:2C:0F:CA:15:1D:8E:34:90:6B:2F:18:BD:A5:50:FA:F9
```

Print again anytime:

```powershell
cd "d:\jobportal project\applyai\android"
keytool -list -v -keystore app\applyai.keystore -alias applyai
```

### Backup checklist (do once, verify yearly)

- [ ] Copy `applyai.keystore` to encrypted offline storage (USB / password manager vault)
- [ ] Store `storePassword`, `keyPassword`, and alias in a password manager
- [ ] Do **not** commit `*.keystore` or `keystore.properties` to git
- [ ] After first Play upload, enroll in **Play App Signing** (Google holds the distribution key; you keep the upload key = this keystore)

---

## Build targets & SDK levels

| Setting | Value | Where |
|---------|-------|--------|
| minSdk | 24 (Android 7.0) | Expo / Gradle |
| targetSdk / compileSdk | 36 | Expo / Gradle |
| Architectures (AAB) | `armeabi-v7a`, `arm64-v8a` | `android/gradle.properties` |
| JS engine | Hermes | `android/gradle.properties` |
| Minify / shrink | enabled for release | `android/gradle.properties` |

Play Store accepts **AAB only** for new apps / updates (not APK).

---

## How to build a Play Store AAB

### Prerequisites

1. JDK 17+
2. Android SDK (`android/local.properties` → `sdk.dir=...`)
3. `android/keystore.properties` present (see example file)
4. `android/app/applyai.keystore` present
5. From repo root: `cd applyai` and `npm install` if deps changed

### One-command build (Windows)

**Important (Windows path limit):** Native CMake can fail with `Filename longer than 260 characters` if the project lives under a long path like `D:\jobportal project\...`. Build via a short junction:

```powershell
# One-time: create short path (run as normal user; needs Command Prompt / PowerShell)
cmd /c mklink /J D:\aa "D:\jobportal project\applyai"

# Always build from the short path
cd D:\aa\android
.\gradlew.bat bundleRelease
```

Or from `D:\aa`:

```powershell
npm run android:bundle
```

### Output path

```
applyai/android/app/build/outputs/bundle/release/app-release.aab
```

Copy for archive / upload (optional):

```powershell
Copy-Item `
  "d:\jobportal project\applyai\android\app\build\outputs\bundle\release\app-release.aab" `
  "d:\jobportal project\applyai\ApplyAI-v1.0.8-vc9.aab"
```

### Local APK (testing only — not for Play upload)

```powershell
cd "d:\jobportal project\applyai\android"
.\gradlew.bat assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

Faster APK test (arm64 only): temporarily set in `gradle.properties`:

```
reactNativeArchitectures=arm64-v8a
```

Restore multi-ABI before the next Play AAB.

### Verify the AAB is signed

```powershell
jarsigner -verify -verbose -certs `
  "d:\jobportal project\applyai\android\app\build\outputs\bundle\release\app-release.aab"
```

Expect `jar verified` and the ApplyAI certificate subject.

---

## Version bump checklist (every release)

1. Bump `versionCode` (+1) and `versionName` in `android/app/build.gradle`
2. Match `version` in `app.json` and `package.json`
3. Update the **Current release versions** table in this file
4. Build AAB: `.\gradlew.bat bundleRelease`
5. Smoke-test install from internal testing track before production
6. Write release notes (what users see in “What’s new”)
7. Upload AAB → choose track → review → roll out

---

## Play Console — create the app (first time)

1. Open [Google Play Console](https://play.google.com/console) → **Create app**
2. App name: **ApplyAI**
3. Default language, app/game = App, free/paid
4. Accept declarations
5. Complete **Dashboard** setup tasks (see below)

### Store listing (required)

| Asset | Spec |
|-------|------|
| Short description | max 80 characters |
| Full description | max 4000 characters |
| App icon | 512 × 512 PNG (32-bit) |
| Feature graphic | 1024 × 500 JPG/PNG |
| Phone screenshots | min 2; 16:9 or 9:16; min short side 320px |
| Tablet screenshots | optional but recommended |
| Privacy policy URL | HTTPS, publicly accessible |

Suggested short description draft:

> AI job search, resume matching, smart apply, and application tracking in one app.

Suggested full description draft:

```
ApplyAI helps you find jobs faster with AI resume matching, smart applications, and clear tracking — all in one app.

WHAT YOU CAN DO
• Upload your resume and build an AI-ready profile
• Search jobs matched to your skills and experience
• Generate cover letters and outreach emails
• Save jobs and track applications in one place
• Sign in with email or Google

BUILT FOR JOB SEEKERS
Whether you’re actively applying or exploring new roles, ApplyAI keeps your profile, matches, and applications organized so you spend less time on busywork and more time landing interviews.

Privacy policy: https://applyai-privacy.web.app
Account deletion: https://applyai-privacy.web.app/account-deletion.html
```

### Graphics locations in repo

| Asset | Path |
|-------|------|
| App icon source | `assets/images/icon.png` |
| Play Store 512 icon | `store-assets/play-icon-512.png` |
| Feature graphic (1024×500) | `store-assets/feature-graphic-1024x500.png` |
| 7-inch tablet screenshots | `store-assets/tablet-7inch/` (6 PNGs, 1080×1920) |
| 10-inch tablet screenshots | `store-assets/tablet-10inch/` (6 PNGs, 1600×2560) |
| Chromebook screenshots | `store-assets/chromebook/` (6 PNGs, 1920×1080) |
| Android XR screenshots | `store-assets/android-xr/` (6 PNGs, 1920×1080) |
| Adaptive icon FG | `assets/images/android-icon-foreground.png` |
| Adaptive icon BG | `assets/images/android-icon-background.png` |

Export Play-sized assets from these before upload (512 icon, 1024×500 feature graphic, device screenshots).

---

## Play Console — demo / test account (App access)

Use this when Play Console asks for **App access** / login credentials for reviewers.

| Field | Value |
|-------|-------|
| **Sign-in method** | Email + password (not Google Sign-In) |
| **Email** | `play.reviewer@applyai.app` |
| **Password** | `ApplyAI-Review-2026!` |
| **Display name** | Play Store Reviewer |
| **Firebase UID** | `AhDA5NrZxVOBFerIvArTz4WvqAW2` |
| **Profile** | Pre-filled demo skills / education so job search & matching work |

**Play Console path:** App content → App access → All or some functionality is restricted → Provide instructions + credentials above.

Suggested instructions for reviewers:

> Open ApplyAI → Sign in with Email → use the email and password provided. Skip Google Sign-In. A demo profile with skills is already set up; you can search jobs, save jobs, and explore application tracking. Resume upload is optional for review.

Do not share this account publicly outside Play Console / internal QA.

---

## Play Console — required policy sections

Complete before production:

| Section | What to fill |
|---------|----------------|
| **App content → Privacy policy** | https://applyai-privacy.web.app |
| **Data safety** | Declare: personal info, files (resume), app activity; collected/shared via Firebase / OpenAI / SendGrid as applicable |
| **Ads** | No ads (unless you add them later) |
| **Target audience** | 18+ recommended (job seeking / career) |
| **News app** | No |
| **COVID-19** | No |
| **Data safety / Account deletion** | Yes — URL: https://applyai-privacy.web.app/account-deletion.html |
| **Permissions justification** | Especially if Play asks about mic / overlay (see below) |

### Declared Android permissions

From the merged manifest (review before each major release):

| Permission | Typical reason |
|------------|----------------|
| `INTERNET` | API / Firebase |
| `READ/WRITE_EXTERNAL_STORAGE` (maxSdk 32) | Legacy file access |
| `VIBRATE` | Haptics / notifications feel |
| `RECORD_AUDIO` | Often pulled by Expo modules — **justify or remove** if unused |
| `SYSTEM_ALERT_WINDOW` | Overlay — **justify or remove** if unused |

If you do not use microphone or overlay, remove them before production to avoid review friction.

---

## Testing tracks (recommended flow)

| Track | Purpose |
|-------|---------|
| **Internal testing** | Fastest; add tester emails; upload AAB first here |
| **Closed testing** | Wider QA before production |
| **Open testing** | Public beta (optional) |
| **Production** | Live store listing |

First upload → Internal → fix crashes → Closed → Production (staged rollout 10% → 50% → 100%).

**QA + go-live (short):** [docs/QA.md](./docs/QA.md) — what testers do, 12 testers / 14 days, apply for production.

---

## Firebase / Google Sign-In after Play App Signing

Play testers seeing **Google Sign-In misconfigured (SHA-1 / package)** = Firebase is missing the **Play App signing** SHA-1. Testers can use **email + password** until this is added. No new AAB is required after the SHA-1 is saved (wait ~10 minutes, then retry Google).

Firebase project: **petcare-9f4e6**. Package: `com.applyai.app`.

| Key | SHA-1 | Status |
|-----|-------|--------|
| Upload (`applyai.keystore`) | `B0:BC:B8:A9:06:DF:B6:A9:11:A2:1C:41:9D:26:C4:3B:89:CC:C3:E1` | In Firebase |
| Debug | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` | In Firebase — do not delete |
| **Play App signing** | `66:99:5A:39:99:4B:82:9E:3E:14:01:7C:56:2C:C4:5A:A3:B9:57:E2` | In Firebase, OAuth client created 2026-09-06 — `google-services.json` refreshed |
| Unused (`7B:3C:1B:DD:A7:BE:4E:8D:78:5F:23:66:4C:77:34:F2:78:40:EB:08`) | auto-created Android OAuth client of unknown origin, harmless to leave in place |

Fix (once):

1. Play Console → **App integrity** / **App signing** → copy **App signing key certificate** SHA-1
2. [Firebase Console](https://console.firebase.google.com/project/petcare-9f4e6/settings/general) → Android app `com.applyai.app` → **Add fingerprint** → paste Play SHA-1 (and debug SHA-1)
3. Download new `google-services.json` into `applyai/` and `applyai/android/app/`
4. Wait 5–15 minutes. Testers retry Google Sign-In (no reinstall needed)

Also keep both env vars in release builds:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (oauth `client_type` 3)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (oauth `client_type` 1)

Using only the Web client on Android causes: `Custom scheme URIs are not allowed for 'WEB' client type` / `Error 400: invalid_request`.

---

## Upload steps (every release)

1. Play Console → ApplyAI → **Test and release** → choose track
2. **Create new release**
3. Upload `app-release.aab`
4. Release name: e.g. `1.0.0 (1)` = versionName (versionCode)
5. Release notes (per language)
6. Review → Start rollout

### Common upload errors

| Error | Fix |
|-------|-----|
| Version code already used | Increment `versionCode` |
| Wrong signing key | Use `applyai.keystore` / `keystore.properties` |
| Target SDK too low | Keep Expo/targetSdk current (now 36) |
| Missing privacy policy | Add URL under App content |
| Debuggable / wrong build type | Upload `bundleRelease` AAB only |

---

## Release notes templates

### 1.0.0 (first release)

```
First release of ApplyAI:
• Sign in with email or Google
• Upload resume and get an AI profile
• Discover and match jobs
• Smart Apply and application tracking
• Cover letters and recruiter outreach
```

### Later releases

```
What's new in 1.x.x:
• …
• Bug fixes and performance improvements
```

---

## Release history log

| Date | versionName | versionCode | Track | AAB notes | Status |
|------|-------------|-------------|-------|-----------|--------|
| 2026-08-11 | 1.0.0 | 1 | — | Signed AAB (~44 MB); ABIs armeabi-v7a + arm64-v8a; build via `D:\aa` junction | Ready to upload |
| 2026-08-15 | 1.0.7 | 8 | Closed testing | Resume JSON upload + auto-apply after resume; ABIs armeabi-v7a + arm64-v8a | Ready to upload |
| 2026-09-04 | 1.0.8 | 9 | Closed testing | (bad upload path — D:\aa copy still vc8) | Do not use |
| 2026-09-04 | 1.0.9 | 10 | Closed testing | Real project build; Smart Apply/Razorpay/OpenAI fixes | Ready to upload |

Add a row every time you upload.

---

## Quick reference commands

```powershell
# Build Play AAB (use short junction on Windows)
cmd /c mklink /J D:\aa "D:\jobportal project\applyai"   # once
cd D:\aa\android
.\gradlew.bat bundleRelease

# AAB output
explorer "D:\aa\android\app\build\outputs\bundle\release"
# Archived copy after successful build: D:\aa\ApplyAI-v1.0.0-vc1.aab

# Fingerprints
keytool -list -v -keystore "D:\aa\android\app\applyai.keystore" -alias applyai

# Verify signature
jarsigner -verify -verbose -certs "D:\aa\android\app\build\outputs\bundle\release\app-release.aab"
```

---

## Related docs

- [README.md](./README.md) — setup, Firebase, deploy
- [docs/SETUP.md](./docs/SETUP.md) — developer setup
- [docs/INDEX.md](./docs/INDEX.md) — documentation index
