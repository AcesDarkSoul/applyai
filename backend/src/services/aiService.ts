import OpenAI from 'openai';
import { env } from '../config/env';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { AppError } from '../middleware/errorHandler';

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
      const completion = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You write concise, professional cover letters (3-4 paragraphs). No fabricated credentials. Label tone as confident and specific.',
          },
          {
            role: 'user',
            content: `Candidate: ${profile.displayName}
Skills: ${profile.skills.join(', ')}
Summary: ${profile.summary || 'N/A'}
Experience years: ${profile.experienceYears ?? 'N/A'}

Job: ${job.title} at ${job.company}
Location: ${job.location}
Description: ${job.description.slice(0, 3000)}

Write a tailored cover letter.`,
          },
        ],
      });
      return completion.choices[0]?.message?.content?.trim() || this.demoCoverLetter(profile, job);
    } catch {
      throw new AppError(502, 'AI provider failed', 'AI_ERROR');
    }
  }

  private demoCoverLetter(profile: UserProfile, job: Job): string {
    return `Dear Hiring Manager,

I am excited to apply for the ${job.title} role at ${job.company}. With a background spanning ${profile.skills.slice(0, 5).join(', ') || 'software engineering'}, I am confident I can contribute quickly to your team.

${profile.summary || 'I build reliable product experiences and enjoy collaborating across design and backend teams.'} Your focus on ${job.isRemote ? 'remote collaboration' : job.location} aligns well with my preferences.

I would welcome the opportunity to discuss how my experience can support ${job.company}'s goals.

Sincerely,
${profile.displayName}

— AI-assisted draft (demo mode). Please review before sending.`;
  }
}

export const aiService = new AiService();
