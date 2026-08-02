# Activity Diagrams

**Document ID:** ARCH-ACT-V1  
**Version:** 1.0.0  

---

## ACT-01 — Candidate daily job loop

```mermaid
flowchart TD
  A[Open Dashboard] --> B{Profile complete?}
  B -->|No| C[Upload / edit resume]
  C --> D[AI parse + ATS]
  D --> A
  B -->|Yes| E[Load Today's Jobs]
  E --> F[Review match scores]
  F --> G{Interested?}
  G -->|Save| H[Add to Saved]
  H --> F
  G -->|Apply| I[Confirm Smart Apply]
  I --> J[Track as Applied]
  J --> K[Optional: generate cover letter]
  K --> L[Update status later]
  G -->|Skip| F
  L --> M[Analytics updated]
```

**Explanation:** Optimizes for a repeatable daily habit: completeness → discovery → decision → compliant apply → tracking.

---

## ACT-02 — Application pipeline lifecycle

```mermaid
stateDiagram-v2
  [*] --> Saved
  Saved --> Applied: Smart Apply confirmed
  Applied --> Viewed: Manual / future signal
  Applied --> Interview: User sets interview
  Viewed --> Interview
  Interview --> Offer
  Interview --> Rejected
  Offer --> Accepted: Future
  Offer --> Rejected
  Applied --> Withdrawn
  Saved --> Withdrawn
  Rejected --> [*]
  Withdrawn --> [*]
```

**Explanation:** Status transitions are explicit and audited. Interviews and offers are first-class later collections linked to an Application.

---

## ACT-03 — Admin prompt release

```mermaid
flowchart TD
  A[Draft prompt vN] --> B[Peer review]
  B --> C{Approved?}
  C -->|No| A
  C -->|Yes| D[Publish immutable version]
  D --> E[Activate vN]
  E --> F[Deactivate previous]
  F --> G[Write audit log]
  G --> H[Monitor AI quality metrics]
  H --> I{Regression?}
  I -->|Yes| J[Rollback to vN-1]
  J --> G
  I -->|No| K[Keep active]
```

**Explanation:** Prompt changes are treated like code releases: version, activate, rollback, audit.
