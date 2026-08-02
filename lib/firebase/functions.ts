import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './config';
import type { Job } from '@/types';

const functions = getFunctions(app);

export type SocialPlatform = 'linkedin' | 'reddit' | 'twitter';
export type SocialPostType = 'opentowork' | 'career_update' | 'job_share' | 'reddit_forhire';

export interface GeneratedPost {
  title: string;
  content: string;
  hashtags: string[];
  suggestedSubreddit?: string;
  platform: SocialPlatform;
}

export async function parseResumeFromLocalAPI(resumeBase64: string, fileName: string) {
  const fn = httpsCallable<
    { resumeBase64: string; fileName: string },
    { success: boolean; profile: Record<string, unknown> }
  >(functions, 'parseResume');
  const result = await fn({ resumeBase64, fileName });
  return result.data;
}

export async function generateSocialPostAPI(params: {
  platform: SocialPlatform;
  postType: SocialPostType;
  jobTitle?: string;
  company?: string;
  jobUrl?: string;
  customPrompt?: string;
}): Promise<GeneratedPost> {
  const fn = httpsCallable<typeof params, GeneratedPost>(functions, 'generateSocialPost');
  const result = await fn(params);
  return result.data;
}

export async function searchJobsAPI(params: {
  query?: string;
  page?: number;
  remote?: boolean;
  employmentType?: string;
}) {
  const fn = httpsCallable<typeof params, { jobs: Job[]; fromCache: boolean }>(
    functions,
    'searchJobs'
  );
  const result = await fn(params);
  return result.data;
}

export async function getRecommendedJobsAPI() {
  const fn = httpsCallable<void, { jobs: Job[]; fromCache: boolean }>(
    functions,
    'getRecommendedJobs'
  );
  const result = await fn();
  return result.data;
}

export async function generateCoverLetterAPI(params: {
  jobTitle: string;
  company: string;
  jobDescription: string;
}) {
  const fn = httpsCallable<typeof params, { id: string; content: string }>(
    functions,
    'generateCoverLetter'
  );
  const result = await fn(params);
  return result.data;
}

export async function sendOutreachEmailAPI(params: {
  recruiterEmail: string;
  recruiterName?: string;
  jobTitle: string;
  company: string;
}) {
  const fn = httpsCallable<typeof params, { id: string; subject: string; body: string }>(
    functions,
    'sendOutreachEmail'
  );
  const result = await fn(params);
  return result.data;
}
