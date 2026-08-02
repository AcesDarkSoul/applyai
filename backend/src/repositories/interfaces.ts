import type { Application, ApplicationStatus } from '../domain/application';
import type { UserProfile } from '../domain/user';

export interface IUserRepository {
  getById(uid: string): Promise<UserProfile | null>;
  upsert(profile: UserProfile): Promise<UserProfile>;
}

export interface IApplicationRepository {
  listByUser(userId: string): Promise<Application[]>;
  getById(userId: string, id: string): Promise<Application | null>;
  create(app: Application): Promise<Application>;
  updateStatus(
    userId: string,
    id: string,
    status: ApplicationStatus,
    note?: string,
  ): Promise<Application>;
}
