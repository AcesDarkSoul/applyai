# ApplyAI — QA (go live)

AI job search app: resume → match jobs → apply → track.

Google Play needs **12 testers opted in for 14 days** before production. Adding emails is not enough.

---

## What the app does

| Screen | What to check |
|--------|----------------|
| Sign in / Sign up | Email + Google login, forgot password |
| Dashboard | Stats, today’s jobs, recent applications |
| Find Jobs | Search, open a job, save |
| Resume | Upload PDF, profile fills |
| Profile | Edit skills, experience, preferences |
| Hiring Posts | Open a post |
| Applications | Status list after apply |
| Notifications | List loads |
| AI Tools | Consent, Smart Apply platforms |
| Analytics | Charts load |

---

## Tester steps (you)

1. Open the **opt-in link** on your phone (Play account).
2. Tap **Become a tester** → you must see **You’re a tester**.
3. Install **ApplyAI** from Play (not an APK).
4. Do this once:
   - Sign in (**email + password** if Google shows an error)
   - Upload resume
   - Search + save a job
   - Apply / Smart Apply if you can
5. **Stay a tester 14 days.** Do not leave the test. Uninstall is OK.
6. Send bugs: screen + what you tapped + device + Android version.

---

## Owner steps (make it live)

1. Play Console → finish app setup (listing, privacy, ratings, Data safety).
2. Add Play **App signing SHA-1** in Firebase (`PLAY_CONSOLE.md`) so Google Sign-In works. Testers use email until then.
3. **Closed testing** → upload AAB → start rollout. Wait for approval.
4. Add **15–20** tester emails. Send the **opt-in link**.
5. Confirm dashboard shows **12+ opted in** (not just invited).
6. Wait **14 days**. If count drops below 12, add people the same day.
7. Dashboard → **Apply for production** → answer the form (real bugs + fixes).
8. After Google approves → **Production** → upload AAB → roll out.

Internal testing does **not** count. Closed testing only.

---

## Rules

- Testers must use **their own Google account** and tap **Become a tester**.
- Keep **12+ opted in** every day for 14 days or the clock resets.
- Privacy: https://applyai-privacy.web.app
