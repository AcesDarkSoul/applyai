import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from '../domain/resume';
import type { UserProfile } from '../domain/user';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
/** Prefer real phones (+91 / 10-digit) over years like 2022. */
const PHONE_RE =
  /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}|\b\d{10}\b/;
const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;
const GITHUB_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i;
const MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATE_RANGE_RE = new RegExp(
  `((?:${MONTH})\\.?\\s+\\d{4}|\\d{4})\\s*[-–—to]+\\s*((?:${MONTH})\\.?\\s+\\d{4}|\\d{4}|Present|Current|Now)`,
  'i',
);

const SKILL_CATALOG = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift',
  'React', 'React Native', 'Next.js', 'Angular', 'Vue', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask',
  'Spring', 'FastAPI', 'GraphQL', 'REST', 'HTML', 'CSS', 'Tailwind', 'Sass',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Firestore', 'Supabase', 'SQLite', 'Room',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab',
  'Linux', 'Nginx', 'Kafka', 'RabbitMQ', 'Elasticsearch',
  'OpenAI', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Android', 'Android SDK', 'iOS', 'Flutter', 'Expo', 'Jetpack Compose', 'MVVM', 'Retrofit', 'OkHttp',
  'WorkManager', 'Dagger Hilt', 'Hilt', 'LiveData', 'ViewModel', 'Navigation', 'Lottie', 'Material Design',
  'Ktor', 'SQL', 'Jest', 'Cypress', 'Playwright', 'Selenium',
  'Figma', 'Adobe XD', 'Agile', 'Scrum', 'Jira', 'Redux', 'Prisma', 'Webpack', 'Vite',
];

/** Longer / more specific titles first so "Android Developer" wins over "Backend Developer". */
const TITLE_HINTS = [
  'Full Stack Developer', 'Full Stack Engineer', 'Android Developer', 'iOS Developer',
  'React Native Developer', 'Mobile Developer', 'Frontend Developer', 'Backend Developer',
  'Software Engineer', 'Software Developer', 'DevOps Engineer',
  'Data Engineer', 'Data Scientist', 'ML Engineer', 'React Developer', 'Node.js Developer',
  'Java Developer', 'Python Developer', 'Kotlin Developer', 'QA Engineer',
];

const ROLE_WORD_RE =
  /\b(intern|developer|engineer|architect|manager|lead|consultant|analyst|designer|scientist|specialist|founder|co-?founder)\b/i;

type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements';

const SECTION_PATTERNS: Array<{ key: SectionKey; re: RegExp }> = [
  {
    key: 'summary',
    re: /^(?:(?:profile|professional|career)\s+)?summary$|^objective$|^about\s+me$/i,
  },
  {
    key: 'experience',
    re: /^(?:work\s+)?experience$|^employment(?:\s+history)?$|^professional\s+experience$|^work\s+history$/i,
  },
  { key: 'education', re: /^education$|^academic\s+background$|^qualifications?$/i },
  {
    key: 'skills',
    re: /^(?:technical\s+)?skills$|^tech\s+stack$|^technologies$|^core\s+competencies$/i,
  },
  { key: 'projects', re: /^(?:key\s+|personal\s+)?projects?$|^portfolio$/i },
  {
    key: 'certifications',
    re: /^certifications?(?:\s+and\s+training)?$|^licenses?$|^certificates?$/i,
  },
  { key: 'languages', re: /^languages?(?:\s+known)?$/i },
  {
    key: 'achievements',
    re: /^(?:leadership\s+and\s+)?achievements?$|^awards?$|^honors?$|^accomplishments?$/i,
  },
];

const PARSE_PROMPT = `You are a professional resume parser. Extract ALL personal and professional information from the resume text.
Return ONLY valid JSON with this exact structure:
{
  "name": "full name from resume",
  "email": "email or null",
  "phone": "phone with country code if present, or null",
  "location": "city/state/country",
  "title": "most recent or target job title",
  "skills": ["skills exactly as listed"],
  "experienceYears": 0,
  "summary": "2-4 sentence professional summary from the resume (do not invent)",
  "linkedin": "LinkedIn URL or null",
  "website": "personal site/GitHub URL or null",
  "experience": [
    {
      "company": "company name",
      "title": "job title",
      "location": "city or empty",
      "startDate": "e.g. Jan 2022",
      "endDate": "e.g. Present or Dec 2023",
      "current": false,
      "bullets": ["responsibility or achievement lines from the resume"]
    }
  ],
  "education": [
    {
      "school": "institution",
      "degree": "degree name",
      "field": "field of study or empty",
      "startDate": "year or empty",
      "endDate": "year or empty"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "tech": "technologies used",
      "description": "short description",
      "url": "url or empty",
      "bullets": ["optional bullet points"]
    }
  ],
  "certifications": ["certification names"],
  "languages": ["spoken languages"],
  "achievements": ["awards or notable achievements"]
}
Rules:
- Extract real values only — do not invent employers, degrees, or metrics.
- Prefer the uploaded resume content over assumptions.
- Keep experience bullets close to the original wording.
- Use empty arrays for missing sections.`;

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string;
  title: string;
  skills: string[];
  experience: number;
  education: string[];
  summary: string;
  linkedin: string | null;
  website: string | null;
  experienceEntries: ExperienceEntry[];
  educationEntries: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  languages: string[];
  achievements: string[];
  parseMethod: 'openai' | 'heuristic';
  textChars: number;
  rawText?: string;
};

function newId(): string {
  return randomUUID();
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asStringArray(v: unknown, max = 40): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean).slice(0, max);
}

function normalizeExperience(raw: unknown): ExperienceEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = (row || {}) as Record<string, unknown>;
      const company = asString(r.company);
      const title = asString(r.title);
      const bullets = asStringArray(r.bullets, 12);
      if (!company && !title && !bullets.length) return null;
      const endDate = asString(r.endDate);
      const current =
        typeof r.current === 'boolean'
          ? r.current
          : /present|current|now/i.test(endDate);
      return {
        id: newId(),
        company,
        title,
        location: asString(r.location) || undefined,
        startDate: asString(r.startDate),
        endDate: current ? 'Present' : endDate,
        current,
        bullets,
      } satisfies ExperienceEntry;
    })
    .filter(Boolean)
    .slice(0, 20) as ExperienceEntry[];
}

function normalizeEducation(raw: unknown): EducationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (typeof row === 'string') {
        const line = row.trim();
        if (!line) return null;
        return {
          id: newId(),
          school: line,
          degree: line,
          field: '',
        } satisfies EducationEntry;
      }
      const r = (row || {}) as Record<string, unknown>;
      const school = asString(r.school) || asString(r.institution);
      const degree = asString(r.degree);
      if (!school && !degree) return null;
      return {
        id: newId(),
        school: school || degree,
        degree: degree || school,
        field: asString(r.field) || undefined,
        startDate: asString(r.startDate) || (r.startYear != null ? String(r.startYear) : undefined),
        endDate: asString(r.endDate) || (r.endYear != null ? String(r.endYear) : undefined),
        details: asString(r.details) || undefined,
      } satisfies EducationEntry;
    })
    .filter(Boolean)
    .slice(0, 10) as EducationEntry[];
}

function normalizeProjects(raw: unknown): ProjectEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = (row || {}) as Record<string, unknown>;
      const name = asString(r.name);
      if (!name) return null;
      const techList = Array.isArray(r.technologies)
        ? r.technologies.map(String).filter(Boolean)
        : [];
      return {
        id: newId(),
        name,
        url: asString(r.url) || undefined,
        tech: asString(r.tech) || techList.join(', ') || undefined,
        description: asString(r.description),
        bullets: asStringArray(r.bullets, 8),
      } satisfies ProjectEntry;
    })
    .filter(Boolean)
    .slice(0, 15) as ProjectEntry[];
}

/** Fix PDF line-wrapping: "sagar-pal-\\n8ba" → "sagar-pal-8ba", soft sentence wraps. */
export function normalizeResumeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    // Trim spaces around newlines first so soft-wrap detection works
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/-\n(?=[a-zA-Z0-9])/g, '-')
    .replace(/(?<=[a-z,;:])\n(?=[a-z])/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectKind(buffer: Buffer, fileName: string): 'pdf' | 'docx' | 'text' | 'doc' | 'unknown' {
  const lower = fileName.toLowerCase();
  const head = buffer.subarray(0, 8).toString('utf8');
  if (head.startsWith('%PDF') || lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.doc') && !lower.endsWith('.docx')) return 'doc';
  // DOCX is a ZIP (PK)
  if (
    (buffer[0] === 0x50 && buffer[1] === 0x4b && (lower.endsWith('.docx') || lower.endsWith('.doc'))) ||
    lower.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.rtf')
  ) {
    return 'text';
  }
  if (head.startsWith('%PDF')) return 'pdf';
  const utf8 = buffer.toString('utf8', 0, Math.min(buffer.length, 4000));
  if (utf8.length > 80 && !utf8.includes('\u0000')) return 'text';
  return 'unknown';
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
    buf: Buffer,
  ) => Promise<{ text?: string; numpages?: number }>;
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const kind = detectKind(buffer, fileName);
  let text = '';

  if (kind === 'text') {
    text = buffer.toString('utf8');
    // Strip crude RTF control words if needed
    if (fileName.toLowerCase().endsWith('.rtf') || text.startsWith('{\\rtf')) {
      text = text
        .replace(/\\[a-z]+\d* ?/gi, ' ')
        .replace(/[{}]/g, ' ')
        .replace(/\s+/g, ' ');
    }
  } else if (kind === 'pdf') {
    try {
      text = await extractPdfText(buffer);
    } catch (err) {
      logger.warn('pdf-parse failed', { err: err instanceof Error ? err.message : err });
      throw new Error(
        'Could not read this PDF. Re-export as a text PDF, or upload DOCX/TXT instead.',
      );
    }
  } else if (kind === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    text = (result.value || '').trim();
  } else if (kind === 'doc') {
    throw new Error('Legacy .doc is not supported. Save as PDF, DOCX, or TXT.');
  } else {
    throw new Error(`Unsupported resume type: ${fileName}. Use PDF, DOCX, TXT, or MD.`);
  }

  text = normalizeResumeText(text);
  if (text.length < 40) {
    throw new Error(
      'Resume has little/no extractable text (often a scanned image PDF). Export a text PDF or upload DOCX/TXT.',
    );
  }
  return text.slice(0, 24_000);
}

function titleCaseName(raw: string): string {
  return raw
    .split(/\s+/)
    .map((w) => {
      if (w.length <= 2 && /^[A-Z]+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function matchSectionHeader(line: string): SectionKey | null {
  // Mid-sentence leftovers like "projects." must never become section headers
  const raw = line.trim();
  if (!raw || /[.!?]$/.test(raw)) return null;
  const t = raw.replace(/[:|\-–—]+$/g, '').trim();
  if (!t || t.length > 72) return null;
  if (t.split(/\s+/).length > 8 && !/achievement|certification|leadership/i.test(t)) return null;
  for (const s of SECTION_PATTERNS) {
    if (s.re.test(t)) return s.key;
  }
  return null;
}

function splitSections(text: string): Partial<Record<SectionKey | 'header', string>> {
  const lines = text.split(/\n/);
  const out: Partial<Record<SectionKey | 'header', string[]>> = { header: [] };
  let current: SectionKey | 'header' = 'header';

  for (const line of lines) {
    const key = matchSectionHeader(line);
    if (key) {
      current = key;
      if (!out[current]) out[current] = [];
      continue;
    }
    if (!out[current]) out[current] = [];
    out[current]!.push(line);
  }

  const flat: Partial<Record<SectionKey | 'header', string>> = {};
  for (const [k, v] of Object.entries(out)) {
    flat[k as SectionKey | 'header'] = (v || []).join('\n').trim();
  }
  return flat;
}

function guessName(lines: string[], email: string | null): string | null {
  const skip =
    /^(resume|curriculum|cv|profile|objective|summary|phone|email|linkedin|github|address|contact)/i;
  for (const line of lines.slice(0, 16)) {
    const t = line.trim().replace(/\s+/g, ' ');
    if (!t || t.length > 60) continue;
    if (EMAIL_RE.test(t) || /linkedin|github|https?:\/\//i.test(t)) continue;
    if (/^phone\s*:/i.test(t) || /^email\s*:/i.test(t)) continue;
    if (skip.test(t) || matchSectionHeader(t)) continue;
    // Strip leading labels: "Name: Sagar Pal"
    const cleaned = t.replace(/^(?:name|full\s*name)\s*[:\-]\s*/i, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (
      words.length >= 1 &&
      words.length <= 5 &&
      words.every((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w))
    ) {
      // Avoid mistaking section-like phrases
      if (/summary|experience|education|skills|projects/i.test(cleaned)) continue;
      return titleCaseName(cleaned);
    }
  }
  if (email) {
    const local = email.split('@')[0] || '';
    const parts = local.split(/[._-]+/).filter((p) => p.length > 1 && !/^\d+$/.test(p));
    if (parts.length) return titleCaseName(parts.slice(0, 3).join(' '));
  }
  return null;
}

function guessTitle(text: string, summary: string, experience: ExperienceEntry[]): string {
  const normalizeTitle = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .replace(/\bIos\b/g, 'iOS')
      .replace(/\bMl\b/g, 'ML');

  const sources = [
    summary,
    experience[0] ? `${experience[0].title}` : '',
    text.slice(0, 1200),
  ];
  for (const src of sources) {
    const m = src.match(
      /\b((?:Senior|Junior|Lead|Staff|Principal)?\s*(?:Full[\s-]?Stack|Android|iOS|Frontend|Front-End|Backend|Back-End|Software|Mobile|DevOps|Data|ML|Machine Learning|React|Node\.?js|Java|Python|Kotlin)\s+(?:Developer|Engineer|Intern|Architect|Scientist|Designer))\b/i,
    );
    if (m) return normalizeTitle(m[1]);
  }
  const lower = text.toLowerCase();
  let best = '';
  for (const title of TITLE_HINTS) {
    if (lower.includes(title.toLowerCase()) && title.length > best.length) best = title;
  }
  return best || 'Software Developer';
}

function guessSkills(text: string, skillsSection?: string): string[] {
  const found: string[] = [];
  const pool = `${skillsSection || ''}\n${text}`;
  for (const skill of SKILL_CATALOG) {
    const needle = skill.toLowerCase();
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9+#.])${escaped}(?:[^a-z0-9+#.]|$)`, 'i');
    if (re.test(pool)) found.push(skill);
  }
  // Also pull comma/bullet listed tokens from skills section
  if (skillsSection) {
    const extras = skillsSection
      .split(/[\n,•|/]/)
      .map((s) => s.replace(/^[-*:\s]+/, '').replace(/^[^:]+:\s*/, '').trim())
      .filter((s) => s.length >= 2 && s.length <= 40 && !/^(languages?|frameworks?|tools?|database|core|backend|ui\/?ux)/i.test(s));
    for (const e of extras.slice(0, 40)) {
      if (!found.some((f) => f.toLowerCase() === e.toLowerCase()) && /[A-Za-z]/.test(e)) {
        // Keep known-ish tech tokens only
        if (/^[A-Za-z0-9.#+\- ]+$/.test(e) && e.split(/\s+/).length <= 4) found.push(e);
      }
    }
  }
  return [...new Set(found)].slice(0, 40);
}

function guessExperienceYears(text: string, entries: ExperienceEntry[]): number {
  const m =
    text.match(/(\d+)\+?\s*(?:\+\s*)?years?\s+(?:of\s+)?(?:experience|exp)/i) ||
    text.match(/experience\s*[:\-]?\s*(\d+)\+?\s*years?/i);
  if (m) return Number(m[1]);
  // Approximate from date ranges when explicit years missing
  const years = new Set<number>();
  for (const e of entries) {
    for (const d of [e.startDate, e.endDate]) {
      const y = d?.match(/(20\d{2}|19\d{2})/)?.[1];
      if (y) years.add(Number(y));
    }
  }
  if (years.size >= 2) {
    return Math.max(0, Math.max(...years) - Math.min(...years));
  }
  return entries.length ? Math.max(1, entries.length) : 0;
}

function stripBullet(line: string): string {
  return line.replace(/^[-•*\u2022\u25CF\u25A0▪▸►]+\s*/, '').trim();
}

function isBullet(line: string): boolean {
  return /^[-•*\u2022\u25CF\u25A0▪▸►]/.test(line.trim());
}

function isDateLine(line: string): boolean {
  const t = stripBullet(line);
  return DATE_RANGE_RE.test(t) || /present|current|continuing employment/i.test(t) && /\d{4}/.test(t);
}

function parseDateRange(line: string): { startDate: string; endDate: string; current: boolean } | null {
  const t = stripBullet(line);
  const m = t.match(DATE_RANGE_RE);
  if (!m) return null;
  const endDate = m[2];
  const current = /present|current|now/i.test(endDate);
  return {
    startDate: m[1].replace(/\s+/g, ' ').trim(),
    endDate: current ? 'Present' : endDate.replace(/\s+/g, ' ').trim(),
    current,
  };
}

function splitTitleCompany(line: string): { title: string; company: string } {
  const t = line.trim();
  if (/\s[|@]\s/.test(t) || /\s[|@]\s*/.test(t)) {
    const parts = t.split(/\s*[|@]\s*/).map((p) => p.trim()).filter(Boolean);
    return { title: parts[0] || '', company: parts.slice(1).join(' | ') };
  }
  if (/\s[-–—]\s/.test(t) && ROLE_WORD_RE.test(t)) {
    const parts = t.split(/\s[-–—]\s/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return { title: parts[0], company: parts.slice(1).join(' - ') };
  }
  // "Android Developer Intern Cognifyz Technologies"
  const roleMatch = t.match(
    /^((?:Senior|Junior|Lead|Staff|Principal)?\s*(?:Android|iOS|Full[\s-]?Stack|Frontend|Backend|Software|Mobile|DevOps|Data|React|Java|Python|Kotlin)?\s*(?:Developer|Engineer|Intern|Architect|Manager|Lead|Consultant|Analyst)(?:\s+Intern)?)\s+(.+)$/i,
  );
  if (roleMatch && roleMatch[2] && !isDateLine(roleMatch[2])) {
    return { title: roleMatch[1].replace(/\s+/g, ' ').trim(), company: roleMatch[2].trim() };
  }
  return { title: t, company: '' };
}

function looksLikeRoleHeader(line: string, next?: string): boolean {
  const t = line.trim();
  if (!t || t.length > 140 || matchSectionHeader(t)) return false;
  // Pure bullet responsibilities are not role headers (unless the bullet itself is a title|company)
  if (isBullet(t)) {
    const inner = stripBullet(t);
    return /\s[|@]\s/.test(inner) && ROLE_WORD_RE.test(inner);
  }
  if (isDateLine(t) && !ROLE_WORD_RE.test(t)) return false;
  if (/^(phone|email|linkedin|github|http)\b/i.test(t)) return false;
  if (!ROLE_WORD_RE.test(t)) return false;
  if (t.split(/\s+/).length > 14) return false;

  // "Title | Company" / "Title @ Company"
  if (/\s*[|@]\s*/.test(t)) return true;
  // Next line is a date (plain or bulleted)
  if (next && isDateLine(next)) return true;
  // Next line starts bullets (date may be first bullet)
  if (next && isBullet(next)) return true;
  // "Android Developer Intern Cognifyz Technologies"
  if (splitTitleCompany(t).company) return true;
  return false;
}

function guessExperienceEntries(sectionText: string): ExperienceEntry[] {
  if (!sectionText.trim()) return [];
  const lines = sectionText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !matchSectionHeader(l));

  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (looksLikeRoleHeader(lines[i], lines[i + 1])) starts.push(i);
  }
  // Fallback: treat double-newline blocks if we found nothing
  if (!starts.length) {
    const blocks = sectionText.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    return blocks.slice(0, 10).map((block) => {
      const bl = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const { title, company } = splitTitleCompany(bl[0] || '');
      const dateLine = bl.find((l) => isDateLine(l));
      const dates = dateLine ? parseDateRange(dateLine) : null;
      const bullets = bl
        .filter((l) => isBullet(l) && !isDateLine(l))
        .map(stripBullet)
        .filter(Boolean)
        .slice(0, 10);
      return {
        id: newId(),
        title,
        company,
        startDate: dates?.startDate || '',
        endDate: dates?.endDate || '',
        current: dates?.current,
        bullets,
      } satisfies ExperienceEntry;
    });
  }

  const entries: ExperienceEntry[] = [];
  for (let s = 0; s < starts.length; s++) {
    const from = starts[s];
    const to = s + 1 < starts.length ? starts[s + 1] : lines.length;
    const chunk = lines.slice(from, to);
    const head = stripBullet(chunk[0] || '');
    const { title, company: companyFromHead } = splitTitleCompany(head);
    let company = companyFromHead;
    let startDate = '';
    let endDate = '';
    let current = false;
    const bullets: string[] = [];

    for (let i = 1; i < chunk.length; i++) {
      const line = chunk[i];
      if (isDateLine(line)) {
        const d = parseDateRange(line);
        if (d) {
          startDate = d.startDate;
          endDate = d.endDate;
          current = d.current;
        }
        continue;
      }
      if (isBullet(line)) {
        const b = stripBullet(line);
        if (b) bullets.push(b);
        continue;
      }
      // Non-bullet company line under title
      if (!company && line.length < 80 && !ROLE_WORD_RE.test(line)) {
        company = line;
        continue;
      }
      // Soft-wrapped continuation of previous bullet
      if (bullets.length && !/^[A-Z][a-z]+ Developer\b/i.test(line)) {
        bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${line}`.trim();
        continue;
      }
      if (line.length > 40) bullets.push(line);
    }

    if (!title && !company && !bullets.length) continue;
    entries.push({
      id: newId(),
      title: title || 'Role',
      company: company || '',
      startDate,
      endDate: current ? 'Present' : endDate,
      current,
      bullets: bullets.slice(0, 12),
    });
  }
  return entries.slice(0, 15);
}

function guessEducationEntries(sectionText: string, fullText: string): EducationEntry[] {
  const body = sectionText || '';
  const lines = (body || fullText)
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !matchSectionHeader(l));

  const out: EducationEntry[] = [];
  const degreeRe =
    /(b\.?tech|b\.?e\.|m\.?tech|m\.?s\.|mba|bachelor|master|bsc|msc|bca|mca|diploma|matriculation|intermediate|higher\s+secondary|senior\s+secondary|ph\.?d)/i;

  for (const line of lines) {
    if (!degreeRe.test(line) && !/university|institute|college|school|board of/i.test(line)) {
      continue;
    }
    // Skip achievement lines that mention an institute
    if (/organized|conducted|led the|hackathon/i.test(line) && !degreeRe.test(line)) continue;
    if (line.length < 8) continue;
    let degree = line;
    let school = line;
    const comma = line.match(/^(.+?),\s*(.+)$/);
    if (comma && degreeRe.test(comma[1])) {
      degree = comma[1].trim();
      school = comma[2].replace(/\s*[-–—].*$/, '').trim();
    }
    out.push({
      id: newId(),
      school: school.slice(0, 160),
      degree: degree.slice(0, 160),
      field: '',
    });
    if (out.length >= 6) break;
  }
  return out;
}

function guessProjectEntries(sectionText: string): ProjectEntry[] {
  if (!sectionText.trim()) return [];
  const lines = sectionText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !matchSectionHeader(l));

  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    if (isBullet(t) || isDateLine(t)) continue;
    if (t.length > 90) continue;
    // Project titles are short non-bullet lines followed by bullets
    const next = lines[i + 1];
    if (next && isBullet(next)) starts.push(i);
    else if (!/[.]$/.test(t) && t.split(/\s+/).length <= 10) {
      // also accept standalone title-ish lines
      if (/app|project|system|platform|tracker|portal|website/i.test(t) || /^[A-Z0-9][\w .–—-]{2,60}$/.test(t)) {
        starts.push(i);
      }
    }
  }

  if (!starts.length) {
    const blocks = sectionText.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    return blocks.slice(0, 8).map((block) => {
      const bl = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      return {
        id: newId(),
        name: (bl[0] || 'Project').replace(/^[-•*\s]+/, '').slice(0, 160),
        description: bl.slice(1).map(stripBullet).join(' ').slice(0, 800),
        bullets: bl.slice(1).filter(isBullet).map(stripBullet).slice(0, 6),
      } satisfies ProjectEntry;
    });
  }

  const uniqueStarts = [...new Set(starts)];
  const projects: ProjectEntry[] = [];
  for (let s = 0; s < uniqueStarts.length; s++) {
    const from = uniqueStarts[s];
    const to = s + 1 < uniqueStarts.length ? uniqueStarts[s + 1] : lines.length;
    const chunk = lines.slice(from, to);
    const name = chunk[0].slice(0, 160);
    if (/^sagar$|phone:|email:/i.test(name)) continue;
    if (/[.]$/.test(name)) continue;
    if (name.split(/\s+/).length === 1 && /listener|firebase|database|api$/i.test(name)) continue;
    const bullets = chunk.slice(1).filter(isBullet).map(stripBullet).filter(Boolean);
    // Prefer blocks that actually have bullets (real project entries)
    if (!bullets.length && chunk.length < 2) continue;
    const description = chunk
      .slice(1)
      .map(stripBullet)
      .join(' ')
      .slice(0, 800);
    projects.push({
      id: newId(),
      name,
      description,
      bullets: bullets.slice(0, 8),
    });
  }
  return projects
    .filter((p) => (p.bullets?.length || 0) > 0 || (p.description?.length || 0) > 40)
    .slice(0, 10);
}

function guessListSection(sectionText: string): string[] {
  if (!sectionText.trim()) return [];
  const lines = sectionText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !matchSectionHeader(l));

  const items: string[] = [];
  for (const line of lines) {
    const cleaned = stripBullet(line).trim();
    if (!cleaned) continue;
    const prev = items[items.length - 1];
    // Join soft-wrapped continuations: "...Management and" + "Information Technology."
    if (
      prev &&
      !isBullet(line) &&
      !/[.!?]$/.test(prev) &&
      /^[a-z]/.test(cleaned)
    ) {
      items[items.length - 1] = `${prev} ${cleaned}`.trim();
      continue;
    }
    if (
      prev &&
      !isBullet(line) &&
      !/[.!?]$/.test(prev) &&
      /^[A-Z]/.test(cleaned) &&
      cleaned.length < 60 &&
      !/^(organized|conducted|led|created|built|won)/i.test(cleaned)
    ) {
      items[items.length - 1] = `${prev} ${cleaned}`.trim();
      continue;
    }
    items.push(cleaned);
  }
  return items.filter((l) => l.length > 3).slice(0, 20);
}

function guessLanguages(sectionText: string, fullText: string): string[] {
  if (sectionText.trim()) {
    return sectionText
      .split(/[,;\n|/]/)
      .map((s) => stripBullet(s).trim())
      .filter((s) => s && !/^languages?/i.test(s) && s.length < 30)
      .slice(0, 10);
  }
  const m = fullText.match(/\blanguages?\s*[:\-]\s*([^\n]+)/i);
  if (!m) return [];
  return m[1]
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function strengthenSummary(parsed: ParsedResume): string {
  if (parsed.summary && parsed.summary.length > 80) return parsed.summary.slice(0, 600);
  const skills = parsed.skills.slice(0, 6).join(', ') || 'software development';
  const years = parsed.experience ? `${parsed.experience}+ years` : 'hands-on';
  return `${parsed.name || 'Candidate'} is a ${parsed.title} with ${years} experience across ${skills}. Seeking roles that leverage these strengths to deliver high-quality product outcomes.`.slice(
    0,
    600,
  );
}

function pickPhone(text: string): string | null {
  // Prefer labeled phone
  const labeled = text.match(
    /(?:phone|mobile|cell|tel)\s*[:\-]?\s*(\+?\d[\d\s\-()]{8,}\d)/i,
  );
  if (labeled) return labeled[1].replace(/\s+/g, ' ').trim();
  const matches = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\d[\d\s\-()]{8,}\d)/g) || [];
  for (const m of matches) {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) return m.replace(/\s+/g, ' ').trim();
  }
  return null;
}

export function parseResumeHeuristic(text: string): ParsedResume {
  const normalized = normalizeResumeText(text);
  const sections = splitSections(normalized);
  const lines = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const emailMatch = normalized.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0] : null;
  const phone = pickPhone(normalized);
  const linkedinMatch = normalized.match(LINKEDIN_RE);
  const githubMatch = normalized.match(GITHUB_RE);

  let location = '';
  for (const line of lines.slice(0, 25)) {
    if (EMAIL_RE.test(line) || LINKEDIN_RE.test(line) || /https?:\/\//i.test(line)) continue;
    if (/(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|gurugram|noida|india|remote|usa|uk)\b/i.test(line)) {
      location = line
        .replace(/phone:.*$/i, '')
        .replace(/email:.*$/i, '')
        .replace(/\|.*$/, '')
        .trim()
        .slice(0, 80);
      break;
    }
  }

  const experienceEntries = guessExperienceEntries(sections.experience || '');
  const educationEntries = guessEducationEntries(sections.education || '', normalized);
  const projects = guessProjectEntries(sections.projects || '');
  const certifications = guessListSection(sections.certifications || '');
  const achievements = guessListSection(sections.achievements || '');
  const languages = guessLanguages(sections.languages || '', normalized);
  const skills = guessSkills(normalized, sections.skills);

  const summary = (sections.summary || '')
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 600);

  const name = guessName(lines, email);
  const title = guessTitle(normalized, summary, experienceEntries);
  const experienceYears = guessExperienceYears(normalized, experienceEntries);
  const education = educationEntries.map((e) =>
    [e.degree, e.school].filter(Boolean).join(' — '),
  );

  const base: ParsedResume = {
    name,
    email,
    phone,
    location: location || 'Remote',
    title,
    skills,
    experience: experienceYears,
    education,
    summary,
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    website: githubMatch ? githubMatch[0] : null,
    experienceEntries,
    educationEntries,
    projects,
    certifications,
    languages,
    achievements,
    parseMethod: 'heuristic',
    textChars: normalized.length,
  };
  base.summary = strengthenSummary(base);
  return base;
}

async function parseResumeWithOpenAI(text: string): Promise<ParsedResume> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.1,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PARSE_PROMPT },
        { role: 'user', content: text.slice(0, 14000) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}') as Record<string, unknown>;

  const experienceEntries = normalizeExperience(parsed.experience);
  const educationEntries = normalizeEducation(parsed.education);
  const projects = normalizeProjects(parsed.projects);
  const educationLines = educationEntries.map((e) =>
    [e.degree, e.field, e.school].filter(Boolean).join(' — '),
  );

  const yearsRaw =
    typeof parsed.experienceYears === 'number'
      ? parsed.experienceYears
      : typeof parsed.experience === 'number'
        ? parsed.experience
        : 0;

  const result: ParsedResume = {
    name: typeof parsed.name === 'string' ? parsed.name.trim() : null,
    email: typeof parsed.email === 'string' ? parsed.email : null,
    phone: typeof parsed.phone === 'string' ? parsed.phone : null,
    location:
      typeof parsed.location === 'string' && parsed.location.trim()
        ? parsed.location.trim()
        : 'Remote',
    title:
      typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim()
        : guessTitle(text, '', experienceEntries),
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 40)
      : [],
    experience: yearsRaw,
    education: educationLines,
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : '',
    linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : null,
    website: typeof parsed.website === 'string' ? parsed.website : null,
    experienceEntries,
    educationEntries,
    projects,
    certifications: asStringArray(parsed.certifications, 30),
    languages: asStringArray(parsed.languages, 20),
    achievements: asStringArray(parsed.achievements, 20),
    parseMethod: 'openai',
    textChars: text.length,
  };

  if (!result.skills.length) result.skills = guessSkills(text);
  if (!result.experienceEntries.length) {
    const sections = splitSections(normalizeResumeText(text));
    result.experienceEntries = guessExperienceEntries(sections.experience || '');
  }
  if (!result.educationEntries.length) {
    const sections = splitSections(normalizeResumeText(text));
    result.educationEntries = guessEducationEntries(sections.education || '', text);
    result.education = result.educationEntries.map((e) =>
      [e.degree, e.school].filter(Boolean).join(' — '),
    );
  }
  if (!result.projects.length) {
    const sections = splitSections(normalizeResumeText(text));
    result.projects = guessProjectEntries(sections.projects || '');
  }
  if (!result.certifications.length) {
    const sections = splitSections(normalizeResumeText(text));
    result.certifications = guessListSection(sections.certifications || '');
  }
  if (!result.languages.length) result.languages = guessLanguages('', text);
  if (!result.achievements.length) {
    const sections = splitSections(normalizeResumeText(text));
    result.achievements = guessListSection(sections.achievements || '');
  }
  if (!result.experience) {
    result.experience = guessExperienceYears(text, result.experienceEntries);
  }

  result.summary = strengthenSummary(result);
  return result;
}

export async function parseResumeBuffer(buffer: Buffer, fileName: string): Promise<ParsedResume> {
  let text: string;
  try {
    text = await extractTextFromBuffer(buffer, fileName);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read resume file';
    throw Object.assign(new Error(message), { name: 'ResumeParseError' });
  }
  let parsed: ParsedResume;
  if (env.OPENAI_API_KEY) {
    try {
      parsed = await parseResumeWithOpenAI(text);
    } catch (err) {
      logger.warn('OpenAI resume parse failed; using heuristic', {
        err: err instanceof Error ? err.message : err,
      });
      parsed = parseResumeHeuristic(text);
    }
  } else {
    parsed = parseResumeHeuristic(text);
  }
  return { ...parsed, rawText: text.slice(0, 50_000) };
}

export function scoreAts(parsed: ParsedResume): number {
  let score = 36;
  if (parsed.name) score += 6;
  if (parsed.email) score += 6;
  if (parsed.phone) score += 5;
  if (parsed.skills.length >= 5) score += 10;
  else if (parsed.skills.length >= 2) score += 5;
  if (parsed.summary.length > 120) score += 8;
  if (parsed.experience > 0) score += 5;
  if (parsed.experienceEntries.length >= 2) score += 10;
  else if (parsed.experienceEntries.length === 1) score += 6;
  const bullets = parsed.experienceEntries.reduce((n, e) => n + e.bullets.length, 0);
  if (bullets >= 4) score += 6;
  else if (bullets >= 1) score += 3;
  if (parsed.educationEntries.length || parsed.education.length) score += 5;
  if (parsed.projects.length) score += 4;
  if (parsed.certifications.length) score += 3;
  if (parsed.languages.length) score += 2;
  if (parsed.linkedin) score += 3;
  if (parsed.title) score += 3;
  return Math.min(98, score);
}

/**
 * Uploaded resume updates profile fields — but only when parse produced data.
 * Empty arrays from a weak/heuristic parse must not wipe existing sections.
 */
export function parsedToProfilePatch(
  parsed: ParsedResume,
  fileName: string,
): Partial<UserProfile> {
  const locations = parsed.location
    ? [parsed.location].filter((l) => !/^remote$/i.test(l.trim()))
    : [];

  const educationLines = parsed.education.length
    ? parsed.education
    : parsed.educationEntries.map((e) =>
        [e.degree, e.field, e.school].filter(Boolean).join(' — '),
      );

  return {
    displayName: parsed.name || undefined,
    phone: parsed.phone || undefined,
    title: parsed.title || undefined,
    linkedinUrl: parsed.linkedin || undefined,
    website: parsed.website || undefined,
    location: parsed.location || undefined,
    skills: parsed.skills.length ? parsed.skills : undefined,
    experienceYears: parsed.experience || undefined,
    education: educationLines.length ? educationLines : undefined,
    summary: parsed.summary || undefined,
    preferredLocations: locations.length ? locations : undefined,
    remotePreference: /remote/i.test(parsed.location) ? 'remote' : undefined,
    experienceEntries: parsed.experienceEntries.length ? parsed.experienceEntries : undefined,
    educationEntries: parsed.educationEntries.length ? parsed.educationEntries : undefined,
    projects: parsed.projects.length ? parsed.projects : undefined,
    certifications: parsed.certifications.length ? parsed.certifications : undefined,
    languages: parsed.languages.length ? parsed.languages : undefined,
    achievements: parsed.achievements.length ? parsed.achievements : undefined,
    atsScore: scoreAts(parsed),
    resumeFileName: fileName,
    resumeParsedAt: new Date().toISOString(),
  };
}
