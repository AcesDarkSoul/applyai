# Deployment Diagram

**Document ID:** ARCH-DEP-V1  
**Version:** 1.0.0  

---

## 1. Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Developer machines | Demo/memory or dedicated Firebase dev project |
| Staging | Pre-prod validation | Staging Firebase + limited OpenAI |
| Production | Paying users | Production Firebase + secret manager |

---

## 2. Deployment topology

```mermaid
flowchart TB
  subgraph Users
    Browser
  end

  subgraph CDN["Static hosting / CDN"]
    WebDist[frontend dist]
  end

  subgraph VPC["Container host / VM / Cloud Run"]
    Proxy[Nginx / Traefik TLS]
    API[api:4000]
    N8N[n8n:5678]
  end

  subgraph Managed
    Firebase[Firebase Auth Firestore Storage]
    Secrets[Secret Manager]
    GH[GitHub Actions]
    Registry[Container Registry]
  end

  Browser --> WebDist
  Browser --> Proxy
  Proxy --> API
  Proxy --> N8N
  API --> Firebase
  API --> Secrets
  N8N --> API
  N8N --> Secrets
  GH --> Registry
  Registry --> VPC
```

### Explanation

- **Frontend** is a static SPA behind CDN.  
- **API** and **n8n** run as containers; only API is public (n8n admin locked down).  
- **Secrets** injected at runtime; never baked into images.  
- **CI** builds, tests, scans, and publishes images.

---

## 3. Docker Compose (logical services)

| Service | Image role | Ports |
|---------|------------|-------|
| `frontend` | Nginx serving SPA | 80/443 |
| `backend` | Node API | 4000 |
| `n8n` | Workflow engine | 5678 (private) |
| `proxy` optional | TLS termination | 443 |

Compose file evolves in Phase 4/14 to match this diagram exactly (current `docker/` is bootstrap).

---

## 4. CI/CD pipeline (target)

```mermaid
flowchart LR
  A[Push / PR] --> B[Lint]
  B --> C[Unit + API tests]
  C --> D[Build images]
  D --> E[Security scan]
  E --> F{Main?}
  F -->|No| G[PR checks only]
  F -->|Yes| H[Deploy staging]
  H --> I[Smoke tests]
  I --> J[Manual/auto prod promote]
```

---

## 5. Scaling & recovery

| Concern | Strategy |
|---------|----------|
| API scale-out | Stateless replicas behind LB |
| Firestore scale | Managed; design for indexed queries |
| n8n | Vertical + queue mode later if needed |
| Backups | Firestore export schedule; Storage versioning |
| RPO / RTO | Align with NFR: RPO ≤ 24h, RTO ≤ 4h |
| Rollback | Previous container image + prompt rollback |

---

## 6. Security zones

1. **Public:** SPA + API HTTPS endpoints  
2. **Private:** n8n UI, admin metrics, internal webhooks  
3. **Managed:** Firebase / OpenAI / Google — accessed with least-privilege keys  
