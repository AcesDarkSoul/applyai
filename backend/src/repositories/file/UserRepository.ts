import type { UserProfile } from '../../domain/user';
import type { IUserRepository } from '../interfaces';
import { fileStore } from './fileStore';

export class FileUserRepository implements IUserRepository {
  async getById(uid: string): Promise<UserProfile | null> {
    return fileStore.get<UserProfile>('users', uid);
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    await fileStore.set('users', profile.uid, profile);
    return profile;
  }

  async listAll(): Promise<UserProfile[]> {
    return fileStore.list<UserProfile>('users');
  }
}
