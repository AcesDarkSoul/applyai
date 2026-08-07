import type { Application, ApplicationStatus } from '../domain/application';
import type { CoverLetterDocument, ResumeDocument } from '../domain/resume';
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

export interface IResumeRepository {
  getLatest(userId: string): Promise<ResumeDocument | null>;
  getById(userId: string, resumeId: string): Promise<ResumeDocument | null>;
  list(userId: string): Promise<ResumeDocument[]>;
  upsert(doc: ResumeDocument): Promise<ResumeDocument>;
}

export interface ICoverLetterRepository {
  create(doc: CoverLetterDocument): Promise<CoverLetterDocument>;
  listByUser(userId: string): Promise<CoverLetterDocument[]>;
}
