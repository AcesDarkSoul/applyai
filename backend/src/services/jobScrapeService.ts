import { env } from '../config/env';
import { logger } from '../config/logger';
import type { Job } from '../domain/job';
import { toJob, type NormalizedJobInput } from './jobNormalize';

function actorUrl(actorId: string, token: string): string {
  const id = actorId.replace('/', '~');
  return `https://api.apify.com/v2/acts/${id}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
}

async function fetchJson(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<unknown> {
  const { timeoutMs = 60_000, ...rest } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200)}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function asArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const key of ['jobs_results', 'jobs', 'items', 'data', 'results']) {
      if (Array.isArray(o[key])) return o[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function fromApifyLinkedIn(row: Record<string, unknown>): NormalizedJobInput {
  return {
    jobId: String(row.id || row.linkedinJobId || ''),
    sourcePlatform: 'LinkedIn',
    title: String(row.title || row.jobTitle || ''),
    company: String(row.companyName || row.company || ''),
    location: String(row.location || row.locationName || ''),
    description: String(row.description || row.descriptionHtml || ''),
    applyUrl: String(row.link || row.url || row.jobUrl || row.applyUrl || ''),
    postedAt: String(row.postedAt || row.publishedAt || ''),
    isRemote: /remote/i.test(String(row.workplaceType || row.location || '')),
  };
}

function fromApifyIndeed(row: Record<string, unknown>): NormalizedJobInput {
  return {
    jobId: String(row.id || row.positionId || row.key || ''),
    sourcePlatform: 'Indeed',
    title: String(row.positionName || row.title || ''),
    company: String(row.company || row.companyName || ''),
    location: String(row.location || ''),
    description: String(row.description || row.descriptionHTML || ''),
    applyUrl: String(row.url || row.externalApplyLink || row.link || ''),
    postedAt: String(row.postedAt || row.datePublished || ''),
    isRemote: Boolean(row.isRemote) || /remote/i.test(String(row.location || '')),
  };
}

function fromSerpApi(row: Record<string, unknown>): NormalizedJobInput {
  const applyOptions = Array.isArray(row.apply_options) ? row.apply_options : [];
  const applyLink =
    (applyOptions[0] as { link?: string } | undefined)?.link ||
    String(row.share_link || row.apply_link || '');
  const ext = (row.detected_extensions || {}) as Record<string, unknown>;
  return {
    jobId: String(row.job_id || ''),
    sourcePlatform: 'GoogleJobs',
    title: String(row.title || ''),
    company: String(row.company_name || ''),
    location: String(row.location || ''),
    description: String(row.description || ''),
    applyUrl: applyLink,
    postedAt: String(ext.posted_at || ''),
    isRemote:
      Boolean(ext.work_from_home) ||
      /remote|work from home/i.test(String(row.location || row.description || '')),
  };
}

export type ScrapeResult = {
  jobs: Job[];
  sources: Record<string, { ok: boolean; count: number; error?: string }>;
};

export class JobScrapeService {
  async refresh(query?: string, location?: string): Promise<ScrapeResult> {
    const q = query || env.JOB_SEARCH_QUERY;
    const loc = location || env.JOB_SEARCH_LOCATION;
    const limit = env.JOB_SEARCH_LIMIT;
    const wanted = new Set(
      env.JOB_SCRAPE_SOURCES.split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );

    const collected: Job[] = [];
    const sources: ScrapeResult['sources'] = {};

    const tasks: Array<Promise<void>> = [];

    if (wanted.has('serpapi') || wanted.has('google') || wanted.has('googlejobs')) {
      tasks.push(
        (async () => {
          try {
            if (!env.SERPAPI_API_KEY) throw new Error('SERPAPI_API_KEY missing');
            const url = new URL('https://serpapi.com/search.json');
            url.searchParams.set('engine', 'google_jobs');
            url.searchParams.set('q', q);
            url.searchParams.set('location', loc);
            url.searchParams.set('api_key', env.SERPAPI_API_KEY);
            url.searchParams.set('hl', 'en');
            const body = await fetchJson(url.toString(), { timeoutMs: 45_000 });
            const rows = asArray(body).slice(0, limit);
            const jobs = rows
              .map((r) => toJob(fromSerpApi(r)))
              .filter((j): j is Job => Boolean(j));
            collected.push(...jobs);
            sources.serpapi = { ok: true, count: jobs.length };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn('SerpApi scrape failed', { message });
            sources.serpapi = { ok: false, count: 0, error: message };
          }
        })(),
      );
    }

    if (wanted.has('indeed') || wanted.has('apify-indeed')) {
      tasks.push(
        (async () => {
          try {
            if (!env.APIFY_TOKEN) throw new Error('APIFY_TOKEN missing');
            const url = actorUrl(env.APIFY_INDEED_ACTOR_ID, env.APIFY_TOKEN);
            const body = await fetchJson(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                position: q,
                location: loc,
                country: 'IN',
                maxItemsPerSearch: Math.min(limit, 15),
                saveOnlyUniqueItems: true,
              }),
              timeoutMs: 180_000,
            });
            const rows = asArray(body).slice(0, limit);
            const jobs = rows
              .map((r) => toJob(fromApifyIndeed(r)))
              .filter((j): j is Job => Boolean(j));
            collected.push(...jobs);
            sources.indeed = { ok: true, count: jobs.length };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn('Apify Indeed scrape failed', { message });
            sources.indeed = { ok: false, count: 0, error: message };
          }
        })(),
      );
    }

    if (wanted.has('linkedin') || wanted.has('apify-linkedin')) {
      tasks.push(
        (async () => {
          try {
            if (!env.APIFY_TOKEN) throw new Error('APIFY_TOKEN missing');
            const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&f_TPR=r604800`;
            const url = actorUrl(env.APIFY_LINKEDIN_ACTOR_ID, env.APIFY_TOKEN);
            const body = await fetchJson(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                urls: [searchUrl],
                count: Math.min(limit, 15),
                scrapeCompany: false,
              }),
              timeoutMs: 240_000,
            });
            const rows = asArray(body).slice(0, limit);
            const jobs = rows
              .map((r) => toJob(fromApifyLinkedIn(r)))
              .filter((j): j is Job => Boolean(j));
            collected.push(...jobs);
            sources.linkedin = { ok: true, count: jobs.length };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn('Apify LinkedIn scrape failed', { message });
            sources.linkedin = { ok: false, count: 0, error: message };
          }
        })(),
      );
    }

    await Promise.all(tasks);

    // Dedupe title+company
    const seen = new Set<string>();
    const jobs: Job[] = [];
    for (const job of collected) {
      const key = `${job.title}|${job.company}`.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push(job);
    }

    return { jobs, sources };
  }
}

export const jobScrapeService = new JobScrapeService();
