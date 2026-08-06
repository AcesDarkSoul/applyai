import { env } from '../config/env';
import { logger } from '../config/logger';
import type { UserProfile } from '../domain/user';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;

const SKILL_CATALOG = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift',
  'React', 'React Native', 'Next.js', 'Angular', 'Vue', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask',
  'Spring', 'FastAPI', 'GraphQL', 'REST', 'HTML', 'CSS', 'Tailwind', 'Sass',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Firestore', 'Supabase', 'SQLite',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab',
  'Linux', 'Nginx', 'Kafka', 'RabbitMQ', 'Elasticsearch',
  'OpenAI', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Android', 'iOS', 'Flutter', 'Expo',
  'Jest', 'Cypress', 'Playwright', 'Selenium',
  'Figma', 'Agile', 'Scrum', 'Jira', 'Redux', 'Prisma', 'Webpack', 'Vite',
];

const TITLE_HINTS = [
  'Full Stack Developer', 'Full Stack Engineer', 'Frontend Developer', 'Backend Developer',
  'Software Engineer', 'Software Developer', 'Mobile Developer', 'DevOps Engineer',
  'Data Engineer', 'Data Scientist', 'ML Engineer', 'React Developer', 'Node.js Developer',
  'Java Developer', 'Python Developer', 'Android Developer', 'iOS Developer', 'QA Engineer',
];

const PARSE_PROMPT = `You are a professional resume parser. Extract ALL personal and professional information from the resume text.
Return ONLY valid JSON with this exact structure:
{
  "name": "full name from resume",
  "email": "email or null",
  "phone": "phone with country code if present, or null",
  "location": "city/state/country",
  "title": "most recent or target job title",
  "skills": ["skills"],
  "experience": 0,
  "education": ["degree — school"],
  "summary": "2-4 sentence professional summary tailored for ATS",
  "linkedin": "LinkedIn URL or null"
}
Extract real values only — do not invent data.`;

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
  parseMethod: 'openai' | 'heuristic';
  textChars: number;
};

export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv')) {
    return buffer.toString('utf8').slice(0, 16000);
  }

  if (lower.endsWith('.pdf')) {
    // pdf-parse v1: default export is (buffer) => Promise<{ text }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pdf-parse');
    const pdfParse = (mod.default || mod) as (buf: Buffer) => Promise<{ text?: string }>;
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    if (text.length < 40) {
      throw new Error('PDF has little/no text (scanned image?). Export a text PDF or upload TXT/DOCX.');
    }
    return text.slice(0, 16000);
  }

  if (lower.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();
    if (text.length < 40) throw new Error('DOCX text extraction returned too little content.');
    return text.slice(0, 16000);
  }

  if (lower.endsWith('.doc')) {
    throw new Error('Legacy .doc is not supported. Save as PDF, DOCX, or TXT.');
  }

  const utf8 = buffer.toString('utf8');
  if (utf8.length > 80 && !utf8.includes('\u0000')) return utf8.slice(0, 16000);
  throw new Error(`Unsupported resume type: ${fileName}. Use PDF, DOCX, TXT, or MD.`);
}

function guessName(lines: string[]): string | null {
  for (const line of lines.slice(0, 12)) {
    const t = line.trim().replace(/\s+/g, ' ');
    if (!t || t.length > 60) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /linkedin|github|http/i.test(t)) continue;
    if (/^(resume|curriculum|cv|profile|objective|summary)$/i.test(t)) continue;
    const words = t.split(' ');
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w))) {
      return t;
    }
  }
  return null;
}

function guessTitle(text: string): string {
  const lower = text.toLowerCase();
  for (const title of TITLE_HINTS) {
    if (lower.includes(title.toLowerCase())) return title;
  }
  return 'Software Developer';
}

function guessSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const skill of SKILL_CATALOG) {
    const needle = skill.toLowerCase();
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
    if (re.test(lower) || lower.includes(needle)) found.push(skill);
  }
  return [...new Set(found)].slice(0, 30);
}

function guessExperienceYears(text: string): number {
  const m =
    text.match(/(\d+)\+?\s*(?:\+\s*)?years?\s+(?:of\s+)?(?:experience|exp)/i) ||
    text.match(/experience\s*[:\-]?\s*(\d+)\+?\s*years?/i);
  return m ? Number(m[1]) : 0;
}

function guessEducation(text: string): string[] {
  const out: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/(b\.?tech|b\.?e\.|m\.?tech|m\.?s\.|mba|bachelor|master|bsc|msc|degree)/i.test(line)) {
      out.push(line.slice(0, 120));
    }
    if (out.length >= 4) break;
  }
  return out;
}

function strengthenSummary(parsed: ParsedResume): string {
  if (parsed.summary && parsed.summary.length > 80) return parsed.summary.slice(0, 600);
  const skills = parsed.skills.slice(0, 6).join(', ') || 'software development';
  const years = parsed.experience ? `${parsed.experience}+ years` : 'hands-on';
  return `${parsed.name || 'Candidate'} is a ${parsed.title} with ${years} experience across ${skills}. Seeking roles that leverage these strengths to deliver high-quality product outcomes.`.slice(0, 600);
}

export function parseResumeHeuristic(text: string): ParsedResume {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);
  const linkedinMatch = text.match(LINKEDIN_RE);
  let location = 'Remote';
  for (const line of lines.slice(0, 20)) {
    if (EMAIL_RE.test(line) || LINKEDIN_RE.test(line) || /https?:\/\//i.test(line)) continue;
    if (/(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|india|remote|usa|uk)/i.test(line)) {
      location = line.replace(/\|.*$/, '').trim().slice(0, 80);
      break;
    }
  }

  const base: ParsedResume = {
    name: guessName(lines),
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : null,
    location,
    title: guessTitle(text),
    skills: guessSkills(text),
    experience: guessExperienceYears(text),
    education: guessEducation(text),
    summary: lines.slice(0, 8).join(' ').slice(0, 500),
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    parseMethod: 'heuristic',
    textChars: text.length,
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
      max_tokens: 1600,
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
  const result: ParsedResume = {
    name: typeof parsed.name === 'string' ? parsed.name.trim() : null,
    email: typeof parsed.email === 'string' ? parsed.email : null,
    phone: typeof parsed.phone === 'string' ? parsed.phone : null,
    location: typeof parsed.location === 'string' ? parsed.location : 'Remote',
    title: typeof parsed.title === 'string' ? parsed.title : guessTitle(text),
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 40) : [],
    experience: typeof parsed.experience === 'number' ? parsed.experience : 0,
    education: Array.isArray(parsed.education) ? parsed.education.map(String).slice(0, 6) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 600) : '',
    linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : null,
    parseMethod: 'openai',
    textChars: text.length,
  };
  result.summary = strengthenSummary(result);
  if (!result.skills.length) result.skills = guessSkills(text);
  return result;
}

export async function parseResumeBuffer(buffer: Buffer, fileName: string): Promise<ParsedResume> {
  const text = await extractTextFromBuffer(buffer, fileName);
  if (env.OPENAI_API_KEY) {
    try {
      return await parseResumeWithOpenAI(text);
    } catch (err) {
      logger.warn('OpenAI resume parse failed; using heuristic', {
        err: err instanceof Error ? err.message : err,
      });
    }
  }
  return parseResumeHeuristic(text);
}

/** ATS-style score from how complete/rich the extracted profile is. */
export function scoreAts(parsed: ParsedResume): number {
  let score = 40;
  if (parsed.name) score += 8;
  if (parsed.email) score += 8;
  if (parsed.phone) score += 6;
  if (parsed.skills.length >= 5) score += 12;
  else if (parsed.skills.length >= 2) score += 6;
  if (parsed.summary.length > 120) score += 10;
  if (parsed.experience > 0) score += 8;
  if (parsed.education.length) score += 6;
  if (parsed.linkedin) score += 4;
  if (parsed.title) score += 4;
  return Math.min(98, score);
}

export function parsedToProfilePatch(
  parsed: ParsedResume,
  fileName: string,
): Partial<UserProfile> {
  const locations = parsed.location
    ? [parsed.location].filter((l) => !/^remote$/i.test(l.trim()))
    : [];
  if (/remote/i.test(parsed.location)) {
    // keep remote preference
  }
  return {
    displayName: parsed.name || undefined,
    phone: parsed.phone || undefined,
    title: parsed.title,
    linkedinUrl: parsed.linkedin || undefined,
    skills: parsed.skills.length ? parsed.skills : undefined,
    experienceYears: parsed.experience || undefined,
    education: parsed.education.length ? parsed.education : undefined,
    summary: parsed.summary || undefined,
    preferredLocations: locations.length ? locations : undefined,
    remotePreference: /remote/i.test(parsed.location) ? 'remote' : 'any',
    atsScore: scoreAts(parsed),
    resumeFileName: fileName,
    resumeParsedAt: new Date().toISOString(),
  };
}
