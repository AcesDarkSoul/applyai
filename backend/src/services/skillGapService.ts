import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { aiService } from './aiService';
import { computeMatch } from './matchingService';

const STOP = new Set([
  'and',
  'the',
  'with',
  'for',
  'from',
  'that',
  'this',
  'your',
  'our',
  'you',
  'are',
  'will',
  'have',
  'has',
  'been',
  'into',
  'using',
  'work',
  'role',
  'team',
  'years',
  'year',
  'experience',
  'required',
  'requirements',
  'preferred',
  'ability',
  'strong',
  'good',
  'etc',
  'etc.',
  'such',
  'including',
  'must',
  'should',
  'able',
  'across',
  'within',
  'about',
  'other',
  'their',
  'they',
  'them',
  'also',
  'well',
  'plus',
]);

/** Common tech / role skill phrases to extract from JDs. */
const KNOWN_SKILLS = [
  'javascript',
  'typescript',
  'python',
  'java',
  'kotlin',
  'swift',
  'golang',
  'go',
  'rust',
  'c++',
  'c#',
  'ruby',
  'php',
  'scala',
  'react',
  'react native',
  'next.js',
  'nextjs',
  'vue',
  'angular',
  'node.js',
  'nodejs',
  'express',
  'nestjs',
  'django',
  'flask',
  'fastapi',
  'spring',
  'android',
  'ios',
  'flutter',
  'jetpack compose',
  'compose',
  'swiftui',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'k8s',
  'terraform',
  'ci/cd',
  'jenkins',
  'github actions',
  'graphql',
  'rest',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'elasticsearch',
  'kafka',
  'spark',
  'hadoop',
  'machine learning',
  'deep learning',
  'nlp',
  'llm',
  'openai',
  'pytorch',
  'tensorflow',
  'pandas',
  'numpy',
  'figma',
  'ui/ux',
  'agile',
  'scrum',
  'jira',
  'selenium',
  'playwright',
  'cypress',
  'jest',
  'junit',
  'microservices',
  'system design',
  'data structures',
  'algorithms',
  'oops',
  'oop',
  'html',
  'css',
  'tailwind',
  'sass',
  'redux',
  'zustand',
  'firebase',
  'supabase',
  'prisma',
  'linux',
  'bash',
  'git',
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function profileSkillSet(profile: UserProfile): Set<string> {
  const set = new Set<string>();
  for (const s of profile.skills || []) {
    const n = normalize(s);
    if (n) set.add(n);
    for (const part of n.split(/[\s,/|]+/).filter((p) => p.length > 2)) set.add(part);
  }
  const blob = [
    profile.title || '',
    profile.summary || '',
    ...(profile.experienceEntries || []).flatMap((e) => [
      e.title,
      e.company,
      ...(e.bullets || []),
    ]),
    ...(profile.projects || []).flatMap((p) => [p.name, p.tech || '', p.description]),
    ...(profile.certifications || []),
  ]
    .join(' ')
    .toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    if (blob.includes(skill)) set.add(skill);
  }
  return set;
}

function extractJdSkills(job: Job): string[] {
  const text = `${job.title}\n${job.description}`.toLowerCase();
  const found: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    if (text.includes(skill)) found.push(skill);
  }
  // Also pick capitalized tech-like tokens from JD (heuristic)
  const caps = job.description.match(/\b[A-Z][a-zA-Z+#.]{2,}(?:\s[A-Z][a-zA-Z+#.]{2,})?\b/g) || [];
  for (const c of caps) {
    const n = normalize(c);
    if (n.length < 3 || STOP.has(n) || found.includes(n)) continue;
    if (/developer|engineer|manager|company|responsibility|requirement/.test(n)) continue;
    if (KNOWN_SKILLS.some((k) => k === n || n.includes(k))) found.push(n);
  }
  return [...new Set(found)].slice(0, 24);
}

export type LearningStep = {
  skill: string;
  why: string;
  estimatedHours: number;
  resources: Array<{ title: string; url: string }>;
};

export type SkillGapResult = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  jdSkills: string[];
  learningRoadmap: LearningStep[];
  summary: string;
  aiAssisted: boolean;
};

function defaultResources(skill: string): Array<{ title: string; url: string }> {
  const q = encodeURIComponent(skill);
  return [
    { title: `Learn ${skill} — freeCodeCamp search`, url: `https://www.freecodecamp.org/news/search?query=${q}` },
    { title: `${skill} on MDN / docs search`, url: `https://developer.mozilla.org/en-US/search?q=${q}` },
    { title: `YouTube: ${skill} crash course`, url: `https://www.youtube.com/results?search_query=${q}+tutorial` },
  ];
}

function heuristicRoadmap(missing: string[]): LearningStep[] {
  return missing.slice(0, 6).map((skill, i) => ({
    skill,
    why: `Appears in the job description but is weak or missing on your profile (priority ${i + 1}).`,
    estimatedHours: 8 + i * 4,
    resources: defaultResources(skill),
  }));
}

export async function analyzeSkillGap(
  profile: UserProfile,
  job: Job,
): Promise<SkillGapResult> {
  const breakdown = computeMatch(profile, job);
  const jdSkills = extractJdSkills(job);
  const have = profileSkillSet(profile);
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of jdSkills) {
    const n = normalize(skill);
    const hit =
      have.has(n) ||
      [...have].some((h) => h.includes(n) || n.includes(h));
    if (hit) matchedSkills.push(skill);
    else missingSkills.push(skill);
  }

  let learningRoadmap = heuristicRoadmap(missingSkills);
  let summary = missingSkills.length
    ? `You match ${matchedSkills.length}/${jdSkills.length} key JD skills. Focus next on: ${missingSkills.slice(0, 4).join(', ') || 'general role keywords'}.`
    : `Strong skill overlap with this JD (${matchedSkills.length} matched). Polish bullets that prove these skills.`;
  let aiAssisted = false;

  const ai = await aiService.generateLearningRoadmap(profile, job, missingSkills, matchedSkills);
  if (ai) {
    aiAssisted = true;
    if (ai.summary) summary = ai.summary;
    if (ai.steps?.length) {
      learningRoadmap = ai.steps.map((s) => ({
        skill: s.skill,
        why: s.why,
        estimatedHours: s.estimatedHours,
        resources: s.resources?.length ? s.resources : defaultResources(s.skill),
      }));
    }
  }

  return {
    matchScore: breakdown.overall,
    matchedSkills,
    missingSkills,
    jdSkills,
    learningRoadmap,
    summary,
    aiAssisted,
  };
}
