import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { jobCatalog } from '../repositories/memory/jobCatalog';
import { buildJobSearchQuery, profileMatchKeywords, sanitizeJobLocation } from './jobQuery';
import { computeMatch } from './matchingService';
import { toJobs, type NormalizedJobInput } from './jobNormalize';
import { jobScrapeService } from './jobScrapeService';

export type JobSearchOptions = {
  /** When true and q is empty, derive query from resume/profile. */
  matched?: boolean;
  minScore?: number;
  sortByMatch?: boolean;
  limit?: number;
};

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
  {
    id: 'job-5',
    title: 'React Native Mobile Developer',
    company: 'Trailblaze Apps',
    location: 'Mumbai, India',
    description:
      'Build cross-platform mobile apps with React Native, TypeScript, and Firebase. Push notifications and offline-first UX.',
    employmentType: 'Full-time',
    isRemote: false,
    salary: 'INR 15L - 25L',
    source: 'naukri',
    applyUrl: 'https://www.naukri.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-6',
    title: 'DevOps Engineer',
    company: 'CloudNest',
    location: 'Remote (India)',
    description:
      'Own CI/CD, Docker, Kubernetes, AWS. Terraform and monitoring experience preferred. Collaborate with full-stack teams.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 20L - 35L',
    source: 'linkedin',
    applyUrl: 'https://www.linkedin.com/jobs/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-7',
    title: 'Full Stack Developer (MERN)',
    company: 'BrightCart',
    location: 'Noida, India',
    description:
      'MongoDB, Express, React, Node.js e-commerce platform. REST APIs, payment integrations, and performance tuning.',
    employmentType: 'Full-time',
    isRemote: false,
    salary: 'INR 10L - 18L',
    source: 'indeed',
    applyUrl: 'https://www.indeed.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-8',
    title: 'TypeScript Platform Engineer',
    company: 'Ledgerly',
    location: 'Bengaluru, India',
    description:
      'Design typed services, event-driven workflows, and developer tooling. Node.js, PostgreSQL, Redis, GraphQL.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 28L - 42L',
    source: 'linkedin',
    applyUrl: 'https://www.linkedin.com/jobs/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-9',
    title: 'Junior Software Engineer',
    company: 'StartHive',
    location: 'Pune, India',
    description:
      'Entry-level role for JavaScript/TypeScript developers. Mentorship on React, Node.js, Git, and Agile delivery.',
    employmentType: 'Full-time',
    isRemote: false,
    salary: 'INR 6L - 10L',
    source: 'naukri',
    applyUrl: 'https://www.naukri.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-10',
    title: 'QA Automation Engineer',
    company: 'QualityForge',
    location: 'Chennai, India',
    description:
      'Playwright/Cypress automation, API testing, CI pipelines. Experience with Node.js test tooling is a plus.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 12L - 20L',
    source: 'other',
    applyUrl: 'https://careers.example.com/qa-automation',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-11',
    title: 'Solutions Engineer',
    company: 'StackBridge',
    location: 'Remote',
    description:
      'Customer-facing technical role: demos, PoCs, and integrations using REST APIs, webhooks, and JavaScript.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: '$80k – $110k',
    source: 'indeed',
    applyUrl: 'https://www.indeed.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-12',
    title: 'Software Engineer – Intern',
    company: 'CampusCode',
    location: 'Hyderabad, India',
    description:
      'Internship building internal tools with React and Express. Strong fundamentals in data structures preferred.',
    employmentType: 'Internship',
    isRemote: false,
    salary: 'Stipend',
    source: 'other',
    applyUrl: 'https://careers.example.com/intern',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-13',
    title: 'Android Developer',
    company: 'Mobivibe',
    location: 'Bengaluru, India',
    description:
      'Build production Android apps with Kotlin, Jetpack Compose, MVVM, Room, Retrofit, and Firebase. Experience with WorkManager and Material Design preferred.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 12L - 22L',
    source: 'naukri',
    applyUrl: 'https://www.naukri.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-14',
    title: 'Android Engineer (Kotlin)',
    company: 'PayNest Mobile',
    location: 'Gurgaon, India',
    description:
      'Kotlin, Jetpack Compose, Hilt, Coroutines, REST APIs, Firebase Auth. Ship digital payment features with clean architecture and strong UI polish.',
    employmentType: 'Full-time',
    isRemote: false,
    salary: 'INR 15L - 28L',
    source: 'indeed',
    applyUrl: 'https://www.indeed.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-15',
    title: 'Mobile Android Developer',
    company: 'TravelLoop',
    location: 'Remote (India)',
    description:
      'Android SDK, Kotlin, Jetpack Navigation, Google Maps, Firebase realtime sync. Build travel companion experiences with offline Room caching.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 10L - 18L',
    source: 'naukri',
    applyUrl: 'https://www.naukri.com/',
    postedAt: new Date().toISOString(),
  },
  {
    id: 'job-16',
    title: 'Senior Android Developer',
    company: 'Crimson Labs',
    location: 'Pune, India',
    description:
      'Lead Android development using Kotlin, Jetpack Compose, MVVM, Retrofit, OkHttp, and CI. Mentor juniors and own app performance.',
    employmentType: 'Full-time',
    isRemote: true,
    salary: 'INR 22L - 35L',
    source: 'indeed',
    applyUrl: 'https://www.indeed.com/',
    postedAt: new Date().toISOString(),
  },
];

function detectSource(url: string): Job['source'] {
  const u = url.toLowerCase();
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('indeed.com')) return 'indeed';
  if (u.includes('naukri.com')) return 'naukri';
  if (u.includes('google.com') || u.includes('google.co')) return 'googlejobs';
  return 'other';
}

export class JobService {
  async search(
    query: string,
    profile: UserProfile | null,
    options: JobSearchOptions = {},
  ): Promise<Job[]> {
    const matched = options.matched !== false;
    const explicitQ = query.trim();
    const effectiveQuery = matched
      ? buildJobSearchQuery(profile, explicitQ)
      : explicitQ || buildJobSearchQuery(profile);

    let jobs = SAMPLE_JOBS;
    const catalog = jobCatalog.list();

    if (env.PREFER_LIVE_CATALOG && catalog.length > 0) {
      // Keep live catalog + samples so resume-specific roles still appear
      jobs = this.dedupeJobs([...catalog, ...SAMPLE_JOBS]);
    } else if (env.RAPIDAPI_KEY) {
      try {
        jobs = await this.fetchFromJSearch(effectiveQuery);
        jobs = this.dedupeJobs([...jobs, ...catalog, ...SAMPLE_JOBS]);
      } catch (err) {
        logger.warn('JSearch failed; using sample/catalog jobs', {
          err: err instanceof Error ? err.message : err,
        });
        jobs = catalog.length > 0 ? this.dedupeJobs([...catalog, ...SAMPLE_JOBS]) : SAMPLE_JOBS;
      }
    } else if (catalog.length > 0) {
      jobs = this.dedupeJobs([...catalog, ...SAMPLE_JOBS]);
    }

    // Only hard-filter by typed search text. Profile-derived query ranks via match score.
    const q = explicitQ.toLowerCase();
    let filtered = q
      ? jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(q) ||
            j.company.toLowerCase().includes(q) ||
            j.description.toLowerCase().includes(q) ||
            j.source.toLowerCase().includes(q) ||
            this.softKeywordHit(j, explicitQ),
        )
      : jobs;

    // If typed query yields nothing, fall back to full set scored by resume
    if (q && !filtered.length) filtered = jobs;

    let scored = filtered.map((job) => {
      if (!profile) return job;
      const breakdown = computeMatch(profile, job);
      return { ...job, matchScore: breakdown.overall, matchBreakdown: breakdown };
    });

    // Soft preference: when matching to resume with no typed q, keep stronger matches first
    if (profile && !q) {
      const keywords = profileMatchKeywords(profile);
      scored = scored.map((job) => {
        if (!keywords.length) return job;
        const blob = `${job.title} ${job.description}`.toLowerCase();
        const hits = keywords.filter((k) => blob.includes(k)).length;
        if (!hits) return job;
        const boost = Math.min(12, hits * 2);
        const matchScore = Math.min(100, (job.matchScore ?? 0) + boost);
        return { ...job, matchScore };
      });
    }

    const sortByMatch = options.sortByMatch !== false;
    if (sortByMatch) {
      scored = [...scored].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }

    const minScore = options.minScore ?? 0;
    if (minScore > 0) {
      scored = scored.filter((j) => (j.matchScore ?? 0) >= minScore);
    }

    if (options.limit && options.limit > 0) {
      scored = scored.slice(0, options.limit);
    }

    return scored;
  }

  /** Recommended jobs for auto-apply / dashboard — resume query + min match. */
  async recommended(
    profile: UserProfile | null,
    opts?: { minScore?: number; limit?: number },
  ): Promise<Job[]> {
    const minScore = opts?.minScore ?? 50;
    const limit = opts?.limit ?? 25;
    let jobs = await this.search('', profile, {
      matched: true,
      sortByMatch: true,
      minScore,
      limit,
    });
    // If catalog is off-resume (e.g. Full Stack scrape for Android profile), relax floor
    if (!jobs.length && minScore > 35) {
      jobs = await this.search('', profile, {
        matched: true,
        sortByMatch: true,
        minScore: 35,
        limit,
      });
    }
    return jobs;
  }

  async getById(id: string, profile: UserProfile | null): Promise<Job | null> {
    const fromCatalog = jobCatalog.getById(id);
    if (fromCatalog) {
      if (!profile) return fromCatalog;
      const breakdown = computeMatch(profile, fromCatalog);
      return { ...fromCatalog, matchScore: breakdown.overall, matchBreakdown: breakdown };
    }
    const jobs = await this.search('', profile, { matched: true, sortByMatch: true });
    return jobs.find((j) => j.id === id) ?? SAMPLE_JOBS.find((j) => j.id === id) ?? null;
  }

  async ingestNormalized(rawJobs: NormalizedJobInput[], sourceLabel = 'n8n') {
    const jobs = toJobs(rawJobs);
    return jobCatalog.upsertMany(jobs, sourceLabel);
  }

  async refreshFromProviders(query?: string, location?: string, profile?: UserProfile | null) {
    const q = query?.trim() || buildJobSearchQuery(profile || null);
    const loc =
      sanitizeJobLocation(location) ||
      sanitizeJobLocation(profile?.preferredLocations?.[0]) ||
      sanitizeJobLocation(profile?.location) ||
      sanitizeJobLocation(env.JOB_SEARCH_LOCATION);
    const result = await jobScrapeService.refresh(q, loc);
    if (result.jobs.length) {
      jobCatalog.replaceAll(result.jobs, 'apify-serpapi');
    }
    return {
      ...result,
      query: q,
      location: loc,
      catalog: jobCatalog.meta(),
    };
  }

  private softKeywordHit(job: Job, query: string): boolean {
    const tokens = query
      .toLowerCase()
      .split(/[\s,/|]+/)
      .filter((t) => t.length > 2);
    if (!tokens.length) return false;
    const blob = `${job.title} ${job.description}`.toLowerCase();
    return tokens.some((t) => blob.includes(t));
  }

  private dedupeJobs(jobs: Job[]): Job[] {
    const seen = new Set<string>();
    const out: Job[] = [];
    for (const job of jobs) {
      const key = job.id || `${job.title}|${job.company}|${job.applyUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(job);
    }
    return out;
  }

  catalogMeta() {
    return jobCatalog.meta();
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
