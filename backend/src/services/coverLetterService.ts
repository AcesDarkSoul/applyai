import type { AuthUser, UserProfile } from '../domain/user';
import type { Job } from '../domain/job';
import { aiService } from './aiService';
import { resumeService } from './resumeService';

export type CoverLetterBundle = {
  id: string;
  content: string;
  jobId: string;
  jobTitle?: string;
  company?: string;
  aiAssisted: boolean;
};

/**
 * Always produce a cover letter for a job — AI when OpenAI is configured,
 * otherwise a high-quality heuristic draft from the resume profile.
 * Persists the letter so apply/email/outreach can reuse it.
 */
export async function generateAndSaveCoverLetter(
  auth: AuthUser,
  profile: UserProfile,
  job: Job,
): Promise<CoverLetterBundle> {
  const content = await aiService.generateCoverLetter(profile, job);
  const saved = await resumeService.saveCoverLetter(auth, {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    content,
  });
  return {
    id: saved.id,
    content,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    aiAssisted: true,
  };
}

/** Short pitch for WhatsApp / form fields derived from a full cover letter. */
export function coverLetterToPitch(coverLetter: string, max = 700): string {
  const cleaned = coverLetter
    .replace(/^dear[^\n]*,?\s*/i, '')
    .replace(/^sincerely[\s\S]*$/i, '')
    .replace(/—\s*AI-assisted[\s\S]*$/i, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}
