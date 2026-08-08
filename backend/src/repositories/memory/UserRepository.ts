import type { UserProfile } from '../../domain/user';
import type { IUserRepository } from '../interfaces';
import { memoryStore } from './store';

export class MemoryUserRepository implements IUserRepository {
  async getById(uid: string): Promise<UserProfile | null> {
    return memoryStore.users.get(uid) ?? null;
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    memoryStore.users.set(profile.uid, profile);
    return profile;
  }

  async listAll(): Promise<UserProfile[]> {
    return [...memoryStore.users.values()];
  }
}
