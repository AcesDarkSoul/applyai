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

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_RE = /(?:\+91[\s-]?)?[6-9]\d{9}|\b\d{10}\b/g;
const BLOCKED_DOMAINS =
  /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\.com|sentry|github\.com|schema\.org|w3\.org)/i;

export function extractJobContacts(input: {
  title?: string;
  company?: string;
  description?: string;
  applyUrl?: string;
}): { email: string | undefined; phone: string | undefined } {
  const text = `${input.title || ''} ${input.company || ''} ${input.description || ''} ${input.applyUrl || ''}`;

  // Direct regex search for email present in original text only
  const foundEmails = [...new Set(text.match(EMAIL_RE) || [])].filter(
    (e) => !BLOCKED_DOMAINS.test(e),
  );
  const email = foundEmails[0] || undefined;

  // Direct regex search for phone present in original text only
  const foundPhones = [...new Set(text.match(PHONE_RE) || [])].filter((p) => {
    const digits = p.replace(/\D/g, '');
    if (digits.startsWith('202') || digits.startsWith('201')) return false;
    return digits.length >= 10 && digits.length <= 12;
  });
  const phone = foundPhones[0] || undefined;

  return { email, phone };
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

  const description = stripHtml(first(input.description));
  const contacts = extractJobContacts({ title, company, description, applyUrl });

  return {
    id,
    title,
    company,
    location: first(input.location) || 'Not specified',
    description,
    isRemote: Boolean(input.isRemote),
    source,
    applyUrl: applyUrl || 'https://example.com',
    contactEmail: contacts.email,
    contactPhone: contacts.phone,
    hrEmail: contacts.email,
    hrPhone: contacts.phone,
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
