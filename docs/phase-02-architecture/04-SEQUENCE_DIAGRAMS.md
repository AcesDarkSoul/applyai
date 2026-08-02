# Sequence Diagrams

**Document ID:** ARCH-SEQ-V1  
**Version:** 1.0.0  

---

## SEQ-01 — Authentication (Firebase)

```mermaid
sequenceDiagram
  actor U as Candidate
  participant Web as Web App
  participant FA as Firebase Auth
  participant API as ApplyAI API
  participant FS as Firestore

  U->>Web: Submit credentials
  Web->>FA: signInWithEmailAndPassword
  FA-->>Web: ID Token
  Web->>API: GET /me (Bearer token)
  API->>FA: verifyIdToken
  FA-->>API: uid, claims
  API->>FS: users/{uid}
  FS-->>API: profile
  API-->>Web: UserProfile DTO
  Web-->>U: Authenticated shell
```

**Explanation:** Identity is owned by Firebase Auth. The API never stores passwords. Authorization uses verified claims + resource ownership.

---

## SEQ-02 — Resume upload & analysis

```mermaid
sequenceDiagram
  actor U as Candidate
  participant Web as Web App
  participant API as API
  participant ST as Storage
  participant AI as OpenAI
  participant FS as Firestore

  U->>Web: Select PDF/DOCX
  Web->>API: multipart /resumes (Multer)
  API->>API: Validate type/size
  API->>ST: Store object resumes/{uid}/{id}
  API->>AI: Parse + ATS prompt (versioned)
  AI-->>API: Structured JSON + score
  API->>FS: Write resumes + update profile
  API-->>Web: ResumeAnalysisDto
  Web-->>U: Editable profile + ATS
```

**Explanation:** Parsing is server-side so OpenAI keys never reach the browser. Prompt version is persisted with the generation for auditability.

---

## SEQ-03 — Smart Apply (compliance-critical)

```mermaid
sequenceDiagram
  actor U as Candidate
  participant Web as Web App
  participant API as API
  participant FS as Firestore
  participant Ext as Official Job Site

  U->>Web: Click Smart Apply
  Web->>Web: Show confirmation dialog
  U->>Web: Confirm
  Web->>API: POST /applications/smart-apply {jobId, confirmed:true}
  API->>API: Validate confirmation + ownership
  API->>FS: Create/update Application status=applied
  API->>FS: Append timeline + audit log
  API-->>Web: {application, applyUrl}
  Web->>Ext: window.open(applyUrl)
  Note over Web,Ext: User completes application on third-party site
```

**Explanation:** The system records intent and opens the official URL. It does **not** submit employer forms. Both UI confirmation and API `confirmed` flag are required.

---

## SEQ-04 — Cover letter generation

```mermaid
sequenceDiagram
  actor U as Candidate
  participant Web as Web App
  participant API as API
  participant FS as Firestore
  participant AI as OpenAI

  U->>Web: Generate cover letter
  Web->>API: POST /ai/cover-letter {jobId}
  API->>API: Quota check
  API->>FS: Load profile + active prompt
  API->>AI: Chat completion
  AI-->>API: Draft text
  API->>FS: Save generation + usage
  API-->>Web: Draft (aiAssisted=true)
  U->>Web: Edit before use
```

---

## SEQ-05 — Notification fan-out (n8n digest)

```mermaid
sequenceDiagram
  participant Cron as n8n Schedule
  participant N8N as n8n
  participant API as ApplyAI API
  participant TG as Telegram
  participant Mail as Email

  Cron->>N8N: Trigger daily digest
  N8N->>API: GET high-match jobs for users
  API-->>N8N: Candidates + matches
  N8N->>N8N: IF channel enabled
  N8N->>TG: Send message
  N8N->>Mail: Send email
  N8N->>API: POST notification receipts / logs
  alt Failure
    N8N->>N8N: Retry with backoff
    N8N->>API: Write error log / alert admin
  end
```

**Explanation:** Digests are automation-owned. API remains source of truth for preferences and match data. Retries and error workflow are mandatory for production workflows.
