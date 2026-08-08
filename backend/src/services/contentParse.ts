import type { Job } from '../domain/job';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g;
const BLOCKED_EMAIL = /(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|example\.com)/i;

export type ContentSection = { heading: string; content: string };

export type JobContacts = { email: string | null; phone: string | null };

export type HiringPost = {
  id: string;
  title: string;
  company: string;
  author: string;
  body: string;
  excerpt: string;
  location: string;
  isRemote: boolean;
  source: string;
  postUrl: string;
  postedAt?: string;
  jobId: string;
  contacts: JobContacts;
  sections: ContentSection[];
  matchScore?: number;
};

const SECTION_HINTS: Array<{ heading: string; pattern: RegExp }> = [
  { heading: 'Overview', pattern: /^(about\s+(the\s+)?(role|job|us|company)|overview|summary|description)\b/i },
  { heading: 'Responsibilities', pattern: /^(responsibilit|what\s+you.ll\s+do|key\s+duties|the\s+role)\b/i },
  { heading: 'Requirements', pattern: /^(requirements?|qualifications?|what\s+you.ll\s+need|must\s+have|skills?\s+required)\b/i },
  { heading: 'Nice to have', pattern: /^(nice\s+to\s+have|preferred|bonus|good\s+to\s+have)\b/i },
  { heading: 'Benefits', pattern: /^(benefits?|perks?|what\s+we\s+offer|compensation)\b/i },
  { heading: 'How to apply', pattern: /^(how\s+to\s+apply|application|to\s+apply|contact|reach\s+out)\b/i },
];

export function extractContacts(text = ''): JobContacts {
  const emails = [...new Set((String(text).match(EMAIL_RE) || []).filter((e) => !BLOCKED_EMAIL.test(e)))];
  const phones = [
    ...new Set(
      (String(text).match(PHONE_RE) || [])
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.replace(/\D/g, '').length >= 10),
    ),
  ];
  return { email: emails[0] || null, phone: phones[0] || null };
}

/** Split long JD / LinkedIn post into readable professional sections. */
export function parseContentSections(description: string): ContentSection[] {
  const text = String(description || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: 'Full details', content: '' };

  const flush = () => {
    const c = current.content.trim();
    if (c) sections.push({ heading: current.heading, content: c });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      current.content += '\n';
      continue;
    }

    const cleaned = line.replace(/^[\d]+[.)]\s*/, '').replace(/^[-•*]\s*/, '');
    const hint = SECTION_HINTS.find((h) => h.pattern.test(cleaned) || h.pattern.test(line));
    const looksLikeHeading =
      (line.length < 60 && /:$/.test(line)) ||
      (line === line.toUpperCase() && line.length > 3 && line.length < 48 && /[A-Z]/.test(line));

    if (hint || looksLikeHeading) {
      flush();
      current = {
        heading: hint?.heading || cleaned.replace(/:$/, '') || 'Details',
        content: '',
      };
      continue;
    }

    current.content += (current.content ? '\n' : '') + line;
  }
  flush();

  if (sections.length === 1 && sections[0].heading === 'Full details') {
    return sections;
  }
  return sections.length ? sections : [{ heading: 'Full details', content: text }];
}

export function isHiringPost(job: Job): boolean {
  return Boolean(job && job.title && job.company);
}

export function toHiringPost(job: Job): HiringPost {
  const body = job.description || '';
  const excerpt = body.replace(/\s+/g, ' ').trim().slice(0, 220) + (body.length > 220 ? '…' : '');
  const email = job.contactEmail || job.hrEmail || extractContacts(body).email;
  const phone = job.contactPhone || job.hrPhone || extractContacts(body).phone;
  return {
    id: `post-${job.id}`,
    title: job.title,
    company: job.company,
    author: job.company,
    body,
    excerpt,
    location: job.location,
    isRemote: job.isRemote,
    source: job.source,
    postUrl: job.applyUrl,
    postedAt: job.postedAt,
    jobId: job.id,
    contacts: { email, phone },
    sections: parseContentSections(body),
    matchScore: job.matchScore,
  };
}
