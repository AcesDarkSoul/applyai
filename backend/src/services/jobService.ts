import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { computeMatch } from './matchingService';

const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    company: 'Nimbus Labs',
    location: 'Bengaluru, India',
    description:
      'Build React and Node.js platforms. TypeScript, Firebase, OpenAI integrations. 5+ years experience preferred.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 30L - 45L',
    source: 'linkedin',
    applyUrl: 'https://www.linkedin.com/jobs/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-2',
    title: 'Frontend React Developer',
    company: 'PixelForge',
    location: 'Hyderabad, India',
    description:
      'Craft responsive UIs with React, TypeScript, TailwindCSS and Material UI. Strong CSS and accessibility skills.',
    employmentType: 'Full-time',
    isRemote: false,
    salary: 'INR 12L - 20L',
    source: 'naukri',
    applyUrl: 'https://www.naukri.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-3',
    title: 'Backend Node.js Engineer',
    company: 'Orbit Pay',
    location: 'Remote',
    description:
      'Design REST APIs with Express, JWT auth, Firestore, rate limiting, and observability. Experience with OpenAI a plus.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: '$90k – $120k',
    source: 'indeed',
    applyUrl: 'https://www.indeed.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-4',
    title: 'AI Product Engineer',
    company: 'ApplyAI Partner Co',
    location: 'Pune, India',
    description:
      'Ship AI features: resume parsing, job matching, prompt versioning. Python or Node.js, LLM prompt engineering.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 25L - 40L',
    source: 'linkedin',
    applyUrl: 'https://www.linkedin.com/jobs/',
    postedAt: new Date().toISOString(),
  },
];

function detectSource(url: string): Job['source'] {
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('indeed.com')) return 'indeed';
  if (u.includes('naukri.com')) return 'naukri';
  return 'other';
}

export class JobService {
  async search(query: string, profile: UserProfile | null): Promise<Job[]> {
    let jobs = SAMPLE_JOBS;

    if (env.RAPIDAPI_KEY) {
      try {
        jobs = await this.fetchFromJSearch(query);
      } catch (err) {
        logger.warn('JSearch failed; using sample jobs', {
          err: err instanceof Error ? err.message : err,
        });
      }
    }

    const q = query.trim().toLowerCase();
    const filtered = q
      ? jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q),
        )
      : jobs;

    return filtered.map((job) => {
      if (!profile) return job;
      const breakdown = computeMatch(profile, job);
      return { ...job, matchScore: breakdown.overall, matchBreakdown: breakdown };
    });
  }

  async getById(id: string, profile: UserProfile | null): Promise<Job | null> {
    const jobs = await this.search('', profile);
    return jobs.find((j) => j.id === id) ?? SAMPLE_JOBS.find((j) => j.id === id) ?? null;
  }

  private async fetchFromJSearch(query: string): Promise<Job[]> {
    const url = new URL(`https://${env.RAPIDAPI_JSEARCH_HOST}/search`);
    url.searchParams.set('query', query || 'software engineer');
    url.searchParams.set('page', '1');
    url.searchParams.set('num_pages', '1');

    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': env.RAPIDAPI_JSEARCH_HOST,
      },
    });

    if (!res.ok) {
      throw new Error(`JSearch HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      data?: Array<Record<string, unknown>>;
    };

    return (data.data || []).map((item, index) => {
      const applyUrl = String(item.job_apply_link || item.job_google_link || 'https://example.com');
      return {
        id: String(item.job_id || `jsearch-${index}`),
        title: String(item.job_title || 'Untitled'),
        company: String(item.employer_name || 'Unknown'),
        location: String(item.job_city || item.job_country || 'Unknown'),
        description: String(item.job_description || ''),
        employmentType: item.job_employment_type ? String(item.job_employment_type) : undefined,
        isRemote: Boolean(item.job_is_remote),
        salary: undefined,
        source: detectSource(applyUrl),
        applyUrl,
        postedAt: item.job_posted_at_datetime_utc
          ? String(item.job_posted_at_datetime_utc)
          : undefined,
      } satisfies Job;
    });
  }
}

export const jobService = new JobService();
