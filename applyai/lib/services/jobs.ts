import { searchJobsAPI, getRecommendedJobsAPI } from '@/lib/firebase/functions';
import type { Job, JobMatchScore } from '@/types';

// Fallback sample jobs for when API is not yet configured
const SAMPLE_JOBS: Omit<Job, 'id' | 'matchScore'>[] = [
  {
    title: 'Senior React Native Developer',
    company: 'TechCorp India',
    location: 'Bangalore, India',
    salary: '18-25 LPA',
    employmentType: 'full-time',
    remote: true,
    description: 'We are looking for a Senior React Native Developer to build cross-platform mobile applications.',
    requirements: ['5+ years experience', 'React Native', 'TypeScript', 'Firebase'],
    skills: ['React Native', 'TypeScript', 'Firebase', 'Redux', 'REST APIs'],
    url: 'https://example.com/jobs/1',
    source: 'Sample',
    postedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '15-22 LPA',
    employmentType: 'full-time',
    remote: true,
    description: 'Join our fast-growing startup building AI-powered products.',
    requirements: ['3+ years experience', 'React', 'Node.js', 'PostgreSQL'],
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    url: 'https://example.com/jobs/2',
    source: 'Sample',
    postedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    title: 'Mobile App Developer',
    company: 'FinTech Innovations',
    location: 'Mumbai, India',
    salary: '20-30 LPA',
    employmentType: 'full-time',
    remote: true,
    description: 'Develop secure fintech mobile applications with React Native.',
    requirements: ['4+ years experience', 'React Native', 'Security best practices'],
    skills: ['React Native', 'TypeScript', 'Security', 'Firebase', 'GraphQL'],
    url: 'https://example.com/jobs/3',
    source: 'Sample',
    postedAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

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

function getFallbackJobs(userSkills: string[]): Job[] {
  return SAMPLE_JOBS.map((job, i) => ({
    ...job,
    id: `sample_${i + 1}`,
    matchScore: calculateLocalMatchScore(userSkills, job.skills),
  })).sort((a, b) => (b.matchScore?.overall || 0) - (a.matchScore?.overall || 0));
}

// Search jobs — tries Cloud Function first, falls back to samples
export async function searchJobs(
  filters: { query?: string; remote?: boolean; employmentType?: string },
  userSkills: string[] = []
): Promise<Job[]> {
  try {
    const result = await searchJobsAPI({
      query: filters.query || 'software developer',
      remote: filters.remote,
      employmentType: filters.employmentType,
    });
    return result.jobs;
  } catch (error) {
    console.warn('JSearch API unavailable, using sample data:', error);
    let jobs = getFallbackJobs(userSkills);

    if (filters.query) {
      const q = filters.query.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filters.remote) jobs = jobs.filter((j) => j.remote);
    if (filters.employmentType) jobs = jobs.filter((j) => j.employmentType === filters.employmentType);

    return jobs;
  }
}

// Get recommended jobs — tries Cloud Function first, falls back
export async function getRecommendedJobs(userSkills: string[] = []): Promise<Job[]> {
  try {
    const result = await getRecommendedJobsAPI();
    return result.jobs;
  } catch {
    return getFallbackJobs(userSkills);
  }
}

export function getJobById(jobs: Job[], jobId: string): Job | null {
  return jobs.find((j) => j.id === jobId) || null;
}
