# ApplyAI Documentation Index

Welcome to the **ApplyAI** project documentation. This folder contains all technical and user-facing documentation for the AI Job Application Automation Platform.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, setup, deployment |
| [FEATURES.md](./FEATURES.md) | All app features explained |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture & data flow |
| [DATABASE.md](./DATABASE.md) | Firestore schema, APIs, costs |
| [UI_GUIDE.md](./UI_GUIDE.md) | Design system, colors, components |
| [PLATFORMS.md](./PLATFORMS.md) | LinkedIn, Indeed, Naukri integration |
| [SETUP.md](./SETUP.md) | Step-by-step setup guide |

---

## Project Summary

**ApplyAI** is a cross-platform React Native app (iOS, Android, Web) that helps users:

- Upload resume once and get AI-parsed profile
- Discover jobs from LinkedIn, Indeed, Naukri via JSearch API
- Smart Apply on job portals with one tap
- Share career updates on LinkedIn
- Generate cover letters and send recruiter outreach emails
- Track applications with status timeline

---

## Tech Stack at a Glance

```
Client:     Expo (React Native) + TypeScript + Zustand
Backend:    Firebase (Auth, Firestore, Storage, Cloud Functions)
AI:         OpenAI GPT-4o-mini
Jobs:       RapidAPI JSearch
Email:      SendGrid
```

---

## Documentation by Role

### For Developers
1. [SETUP.md](./SETUP.md) — Get the project running locally
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — How the app is structured
3. [DATABASE.md](./DATABASE.md) — Firestore collections & Cloud Functions

### For Designers
1. [UI_GUIDE.md](./UI_GUIDE.md) — Colors, typography, components

### For Product / Business
1. [FEATURES.md](./FEATURES.md) — Feature list and user flows
2. [PLATFORMS.md](./PLATFORMS.md) — Job portal integration details
3. [DATABASE.md](./DATABASE.md) — Cost estimation section

---

## Project Info

| Item | Value |
|------|-------|
| **Project Name** | ApplyAI |
| **Firebase Project** | applyai-444b2 |
| **Android Package** | com.applyai.app |
| **iOS Bundle ID** | com.applyai.app |
| **Version** | 1.0.0 |

---

## File Structure

```
applyai/
├── app/                    # Screens (Expo Router)
├── components/             # Reusable UI components
├── constants/              # Theme, colors, spacing
├── docs/                   # ← You are here
├── firebase/               # Security rules & indexes
├── functions/              # Cloud Functions (server-side)
├── hooks/                  # Custom React hooks
├── lib/                    # Firebase & services
├── stores/                 # Zustand state
├── types/                  # TypeScript interfaces
├── README.md               # Main readme
└── deploy.ps1              # Deploy script
```

---

*Last updated: July 2026*
