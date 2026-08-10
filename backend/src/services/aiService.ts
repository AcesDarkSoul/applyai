import OpenAI from 'openai';
import { env } from '../config/env';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { logger } from '../config/logger';

export class AiService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI | null {
    if (!env.OPENAI_API_KEY) return null;
    if (!this.client) this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    return this.client;
  }

  async generateCoverLetter(profile: UserProfile, job: Job): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return this.demoCoverLetter(profile, job);
    }

    try {
      const experience = (profile.experienceEntries || [])
        .slice(0, 4)
        .map(
          (e) =>
            `- ${e.title} at ${e.company} (${e.startDate || '?'}–${e.endDate || '?'}): ${(e.bullets || []).slice(0, 2).join('; ')}`,
        )
        .join('\n');
      const projects = (profile.projects || [])
        .slice(0, 3)
        .map((p) => `- ${p.name}: ${(p.description || '').slice(0, 120)}`)
        .join('\n');

      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.65,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content: `You write concise, professional cover letters for job applications.
Rules:
- 3–4 short paragraphs, ready to paste into an email or application form.
- Use only facts from the candidate profile — never invent employers, degrees, or metrics.
- Mirror keywords from the job description naturally.
- Start with "Dear Hiring Manager," and end with "Sincerely," + candidate name.
- No markdown, no bullet lists, no subject line.`,
          },
          {
            role: 'user',
            content: `Candidate name: ${profile.displayName}
Target title: ${profile.title || 'Software Developer'}
Email: ${profile.email}
Phone: ${profile.phone || 'N/A'}
Skills: ${(profile.skills || []).slice(0, 18).join(', ') || 'N/A'}
Years of experience: ${profile.experienceYears ?? 'N/A'}
Summary: ${(profile.summary || 'N/A').slice(0, 600)}
Recent experience:
${experience || 'N/A'}
Projects:
${projects || 'N/A'}
Education: ${(profile.education || []).slice(0, 3).join('; ') || 'N/A'}

Job title: ${job.title}
Company: ${job.company}
Location: ${job.location}${job.isRemote ? ' (remote OK)' : ''}
Job description:
${(job.description || '').slice(0, 3500)}

Write a tailored cover letter for this application.`,
          },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      return text || this.demoCoverLetter(profile, job);
    } catch (err) {
      logger.warn('OpenAI cover letter failed; using heuristic draft', {
        err: err instanceof Error ? err.message : err,
      });
      return this.demoCoverLetter(profile, job);
    }
  }

  private demoCoverLetter(profile: UserProfile, job: Job): string {
    const name = profile.displayName || 'Candidate';
    const title = profile.title || 'Software Developer';
    const skills = (profile.skills || []).slice(0, 8).join(', ') || 'software development';
    const years = profile.experienceYears
      ? `${profile.experienceYears}+ years of experience`
      : 'hands-on experience';
    const highlight =
      profile.experienceEntries?.[0]
        ? `Most recently as ${profile.experienceEntries[0].title} at ${profile.experienceEntries[0].company}, I delivered work aligned with roles like yours.`
        : `I focus on shipping reliable product experiences that match what ${job.company} is hiring for.`;
    const summary =
      (profile.summary || '').trim().slice(0, 320) ||
      `I bring ${years} across ${skills}, with a strong interest in the ${job.title} role.`;

    return `Dear Hiring Manager,

I am writing to apply for the ${job.title} position at ${job.company}. As a ${title} with ${years}, I am excited by the opportunity to contribute to your team.

${summary}

${highlight} My core strengths include ${skills}, which map well to the requirements in your posting${job.isRemote ? ' and I am comfortable working remotely' : ''}.

I would welcome the chance to discuss how I can support ${job.company}'s goals. Thank you for your time and consideration.

Sincerely,
${name}
${profile.email}${profile.phone ? `\n${profile.phone}` : ''}${profile.linkedinUrl ? `\n${profile.linkedinUrl}` : ''}

— AI-assisted draft from your resume. Review before sending.`;
  }

  async generateLearningRoadmap(
    profile: UserProfile,
    job: Job,
    missingSkills: string[],
    matchedSkills: string[],
  ): Promise<{
    summary: string;
    steps: Array<{
      skill: string;
      why: string;
      estimatedHours: number;
      resources: Array<{ title: string; url: string }>;
    }>;
  } | null> {
    const client = this.getClient();
    if (!client || !missingSkills.length) return null;

    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a career coach. Return JSON:
{"summary":"string","steps":[{"skill":"string","why":"string","estimatedHours":number,"resources":[{"title":"string","url":"string"}]}]}
Rules: 3–6 steps max; realistic hours; only real public learning URLs (docs, freeCodeCamp, Coursera, YouTube search, official docs). Never invent credentials the candidate lacks.`,
          },
          {
            role: 'user',
            content: `Candidate title: ${profile.title || 'N/A'}
Skills they have: ${(profile.skills || []).slice(0, 20).join(', ') || 'N/A'}
Matched vs JD: ${matchedSkills.join(', ') || 'none'}
Missing vs JD: ${missingSkills.join(', ')}
Job: ${job.title} at ${job.company}
JD excerpt: ${(job.description || '').slice(0, 2000)}`,
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim();
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        summary?: string;
        steps?: Array<{
          skill: string;
          why: string;
          estimatedHours: number;
          resources?: Array<{ title: string; url: string }>;
        }>;
      };
      return {
        summary: parsed.summary || '',
        steps: (parsed.steps || []).slice(0, 6).map((s) => ({
          skill: s.skill,
          why: s.why,
          estimatedHours: Number(s.estimatedHours) || 10,
          resources: (s.resources || []).slice(0, 3),
        })),
      };
    } catch (err) {
      logger.warn('Learning roadmap AI failed', {
        err: err instanceof Error ? err.message : err,
      });
      return null;
    }
  }

  /**
   * Generate ATS-oriented resume field tweaks for a specific JD.
   * Facts stay grounded in the profile — no invented employers/metrics.
   */
  async tailorResumeForJob(
    profile: UserProfile,
    job: Job,
  ): Promise<{
    summary: string;
    skillsOrder: string[];
    highlightBullets: string[];
    notes: string[];
  } | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.35,
        max_tokens: 1100,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You tailor resumes for ATS keyword alignment. Return JSON:
{"summary":"2-4 sentences","skillsOrder":["skill"],"highlightBullets":["bullet"],"notes":["what changed"]}
Rules: Use ONLY facts from the candidate. Reorder/rephrase; never invent employers, degrees, or metrics. Mirror JD keywords naturally.`,
          },
          {
            role: 'user',
            content: `Name: ${profile.displayName}
Title: ${profile.title || ''}
Current summary: ${(profile.summary || '').slice(0, 800)}
Skills: ${(profile.skills || []).slice(0, 30).join(', ')}
Experience:
${(profile.experienceEntries || [])
  .slice(0, 4)
  .map(
    (e) =>
      `- ${e.title} @ ${e.company}: ${(e.bullets || []).slice(0, 3).join(' | ')}`,
  )
  .join('\n')}

Target job: ${job.title} @ ${job.company}
JD:
${(job.description || '').slice(0, 3500)}`,
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim();
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        summary?: string;
        skillsOrder?: string[];
        highlightBullets?: string[];
        notes?: string[];
      };
      return {
        summary: (parsed.summary || profile.summary || '').trim(),
        skillsOrder: parsed.skillsOrder || profile.skills || [],
        highlightBullets: parsed.highlightBullets || [],
        notes: parsed.notes || ['AI tailored summary and skill order toward the JD'],
      };
    } catch (err) {
      logger.warn('Resume tailor AI failed', {
        err: err instanceof Error ? err.message : err,
      });
      return null;
    }
  }
}

export const aiService = new AiService();
