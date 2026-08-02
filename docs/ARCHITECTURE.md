# ARCHITECTURE.md — ApplyAI AI Job Agent

**Version:** 1.0.0  
**Phase:** 2  
**Status:** Ready for approval  

This document is the master architecture index. Detailed diagrams live in [`phase-02-architecture/`](./phase-02-architecture/).

---

## 1. Summary

ApplyAI is a modular enterprise system composed of:

1. **Web Client** — React + TypeScript SPA  
2. **API** — Node.js Express Clean Architecture service  
3. **Data plane** — Firebase Auth, Firestore, Storage  
4. **Automation** — n8n workflows  
5. **AI plane** — OpenAI with versioned prompts  

Compliance stance: **assistive** job applications only (user-confirmed open of official postings).

---

## 2. Diagram index

| Diagram | File | What it answers |
|---------|------|-----------------|
| High-Level | [01-HIGH_LEVEL_ARCHITECTURE.md](./phase-02-architecture/01-HIGH_LEVEL_ARCHITECTURE.md) | System context & containers |
| Low-Level | [02-LOW_LEVEL_ARCHITECTURE.md](./phase-02-architecture/02-LOW_LEVEL_ARCHITECTURE.md) | Layers, DI, auth, AI flow |
| Component | [03-COMPONENT_DIAGRAM.md](./phase-02-architecture/03-COMPONENT_DIAGRAM.md) | Internal building blocks |
| Sequence | [04-SEQUENCE_DIAGRAMS.md](./phase-02-architecture/04-SEQUENCE_DIAGRAMS.md) | Runtime interactions |
| Activity | [05-ACTIVITY_DIAGRAMS.md](./phase-02-architecture/05-ACTIVITY_DIAGRAMS.md) | Business workflows/states |
| ER + DB | [06-ER_AND_DATABASE.md](./phase-02-architecture/06-ER_AND_DATABASE.md) | Data relationships |
| Deployment | [07-DEPLOYMENT_DIAGRAM.md](./phase-02-architecture/07-DEPLOYMENT_DIAGRAM.md) | Runtime topology & CI/CD |
| Class | [08-CLASS_DIAGRAM.md](./phase-02-architecture/08-CLASS_DIAGRAM.md) | Core types & services |

---

## 3. Quality attributes mapping

| NFR theme | Architectural tactic |
|-----------|----------------------|
| Security | Token verify, RBAC, Helmet, validation, secrets vault |
| Scalability | Stateless API, managed Firestore, CDN SPA |
| Maintainability | Clean Architecture, feature folders, DI ports |
| Observability | Request IDs, Winston, audit logs |
| Compliance | Smart Apply confirmation + no third-party auto-submit |
| Cost | Quotas, job cache, model selection |

---

## 4. Alignment with existing scaffold

A bootstrap `frontend/` + `backend/` exists for local demo.  
Phase 2 defines the **target architecture**. Phase 4–6 will refactor the scaffold to fully match:

- Redux Toolkit + React Query + RHF + Zod  
- Explicit DTO modules + DI container  
- Firestore repositories  
- Firebase Auth production path  

See [`../PROJECT_STATE.md`](../PROJECT_STATE.md) technical debt.

---

## 5. Next phase

**Phase 3 — Technology Decisions:** formal comparisons (React vs Angular, Firebase vs Supabase, etc.) and ADRs that freeze the stack before deeper production coding.
