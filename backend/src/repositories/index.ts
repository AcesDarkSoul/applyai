import { isDemoMode } from '../config/env';
import { MemoryApplicationRepository } from './memory/ApplicationRepository';
import { MemoryUserRepository } from './memory/UserRepository';
import type { IApplicationRepository, IUserRepository } from './interfaces';

/** Composition root — swap memory repos for Firestore implementations when credentials exist. */
export const userRepository: IUserRepository = new MemoryUserRepository();
export const applicationRepository: IApplicationRepository = new MemoryApplicationRepository();

export function repositoryMode(): 'memory' | 'firestore' {
  return isDemoMode ? 'memory' : 'memory'; // Firestore repos land in Phase 7
}
