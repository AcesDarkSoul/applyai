# Class Diagram (Core Domain & Application)

**Document ID:** ARCH-CLASS-V1  
**Version:** 1.0.0  

---

## 1. Domain + application classes

```mermaid
classDiagram
  class User {
    +uid: string
    +email: string
    +role: UserRole
    +displayName: string
    +skills: string[]
    +atsScore: number
    +profileCompleteness: number
  }

  class Resume {
    +id: string
    +userId: string
    +storagePath: string
    +parsed: ResumeParsed
    +isActive: boolean
    +atsScore: number
  }

  class Job {
    +id: string
    +title: string
    +company: string
    +applyUrl: string
    +source: JobSource
    +isRemote: boolean
  }

  class MatchBreakdown {
    +skills: number
    +experience: number
    +education: number
    +location: number
    +salary: number
    +overall: number
  }

  class Application {
    +id: string
    +userId: string
    +jobId: string
    +status: ApplicationStatus
    +timeline: StatusEvent[]
    +notes: string
  }

  class PromptVersion {
    +id: string
    +name: string
    +version: string
    +body: string
    +active: boolean
  }

  class IUserRepository {
    <<interface>>
    +getById(uid)*
    +upsert(user)*
  }

  class IApplicationRepository {
    <<interface>>
    +listByUser(uid)*
    +create(app)*
    +updateStatus(...)*
  }

  class IJobProvider {
    <<interface>>
    +search(query)*
  }

  class IAiClient {
    <<interface>>
    +complete(request)*
  }

  class MatchingService {
    +compute(user, job) MatchBreakdown
  }

  class SmartApplyService {
    -appRepo: IApplicationRepository
    +execute(userId, job, confirmed) Application
  }

  class AiGenerationService {
    -ai: IAiClient
    -prompts: IPromptRepository
    +coverLetter(user, job) string
    +analyzeResume(file) ResumeParsed
  }

  class JobService {
    -provider: IJobProvider
    -matcher: MatchingService
    +search(query, user) Job[]
  }

  User "1" --> "*" Resume
  User "1" --> "*" Application
  Application --> Job
  Job --> MatchBreakdown
  SmartApplyService --> IApplicationRepository
  JobService --> IJobProvider
  JobService --> MatchingService
  AiGenerationService --> IAiClient
  AiGenerationService --> PromptVersion
```

### Explanation

- Domain types are persistence-agnostic.  
- Services depend on **interfaces**, not Firestore/OpenAI classes (DIP).  
- `SmartApplyService` encapsulates compliance rule: `confirmed` must be true.  
- `MatchingService` is pure/deterministic for unit testing without I/O.

---

## 2. DTO vs Domain rule

| Type | Lives in | Mutable by client? |
|------|----------|--------------------|
| Request DTO | application/dto | Validated input only |
| Domain entity | domain | Service-controlled |
| Response DTO | application/dto | Mapped outward |

Controllers never return raw infrastructure documents.
