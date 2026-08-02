# Phase 2 — Software Architecture

**Status:** Complete (draft for approval)  
**Product:** ApplyAI — AI Job Agent  
**Gate:** Do not start Phase 3 until this phase is approved  

## Deliverables

| # | Document | Contents |
|---|----------|----------|
| 01 | [HIGH_LEVEL_ARCHITECTURE.md](./01-HIGH_LEVEL_ARCHITECTURE.md) | System context, containers, boundaries |
| 02 | [LOW_LEVEL_ARCHITECTURE.md](./02-LOW_LEVEL_ARCHITECTURE.md) | Layering, DI, request lifecycle |
| 03 | [COMPONENT_DIAGRAM.md](./03-COMPONENT_DIAGRAM.md) | Frontend + backend components |
| 04 | [SEQUENCE_DIAGRAMS.md](./04-SEQUENCE_DIAGRAMS.md) | Auth, Smart Apply, AI, notifications |
| 05 | [ACTIVITY_DIAGRAMS.md](./05-ACTIVITY_DIAGRAMS.md) | Resume pipeline, apply pipeline |
| 06 | [ER_AND_DATABASE.md](./06-ER_AND_DATABASE.md) | ER + Firestore physical model |
| 07 | [DEPLOYMENT_DIAGRAM.md](./07-DEPLOYMENT_DIAGRAM.md) | Environments, Docker, CI/CD |
| 08 | [CLASS_DIAGRAM.md](./08-CLASS_DIAGRAM.md) | Core domain + service classes |

Master summary: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)

## Architecture principles

1. Clean Architecture dependency rule (inner layers know nothing of outer frameworks)  
2. Feature-based frontend modules  
3. Repository pattern + service layer on backend  
4. Explicit DTOs at API boundary  
5. Policy-compliant assistive apply model  
6. Secrets never in clients  
7. Observability and auditability by default  

## Review checklist

- [ ] Boundaries and trust zones accepted  
- [ ] Data model covers all Phase 1 entities  
- [ ] Sequences cover critical compliance path (Smart Apply)  
- [ ] Deployment topology matches ops capacity  
- [ ] Approve Phase 2 to unlock Phase 3  
