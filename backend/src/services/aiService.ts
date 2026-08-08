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
}

export const aiService = new AiService();
