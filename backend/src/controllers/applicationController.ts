import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { assertAssistiveConsent } from './complianceController';
import { applicationService } from '../services/applicationService';
import { auditService, isPlatformEnabled, platformKeyFromSource } from '../services/auditService';
import { generateAndSaveCoverLetter } from '../services/coverLetterService';
import { jobService } from '../services/jobService';
import { notificationService } from '../services/notificationService';
import { outreachApply } from '../services/outreachService';
import { profileService } from '../services/profileService';
import { syncApplicationStatuses } from '../services/statusSyncService';

const smartApplySchema = z.object({
  jobId: z.string().min(1),
  confirmed: z.literal(true),
  confirmedAssistiveOnly: z.literal(true),
  /** Required when a prior job/company application exists */
  acknowledgeDuplicate: z.boolean().optional(),
});

const outreachApplySchema = z.object({
  jobId: z.string().min(1),
  confirmed: z.literal(true),
  confirmedAssistiveOnly: z.literal(true),
  acknowledgeDuplicate: z.boolean().optional(),
});

const checkDuplicateSchema = z.object({
  jobId: z.string().min(1),
});

const autoApplySchema = z.object({
  confirmed: z.literal(true),
  confirmedAssistiveOnly: z.literal(true),
  minScore: z.number().min(0).max(100).optional().default(55),
  limit: z.number().min(1).max(20).optional().default(8),
  boardOnly: z.boolean().optional().default(true),
});

const statusSchema = z.object({
  status: z.enum(['saved', 'applied', 'viewed', 'interview', 'offer', 'rejected', 'withdrawn']),
  note: z.string().max(2000).optional(),
});

export async function listApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await applicationService.list(req.user!.uid);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checkDuplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobId } = checkDuplicateSchema.parse(req.query);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');
    const duplicate = await applicationService.findDuplicate(req.user!.uid, job);
    res.json({
      success: true,
      data: {
        duplicate: Boolean(duplicate),
        kind: duplicate?.kind ?? null,
        message: duplicate?.message ?? null,
        application: duplicate?.application ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function smartApply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = smartApplySchema.parse(req.body);
    assertAssistiveConsent(body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(body.jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    if (!isPlatformEnabled(profile.smartApplyPlatforms, job.source)) {
      throw new AppError(
        403,
        `Smart Apply is disabled for ${platformKeyFromSource(job.source)} in your settings.`,
        'PLATFORM_DISABLED',
      );
    }

    const duplicate = await applicationService.findDuplicate(req.user!.uid, job);
    if (duplicate && !body.acknowledgeDuplicate) {
      throw new AppError(409, duplicate.message, 'DUPLICATE_APPLY', {
        kind: duplicate.kind,
        applicationId: duplicate.application.id,
      });
    }

    const cover = await generateAndSaveCoverLetter(req.user!, profile, job);
    const application = await applicationService.smartApply(
      req.user!.uid,
      job,
      'Smart Apply — assistive only: AI cover letter prepared; official posting tracked (you submit on the site)',
      { id: cover.id, content: cover.content },
    );

    await auditService.append(
      req.user!.uid,
      'smart_apply',
      `Assistive Smart Apply for ${job.title} @ ${job.company}`,
      {
        jobId: job.id,
        applicationId: application.id,
        platform: platformKeyFromSource(job.source),
        confirmedAssistiveOnly: true,
        metadata: {
          applyUrl: job.applyUrl,
          duplicateAcknowledged: Boolean(body.acknowledgeDuplicate),
          duplicateKind: duplicate?.kind,
        },
      },
    );

    if (!profile.smartApplyConsentAt) {
      await profileService.update(req.user!, {
        smartApplyConsentAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: {
        application,
        applyUrl: job.applyUrl,
        coverLetter: cover.content,
        coverLetterId: cover.id,
        duplicateAcknowledged: Boolean(duplicate),
        complianceNote:
          'Assistive only (AD-002): Smart Apply prepares an AI cover letter and tracks the role. You paste/submit on the official site — ApplyAI does not auto-submit third-party forms.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function outreachApplyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = outreachApplySchema.parse(req.body);
    assertAssistiveConsent(body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(body.jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    if (!isPlatformEnabled(profile.smartApplyPlatforms, job.source)) {
      throw new AppError(
        403,
        `Outreach apply is disabled for ${platformKeyFromSource(job.source)} in your settings.`,
        'PLATFORM_DISABLED',
      );
    }

    if (
      !profile.resumeId &&
      !profile.resumeFileName &&
      !profile.summary &&
      !profile.title &&
      !(profile.skills?.length > 0)
    ) {
      throw new AppError(
        400,
        'Upload your resume on Profile first so outreach can write your cover letter.',
        'PROFILE_INCOMPLETE',
      );
    }

    const duplicate = await applicationService.findDuplicate(req.user!.uid, job);
    if (duplicate && !body.acknowledgeDuplicate) {
      throw new AppError(409, duplicate.message, 'DUPLICATE_APPLY', {
        kind: duplicate.kind,
        applicationId: duplicate.application.id,
      });
    }

    const cover = await generateAndSaveCoverLetter(req.user!, profile, job);
    const outreach = await outreachApply(profile, job, {
      coverLetter: cover.content,
      coverLetterId: cover.id,
    });
    const note =
      outreach.channel === 'email'
        ? outreach.sent
          ? `Emailed AI cover letter from ${outreach.fromAccount || 'your mailbox'} (background)`
          : outreach.note
        : outreach.channel === 'whatsapp'
          ? outreach.sent
            ? 'WhatsApp pitch sent via your Business API (background — app not opened)'
            : outreach.note
          : outreach.note;

    const application = await applicationService.smartApply(req.user!.uid, job, note, {
      id: cover.id,
      content: cover.content,
    });

    await auditService.append(
      req.user!.uid,
      'outreach_apply',
      `Outreach apply (${outreach.channel}) for ${job.title} @ ${job.company}`,
      {
        jobId: job.id,
        applicationId: application.id,
        platform: platformKeyFromSource(job.source),
        confirmedAssistiveOnly: true,
        metadata: { channel: outreach.channel, sent: outreach.sent },
      },
    );

    res.status(201).json({
      success: true,
      data: {
        application,
        outreach,
        applyUrl: job.applyUrl,
        coverLetter: cover.content,
        coverLetterId: cover.id,
        openedExternal: false,
        complianceNote:
          'Assistive outreach uses your own SMTP/WhatsApp credentials when enabled. No third-party form bots.',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function autoApplyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = autoApplySchema.parse(req.body);
    assertAssistiveConsent(body);
    const profile = await profileService.getOrCreate(req.user!);
    const result = await applicationService.autoApplyFromResume(req.user!, profile, {
      minScore: body.minScore,
      limit: body.limit,
      boardOnly: body.boardOnly,
    });

    await auditService.append(
      req.user!.uid,
      'auto_apply',
      `Batch assistive auto-apply: ${result.applied.length} applied, ${result.skipped.length} skipped`,
      {
        confirmedAssistiveOnly: true,
        metadata: {
          applied: result.applied.length,
          skipped: result.skipped.length,
          minScore: body.minScore,
        },
      },
    );

    res.status(201).json({
      success: true,
      data: {
        ...result,
        complianceNote:
          'Each auto-apply generates an AI cover letter from your resume. Emails/WhatsApp when contacts exist; otherwise official apply links are tracked with the letter ready to paste. Per-platform toggles are honored (AD-002).',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = statusSchema.parse(req.body);
    const previous = await applicationService.requireOwned(req.user!.uid, req.params.id);
    const data = await applicationService.updateStatus(
      req.user!.uid,
      req.params.id,
      body.status,
      body.note,
    );

    if (
      (body.status === 'interview' || body.status === 'offer') &&
      previous.status !== body.status
    ) {
      const profile = await profileService.getOrCreate(req.user!);
      await notificationService.notifyInterviewUpdate(profile, data);
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function syncStatuses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = z
      .object({ applicationId: z.string().optional() })
      .parse(req.body || {});
    const data = await syncApplicationStatuses(req.user!.uid, {
      applicationId: body.applicationId,
    });
    res.json({
      success: true,
      data: {
        ...data,
        note: 'Auto-sync uses timeline age + keyword heuristics only — no portal scraping (AD-002).',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await applicationService.getStats(req.user!.uid);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
