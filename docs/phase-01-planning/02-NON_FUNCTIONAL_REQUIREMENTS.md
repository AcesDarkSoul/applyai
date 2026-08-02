# Non-Functional Requirements — AI Job Agent

**Document ID:** NFR-V1  
**Version:** 1.0.0-draft  
**Status:** Phase 1 draft  
**Last updated:** 2026-08-02

---

## 1. Purpose

Define quality attributes the system must meet independent of specific features. Targets are **v1 production baselines**; exact numbers may be adjusted after load testing and budget review.

---

## 2. Categories

### 2.1 Performance

| ID | Priority | Requirement | Target (v1) |
|----|----------|-------------|-------------|
| NFR-PERF-001 | P0 | Authenticated page interactive after cold load | ≤ 3s on broadband (p75) |
| NFR-PERF-002 | P0 | API p95 latency for non-AI CRUD endpoints | ≤ 500 ms |
| NFR-PERF-003 | P0 | AI generation endpoints p95 | ≤ 15 s (model-dependent) |
| NFR-PERF-004 | P0 | Job search with cache hit p95 | ≤ 800 ms |
| NFR-PERF-005 | P1 | Job search cache miss p95 | ≤ 3 s (provider-bound) |
| NFR-PERF-006 | P0 | Resume upload acceptance feedback | ≤ 2 s to start upload; parse async or ≤ 30 s end-to-end |

### 2.2 Scalability

| ID | Priority | Requirement | Target (v1) |
|----|----------|-------------|-------------|
| NFR-SCALE-001 | P0 | Support concurrent active users | ≥ 500 concurrent sessions |
| NFR-SCALE-002 | P0 | Horizontal scale of API via containers | Stateless API instances |
| NFR-SCALE-003 | P1 | Job cache and AI quota protect upstream costs | Per-user and global limits |
| NFR-SCALE-004 | P1 | Firestore indexes for primary query patterns | Documented in DATABASE.md |

### 2.3 Availability & reliability

| ID | Priority | Requirement | Target (v1) |
|----|----------|-------------|-------------|
| NFR-AVL-001 | P0 | Production availability | ≥ 99.5% monthly (excluding provider outages) |
| NFR-AVL-002 | P0 | Graceful degradation when AI/provider down | Mock/fallback or clear error + retry |
| NFR-AVL-003 | P0 | Automated retries for transient workflow failures | Configurable (e.g., 3 attempts) |
| NFR-AVL-004 | P1 | Backup & recovery for critical data | Daily backups; RPO ≤ 24h; RTO ≤ 4h |

### 2.4 Security

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-SEC-001 | P0 | All traffic over HTTPS in production |
| NFR-SEC-002 | P0 | Auth via Firebase Auth + verified tokens on API (JWT/ID tokens) |
| NFR-SEC-003 | P0 | Role-based access control (at least `user`, `admin`) |
| NFR-SEC-004 | P0 | Input validation on all write APIs |
| NFR-SEC-005 | P0 | Rate limiting on auth, AI, and email endpoints |
| NFR-SEC-006 | P0 | Secrets never in client bundles or git |
| NFR-SEC-007 | P0 | XSS protections (output encoding, CSP baseline) |
| NFR-SEC-008 | P0 | CSRF protections for cookie-based flows if used |
| NFR-SEC-009 | P0 | Audit trail for authz changes, prompt activation, bulk deletes |
| NFR-SEC-010 | P0 | Secure file upload validation (type, size, malware scan where feasible) |
| NFR-SEC-011 | P1 | Dependency vulnerability scanning in CI |

### 2.5 Privacy & compliance

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-PRIV-001 | P0 | Store only necessary PII; document data inventory |
| NFR-PRIV-002 | P0 | User can export/delete personal data (process defined) |
| NFR-PRIV-003 | P0 | Comply with third-party platform ToS (no unauthorized bots/scrapers) |
| NFR-PRIV-004 | P1 | Privacy policy and terms presented at signup |
| NFR-PRIV-005 | P1 | Regional data residency constraints documented if required by market |

### 2.6 Usability & accessibility

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-UX-001 | P0 | Responsive layouts for mobile and desktop |
| NFR-UX-002 | P0 | Dark mode and light mode |
| NFR-UX-003 | P0 | Clear loading, empty, and error states |
| NFR-UX-004 | P1 | Keyboard navigable primary flows |
| NFR-UX-005 | P1 | WCAG 2.1 AA aspirational for core screens |

### 2.7 Maintainability

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-MAIN-001 | P0 | Modular clean architecture (UI / API / domain / infra) |
| NFR-MAIN-002 | P0 | Repository + service + controller layering on backend |
| NFR-MAIN-003 | P0 | TypeScript strong typing on frontend and backend |
| NFR-MAIN-004 | P0 | Lint + format enforced in CI |
| NFR-MAIN-005 | P0 | Feature-based frontend folders |
| NFR-MAIN-006 | P0 | Documented ADRs for major tech choices |

### 2.8 Observability

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-OBS-001 | P0 | Structured application logging (request id, user id hash) |
| NFR-OBS-002 | P0 | Error tracking for API failures |
| NFR-OBS-003 | P1 | Metrics: request rate, latency, AI cost proxies, workflow failures |
| NFR-OBS-004 | P1 | Alerting on error budget / 5xx spikes |

### 2.9 Testability

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-TEST-001 | P0 | Unit tests for domain/services |
| NFR-TEST-002 | P0 | API integration tests for critical paths |
| NFR-TEST-003 | P1 | UI tests for auth + core dashboard flows |
| NFR-TEST-004 | P1 | Workflow tests for n8n critical automations |
| NFR-TEST-005 | P1 | Security tests (authz negative cases, rate limit) |

### 2.10 Portability & deployment

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-DEP-001 | P0 | Dockerized services for reproducible deploys |
| NFR-DEP-002 | P0 | Separate env configs: development, staging, production |
| NFR-DEP-003 | P0 | CI/CD via GitHub Actions |
| NFR-DEP-004 | P1 | One-command local stack via Docker Compose |

---

## 3. Constraints

1. Must not violate LinkedIn / Indeed / Naukri / other platform Terms of Service.  
2. AI costs must be controllable via quotas and model selection.  
3. Firebase project and billing must be provisioned before production.  
4. Exact stack confirmation deferred to Phase 3 (see clarifications in `PROJECT_INDEX.md`).

---

## 4. Acceptance for NFRs

NFRs are accepted when:

- Targets are reflected in architecture and test plans (Phases 2, 13, 14).  
- Monitoring can measure the metric or a documented proxy.  
- Deviations are recorded as known limitations in release notes.
