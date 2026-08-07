import { getFirestore } from '../infrastructure/firebase/admin';
import { logger } from '../config/logger';
import { FileApplicationRepository } from './file/ApplicationRepository';
import { FileCoverLetterRepository, FileResumeRepository } from './file/ResumeRepository';
import { FileUserRepository } from './file/UserRepository';
import {
  FirestoreCoverLetterRepository,
  FirestoreResumeRepository,
} from './firestore/ResumeRepository';
import { FirestoreUserRepository } from './firestore/UserRepository';
import type {
  IApplicationRepository,
  ICoverLetterRepository,
  IResumeRepository,
  IUserRepository,
} from './interfaces';
import { MemoryApplicationRepository } from './memory/ApplicationRepository';

function createUserRepository(): IUserRepository {
  if (getFirestore()) {
    logger.info('User repository: Firestore');
    return new FirestoreUserRepository();
  }
  logger.info('User repository: durable file store (Firestore mirror)');
  return new FileUserRepository();
}

function createResumeRepository(): IResumeRepository {
  if (getFirestore()) return new FirestoreResumeRepository();
  return new FileResumeRepository();
}

function createCoverLetterRepository(): ICoverLetterRepository {
  if (getFirestore()) return new FirestoreCoverLetterRepository();
  return new FileCoverLetterRepository();
}

function createApplicationRepository(): IApplicationRepository {
  // Prefer durable file store so Smart/Auto Apply survives restarts (same as profiles)
  if (getFirestore()) {
    logger.info('Application repository: durable file store (Firestore apps not yet wired)');
  } else {
    logger.info('Application repository: durable file store');
  }
  try {
    return new FileApplicationRepository();
  } catch (err) {
    logger.warn('File application repo unavailable; using memory', {
      err: err instanceof Error ? err.message : err,
    });
    return new MemoryApplicationRepository();
  }
}

export const userRepository: IUserRepository = createUserRepository();
export const resumeRepository: IResumeRepository = createResumeRepository();
export const coverLetterRepository: ICoverLetterRepository = createCoverLetterRepository();
export const applicationRepository: IApplicationRepository = createApplicationRepository();

export function repositoryMode(): 'memory' | 'firestore' | 'file' {
  if (getFirestore()) return 'firestore';
  return 'file';
}
