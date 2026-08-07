import { randomUUID } from 'crypto';
import type { Application, ApplicationStatus } from '../domain/application';
import type { Job } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { AppError } from '../middleware/errorHandler';
import { applicationRepository } from '../repositories';
import { isHiringPost } from './contentParse';
import { jobService } from './jobService';
import { outreachApply, type OutreachResult } from './outreachService';

export type AutoApplyItem = {
  job: Pick<Job, 'id' | 'title' | 'company' | 'applyUrl' | 'source' | 'matchScore'>;
  application: Application;
  outreach: OutreachResult;
};

export class ApplicationService {
  list(userId: string): Promise<Application[]> {
    return applicationRepository.listByUser(userId);
  }

  async smartApply(userId: string, job: Job, note?: string): Promise<Application> {
    const existing = (await applicationRepository.listByUser(userId)).find(
      (a) => a.jobId === job.id && a.status !== 'withdrawn',
    );
    if (existing) {
      return applicationRepository.updateStatus(
        userId,
        existing.id,
        'applied',
        note || 'Smart Apply confirmed',
      );
    }

    const now = new Date().toISOString();
    const app: Application = {
      id: randomUUID(),
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      source: job.source,
      applyUrl: job.applyUrl,
      status: 'applied',
      timeline: [
        {
          status: 'applied',
          at: now,
          note: note || 'Smart Apply confirmed — opened official posting',
        },
      ],
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    return applicationRepository.create(app);
  }

  /**
   * Auto-apply to top resume-matched jobs:
   * email/WhatsApp when contacts exist, otherwise Smart Apply URL + tracked application.
   */
  async autoApplyFromResume(
    userId: string,
    profile: UserProfile,
    opts?: {
      minScore?: number;
      limit?: number;
      boardOnly?: boolean;
    },
  ): Promise<{
    queryHint: string;
    applied: AutoApplyItem[];
    skipped: Array<{ jobId: string; title: string; reason: string }>;
    applyUrls: string[];
  }> {
    if (!profile.summary && !(profile.skills?.length > 2) && !profile.title) {
      throw new AppError(
        400,
        'Upload your resume on Profile first so we can match jobs and apply.',
        'PROFILE_INCOMPLETE',
      );
    }

    const minScore = opts?.minScore ?? 55;
    const limit = Math.min(Math.max(opts?.limit ?? 8, 1), 20);
    let jobs = await jobService.recommended(profile, { minScore, limit: limit * 3 });
    if (opts?.boardOnly) {
      jobs = jobs.filter((j) => !isHiringPost(j));
    }
    jobs = jobs.slice(0, limit);

    const existing = await applicationRepository.listByUser(userId);
    const already = new Set(
      existing.filter((a) => a.status !== 'withdrawn').map((a) => a.jobId),
    );

    const applied: AutoApplyItem[] = [];
    const skipped: Array<{ jobId: string; title: string; reason: string }> = [];
    const applyUrls: string[] = [];

    for (const job of jobs) {
      if (already.has(job.id)) {
        skipped.push({ jobId: job.id, title: job.title, reason: 'Already applied' });
        continue;
      }

      const outreach = await outreachApply(profile, job);
      const note =
        outreach.channel === 'email'
          ? outreach.sent
            ? `Auto-apply: emailed ${outreach.to}`
            : `Auto-apply email draft: ${outreach.note}`
          : outreach.channel === 'whatsapp'
            ? outreach.sent
              ? `Auto-apply: WhatsApp ${outreach.to}`
              : `Auto-apply WhatsApp: ${outreach.note}`
            : 'Auto-apply: Smart Apply — complete on official posting';

      const application = await this.smartApply(userId, job, note);
      applied.push({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          applyUrl: job.applyUrl,
          source: job.source,
          matchScore: job.matchScore,
        },
        application,
        outreach,
      });
      if (outreach.channel === 'smart_apply' || (outreach.channel === 'whatsapp' && !outreach.sent)) {
        applyUrls.push(outreach.waLink || job.applyUrl);
      }
      already.add(job.id);
    }

    return {
      queryHint: [profile.title, ...(profile.skills || []).slice(0, 3)].filter(Boolean).join(' · '),
      applied,
      skipped,
      applyUrls: [...new Set(applyUrls)],
    };
  }

  async updateStatus(
    userId: string,
    id: string,
    status: ApplicationStatus,
    note?: string,
  ): Promise<Application> {
    return applicationRepository.updateStatus(userId, id, status, note);
  }

  async getStats(userId: string) {
    const apps = await this.list(userId);
    return {
      total: apps.length,
      applied: apps.filter((a) => a.status === 'applied' || a.status === 'viewed').length,
      interview: apps.filter((a) => a.status === 'interview').length,
      offer: apps.filter((a) => a.status === 'offer').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      saved: apps.filter((a) => a.status === 'saved').length,
    };
  }

  async requireOwned(userId: string, id: string): Promise<Application> {
    const app = await applicationRepository.getById(userId, id);
    if (!app) throw new AppError(404, 'Application not found', 'NOT_FOUND');
    return app;
  }
}

export const applicationService = new ApplicationService();
