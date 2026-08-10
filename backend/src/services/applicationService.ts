import { randomUUID } from 'crypto';
import type { Application, ApplicationStatus } from '../domain/application';
import type { Job } from '../domain/job';
import type { AuthUser, UserProfile } from '../domain/user';
import { AppError } from '../middleware/errorHandler';
import { applicationRepository } from '../repositories';
import { isPlatformEnabled } from './auditService';
import { isHiringPost } from './contentParse';
import { generateAndSaveCoverLetter, type CoverLetterBundle } from './coverLetterService';
import { jobService } from './jobService';
import { outreachApply, type OutreachResult } from './outreachService';

export type AutoApplyItem = {
  job: Pick<Job, 'id' | 'title' | 'company' | 'applyUrl' | 'source' | 'matchScore'>;
  application: Application;
  outreach: OutreachResult;
  coverLetter: CoverLetterBundle;
};

export type DuplicateApplyHit = {
  kind: 'job' | 'company';
  application: Application;
  message: string;
};

function normalizeCompany(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview',
  'offer',
];

export class ApplicationService {
  list(userId: string): Promise<Application[]> {
    return applicationRepository.listByUser(userId);
  }

  async findDuplicate(
    userId: string,
    job: Pick<Job, 'id' | 'company' | 'title'>,
  ): Promise<DuplicateApplyHit | null> {
    const apps = await applicationRepository.listByUser(userId);
    const active = apps.filter((a) => ACTIVE_STATUSES.includes(a.status));

    const sameJob = active.find((a) => a.jobId === job.id);
    if (sameJob) {
      return {
        kind: 'job',
        application: sameJob,
        message: `You already applied to this role (${sameJob.jobTitle}). Apply again anyway?`,
      };
    }

    const companyKey = normalizeCompany(job.company);
    if (!companyKey) return null;

    const sameCompany = active.find((a) => normalizeCompany(a.company) === companyKey);
    if (sameCompany) {
      return {
        kind: 'company',
        application: sameCompany,
        message: `You already applied to ${sameCompany.company} for “${sameCompany.jobTitle}”. Apply to another role at the same company?`,
      };
    }

    return null;
  }

  async smartApply(
    userId: string,
    job: Job,
    note?: string,
    cover?: { id?: string; content?: string },
  ): Promise<Application> {
    const existing = (await applicationRepository.listByUser(userId)).find(
      (a) => a.jobId === job.id && a.status !== 'withdrawn',
    );
    const now = new Date().toISOString();

    if (existing) {
      const merged: Application = {
        ...existing,
        status: 'applied',
        coverLetter: cover?.content || existing.coverLetter,
        coverLetterId: cover?.id || existing.coverLetterId,
        notes: cover?.content
          ? `${existing.notes}\n[Cover letter]\n${cover.content}`.trim()
          : existing.notes,
        updatedAt: now,
        timeline: [
          ...existing.timeline,
          { status: 'applied', at: now, note: note || 'Smart Apply confirmed' },
        ],
      };
      return applicationRepository.create(merged);
    }

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
      notes: cover?.content ? `[Cover letter]\n${cover.content}` : '',
      coverLetterId: cover?.id,
      coverLetter: cover?.content,
      createdAt: now,
      updatedAt: now,
    };
    return applicationRepository.create(app);
  }

  /**
   * Auto-apply to top resume-matched jobs with an AI cover letter on every apply.
   */
  async autoApplyFromResume(
    auth: AuthUser,
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

    const existing = await applicationRepository.listByUser(auth.uid);
    const alreadyJobIds = new Set(
      existing.filter((a) => a.status !== 'withdrawn' && a.status !== 'rejected').map((a) => a.jobId),
    );
    const alreadyCompanies = new Set(
      existing
        .filter((a) => ['applied', 'viewed', 'interview', 'offer'].includes(a.status))
        .map((a) => a.company.trim().toLowerCase().replace(/\s+/g, ' ')),
    );

    const applied: AutoApplyItem[] = [];
    const skipped: Array<{ jobId: string; title: string; reason: string }> = [];

    for (const job of jobs) {
      if (alreadyJobIds.has(job.id)) {
        skipped.push({ jobId: job.id, title: job.title, reason: 'Already applied' });
        continue;
      }
      const companyKey = job.company.trim().toLowerCase().replace(/\s+/g, ' ');
      if (companyKey && alreadyCompanies.has(companyKey)) {
        skipped.push({
          jobId: job.id,
          title: job.title,
          reason: 'Already applied at this company',
        });
        continue;
      }
      if (!isPlatformEnabled(profile.smartApplyPlatforms, job.source)) {
        skipped.push({
          jobId: job.id,
          title: job.title,
          reason: `Platform disabled in Smart Apply settings (${job.source})`,
        });
        continue;
      }

      const cover = await generateAndSaveCoverLetter(auth, profile, job);
      const outreach = await outreachApply(profile, job, {
        coverLetter: cover.content,
        coverLetterId: cover.id,
      });
      const note =
        outreach.channel === 'email'
          ? outreach.sent
            ? `Auto-apply: emailed AI cover letter to ${outreach.to} from ${outreach.fromAccount || 'your mailbox'}`
            : `Auto-apply email: ${outreach.note}`
          : outreach.channel === 'whatsapp'
            ? outreach.sent
              ? `Auto-apply: WhatsApp pitch to ${outreach.to} (background)`
              : `Auto-apply WhatsApp: ${outreach.note}`
            : 'Auto-apply: cover letter saved (no public contact in post — nothing opened)';

      const application = await this.smartApply(auth.uid, job, note, {
        id: cover.id,
        content: cover.content,
      });
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
        coverLetter: cover,
      });
      alreadyJobIds.add(job.id);
      if (companyKey) alreadyCompanies.add(companyKey);
    }

    return {
      queryHint: [profile.title, ...(profile.skills || []).slice(0, 3)].filter(Boolean).join(' · '),
      applied,
      skipped,
      applyUrls: [],
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
