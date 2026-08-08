import fs from 'fs';
import {
  extractTextFromBuffer,
  parseResumeBuffer,
  parseResumeHeuristic,
} from '../src/services/resumeParseService.ts';

const file = process.argv[2] || 'C:/Users/sagar/Downloads/sagar_resume.pdf';
const buf = fs.readFileSync(file);
const name = file.split(/[/\\]/).pop() || 'resume.pdf';

const text = await extractTextFromBuffer(buf, name);
console.log('textChars', text.length);

const h = parseResumeHeuristic(text);
console.log(
  'heuristic',
  JSON.stringify(
    {
      name: h.name,
      email: h.email,
      phone: h.phone,
      title: h.title,
      skills: h.skills.slice(0, 15),
      experienceYears: h.experience,
      expCount: h.experienceEntries.length,
      experiences: h.experienceEntries.map((e) => ({
        title: e.title,
        company: e.company,
        dates: `${e.startDate}-${e.endDate}`,
        bullets: e.bullets.length,
      })),
      edu: h.education,
      projects: h.projects.map((p) => p.name),
      certs: h.certifications,
      achievements: h.achievements.slice(0, 3),
      summary: h.summary.slice(0, 160),
      linkedin: h.linkedin,
    },
    null,
    2,
  ),
);

const full = await parseResumeBuffer(buf, name);
console.log(
  'full',
  JSON.stringify(
    {
      method: full.parseMethod,
      name: full.name,
      exp: full.experienceEntries.length,
      projects: full.projects.length,
      skills: full.skills.length,
    },
    null,
    2,
  ),
);
