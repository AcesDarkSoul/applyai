import type { Application } from '../../domain/application';
import type { UserProfile } from '../../domain/user';

/** In-memory store used for DEMO_MODE and local development without Firebase. */
export const memoryStore = {
  users: new Map<string, UserProfile>(),
  applications: new Map<string, Application>(),
  savedJobIds: new Map<string, Set<string>>(),
};
