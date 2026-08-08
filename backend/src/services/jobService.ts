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

    const catalog = jobCatalog.list();
    let jobs: Job[] = catalog.length > 0 ? this.dedupeJobs(catalog) : [];

    if (!jobs.length && env.RAPIDAPI_KEY) {
      try {
        jobs = await this.fetchFromJSearch(effectiveQuery);
        jobs = this.dedupeJobs(jobs);
      } catch (err) {
        logger.warn('JSearch failed', {
          err: err instanceof Error ? err.message : err,
        });
        jobs = [];
      }
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
    return jobs.find((j) => j.id === id) ?? null;
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
