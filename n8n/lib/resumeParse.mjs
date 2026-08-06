/**
 * Resume text extraction + profile parsing for ApplyAI n8n outreach.
 * Prefer OpenAI when OPENAI_API_KEY is set; otherwise heuristic extract.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i;

const SKILL_CATALOG = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift",
  "React", "React Native", "Next.js", "Angular", "Vue", "Node.js", "Express", "NestJS", "Django", "Flask",
  "Spring", "FastAPI", "GraphQL", "REST", "HTML", "CSS", "Tailwind", "Sass",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Firestore", "Supabase", "SQLite",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "GitHub", "GitLab",
  "Linux", "Nginx", "Kafka", "RabbitMQ", "Elasticsearch",
  "OpenAI", "TensorFlow", "PyTorch", "Pandas", "NumPy",
  "Android", "iOS", "Flutter", "Expo",
  "Jest", "Cypress", "Playwright", "Selenium",
  "Figma", "Agile", "Scrum", "Jira",
];

const TITLE_HINTS = [
  "Full Stack Developer",
  "Full Stack Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Software Engineer",
  "Software Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "Data Engineer",
  "Data Scientist",
  "ML Engineer",
  "React Developer",
  "Node.js Developer",
  "Java Developer",
  "Python Developer",
  "Android Developer",
  "iOS Developer",
  "QA Engineer",
  "SDE",
  "SDE-1",
  "SDE-2",
];

const PARSE_PROMPT = `You are a professional resume parser. Extract ALL personal and professional information from the resume text.
Return ONLY valid JSON with this exact structure:
{
  "name": "full name from resume",
  "email": "email or null",
  "phone": "phone number with country code if present, or null",
  "location": "city/state/country from resume address section",
  "title": "most recent or target job title",
  "skills": ["technical and soft skills"],
  "experience": number (total years of professional experience),
  "summary": "2-4 sentence professional summary from resume",
  "linkedin": "LinkedIn URL if present, else null"
}
Extract real values only — do not invent data. Use null or empty arrays for missing fields.`;

export async function extractTextFromFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Resume not found: ${abs}`);
  }

  const lower = abs.toLowerCase();
  const buffer = fs.readFileSync(abs);

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf8").slice(0, 12000);
  }

  if (lower.endsWith(".pdf")) {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      const text = (data.text || "").trim();
      if (text.length > 40) return text.slice(0, 12000);
      throw new Error("PDF text layer empty (scanned PDF?)");
    } catch (err) {
      if (String(err.message || err).includes("Cannot find module")) {
        throw new Error(
          'PDF support needs pdf-parse. Run: npm install pdf-parse --prefix "d:\\jobportal project\\n8n"'
        );
      }
      throw err;
    }
  }

  if (lower.endsWith(".docx")) {
    throw new Error(
      "DOCX not supported in local sync yet. Save/export resume as PDF or TXT, then retry."
    );
  }

  // Last resort: utf8
  const utf8 = buffer.toString("utf8");
  if (utf8.length > 80 && !utf8.includes("\u0000")) return utf8.slice(0, 12000);
  throw new Error(`Unsupported resume type: ${path.extname(abs)}`);
}

function guessName(lines) {
  for (const line of lines.slice(0, 12)) {
    const t = line.trim().replace(/\s+/g, " ");
    if (!t || t.length > 60) continue;
    if (EMAIL_RE.test(t) || PHONE_RE.test(t) || /linkedin|github|http/i.test(t)) continue;
    if (/^(resume|curriculum|cv|profile|objective|summary)$/i.test(t)) continue;
    const words = t.split(" ");
    if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w))) {
      return t;
    }
  }
  return null;
}

function guessTitle(text) {
  const lower = text.toLowerCase();
  for (const title of TITLE_HINTS) {
    if (lower.includes(title.toLowerCase())) return title;
  }
  return "Software Developer";
}

function guessSkills(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const skill of SKILL_CATALOG) {
    const needle = skill.toLowerCase();
    if (needle.includes("+") || needle.includes("#") || needle.includes(".")) {
      // plain includes for skills with regex metacharacters
      if (lower.includes(needle)) found.push(skill);
      continue;
    }
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.push(skill);
  }
  return [...new Set(found)].slice(0, 25);
}

function guessExperienceYears(text) {
  const m =
    text.match(/(\d+)\+?\s*(?:\+\s*)?years?\s+(?:of\s+)?(?:experience|exp)/i) ||
    text.match(/experience\s*[:\-]?\s*(\d+)\+?\s*years?/i);
  if (m) return Number(m[1]);
  return 0;
}

export function parseResumeHeuristic(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);
  const linkedinMatch = text.match(LINKEDIN_RE);
  const skills = guessSkills(text);
  const title = guessTitle(text);
  const name = guessName(lines) || "Your Name";

  // crude location: line with city keywords
  let location = "Remote";
  for (const line of lines.slice(0, 20)) {
    if (/(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|india|remote)/i.test(line)) {
      location = line.slice(0, 80);
      break;
    }
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/\s+/g, " ").trim() : null,
    location,
    title,
    skills,
    experience: guessExperienceYears(text),
    summary: lines.slice(0, 6).join(" ").slice(0, 400),
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    parseMethod: "heuristic",
  };
}

export async function parseResumeWithOpenAI(text, apiKey) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PARSE_PROMPT },
        { role: "user", content: text.slice(0, 12000) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
  return {
    name: typeof parsed.name === "string" ? parsed.name.trim() : null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    location: parsed.location || "Remote",
    title: parsed.title || guessTitle(text),
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 40) : [],
    experience: typeof parsed.experience === "number" ? parsed.experience : 0,
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 500) : "",
    linkedin: parsed.linkedin || null,
    parseMethod: "openai",
  };
}

export async function parseResumeFile(filePath, { openaiKey } = {}) {
  const text = await extractTextFromFile(filePath);
  if (openaiKey) {
    try {
      return {
        ...(await parseResumeWithOpenAI(text, openaiKey)),
        sourceFile: path.resolve(filePath),
        textChars: text.length,
      };
    } catch (err) {
      console.warn("OpenAI parse failed, falling back to heuristic:", err.message || err);
    }
  }
  return {
    ...parseResumeHeuristic(text),
    sourceFile: path.resolve(filePath),
    textChars: text.length,
  };
}

export function toCandidateConfig(parsed, extras = {}) {
  const title = parsed.title || "Software Developer";
  const location = parsed.location || "India";
  const skills = (parsed.skills || []).map(String).filter(Boolean);
  return {
    name: parsed.name || "Your Name",
    email: parsed.email || "",
    phone: parsed.phone || "",
    title,
    location,
    yearsExperience: Number(parsed.experience || 0),
    skills,
    resumeUrl: extras.resumeUrl || "",
    resumeFile: parsed.sourceFile || "",
    linkedin: parsed.linkedin || "",
    summary: parsed.summary || "",
    parseMethod: parsed.parseMethod || "unknown",
    searchQueries: [
      `${title} ${/india|in\b/i.test(location) ? "India" : location}`.trim(),
      skills.slice(0, 2).length
        ? `${skills.slice(0, 2).join(" ")} Developer India`
        : `${title} Remote`,
    ],
    platforms: ["linkedin", "indeed", "naukri"],
    dailyEmailLimit: 10,
    dailySmsLimit: 5,
    minMatchScore: 50,
    updatedAt: new Date().toISOString(),
  };
}

export function upsertEnvCandidate(envText, candidate) {
  const map = {
    CANDIDATE_NAME: candidate.name || "",
    CANDIDATE_EMAIL: candidate.email || "",
    CANDIDATE_PHONE: candidate.phone || "",
    CANDIDATE_SKILLS: (candidate.skills || []).join(","),
    CANDIDATE_TITLE: candidate.title || "",
    CANDIDATE_LOCATION: candidate.location || "",
    CANDIDATE_RESUME_URL: candidate.resumeUrl || candidate.resumeFile || "",
    CANDIDATE_YEARS_EXP: String(candidate.yearsExperience ?? 0),
    JSEARCH_QUERY:
      (candidate.searchQueries && candidate.searchQueries[0]) ||
      `${candidate.title || "Software Developer"} India`,
  };

  let out = envText;
  for (const [key, value] of Object.entries(map)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(out)) out = out.replace(re, line);
    else out += `\n${line}\n`;
  }
  return out;
}
