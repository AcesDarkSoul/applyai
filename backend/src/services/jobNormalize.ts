import type { Job } from '../domain/job';

export type NormalizedJobInput = {
  jobId?: string;
  id?: string;
  sourcePlatform?: string;
  source?: string;
  title?: string;
  company?: string;
  location?: string;
  isRemote?: boolean;
  description?: string;
  applyUrl?: string;
  postedAt?: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function mapSource(raw: string | undefined): Job['source'] {
  const s = String(raw || '')
    .toLowerCase()
    .replace(/\s+/g, '');
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('indeed')) return 'indeed';
  if (s.includes('naukri')) return 'naukri';
  if (s.includes('google')) return 'googlejobs';
  return 'other';
}

function first(...vals: unknown[]): string {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

export function toJob(input: NormalizedJobInput): Job | null {
  const title = first(input.title);
  const company = first(input.company);
  if (!title || !company) return null;

  const applyUrl = first(input.applyUrl);
  const source = mapSource(input.sourcePlatform || input.source || applyUrl);
  const id =
    first(input.jobId, input.id) ||
    `${source}-${Buffer.from(`${title}|${company}|${applyUrl}`).toString('base64url').slice(0, 16)}`;

  return {
    id,
    title,
    company,
    location: first(input.location) || 'Not specified',
    description: stripHtml(first(input.description)),
    isRemote: Boolean(input.isRemote),
    source,
    applyUrl: applyUrl || 'https://example.com',
    postedAt: first(input.postedAt) || new Date().toISOString(),
  };
}

export function toJobs(inputs: NormalizedJobInput[]): Job[] {
  const out: Job[] = [];
  for (const item of inputs) {
    const job = toJob(item);
    if (job) out.push(job);
  }
  return out;
}
