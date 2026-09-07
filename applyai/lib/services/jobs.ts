import { searchJobsAPI, getRecommendedJobsAPI } from '@/lib/firebase/functions';
import type { Job, JobMatchScore } from '@/types';

function calculateLocalMatchScore(userSkills: string[], jobSkills: string[]): JobMatchScore {
  const normUser = userSkills.map((s) => s.toLowerCase());
  const normJob = jobSkills.map((s) => s.toLowerCase());
  const matched = normJob.filter((s) => normUser.some((u) => u.includes(s) || s.includes(u)));
  const skills = normJob.length ? Math.round((matched.length / normJob.length) * 100) : 50;
  const experience = 75;
  const education = 75;
  const location = 90;
  const salary = 80;
  const overall = Math.round((skills + experience + education + location + salary) / 5);
  return { overall, skills, experience, education, location, salary };
}

/**
 * Legacy Cloud Function job search. Prefer `jobRepository.board` from the Express API.
 * Returns [] on failure — never invents sample jobs.
 */
export async function searchJobs(
  filters: { query?: string; remote?: boolean; employmentType?: string },
  _userSkills: string[] = []
): Promise<Job[]> {
  try {
    const result = await searchJobsAPI({
      query: filters.query || 'software developer',
      remote: filters.remote,
      employmentType: filters.employmentType,
    });
    return result.jobs;
  } catch (error) {
    console.warn('JSearch API unavailable:', error);
    return [];
  }
}

/** Legacy recommended jobs via Cloud Function. Prefer `jobRepository.board`. */
export async function getRecommendedJobs(userSkills: string[] = []): Promise<Job[]> {
  try {
    const result = await getRecommendedJobsAPI();
    return result.jobs.map((job) => ({
      ...job,
      matchScore:
        job.matchScore ||
        calculateLocalMatchScore(userSkills, job.skills || []),
    }));
  } catch (error) {
    console.warn('Recommended jobs unavailable:', error);
    return [];
  }
}

export function getJobById(jobs: Job[], jobId: string): Job | null {
  return jobs.find((j) => j.id === jobId) || null;
}
