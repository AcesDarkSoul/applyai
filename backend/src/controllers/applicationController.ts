import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { applicationService } from '../services/applicationService';
import { generateAndSaveCoverLetter } from '../services/coverLetterService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { outreachApply } from '../services/outreachService';

const smartApplySchema = z.object({
  jobId: z.string().min(1),
  confirmed: z.literal(true),
});

const outreachApplySchema = z.object({
  jobId: z.string().min(1),
  confirmed: z.literal(true),
});

const autoApplySchema = z.object({
  confirmed: z.literal(true),
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

export async function smartApply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = smartApplySchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(body.jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    const cover = await generateAndSaveCoverLetter(req.user!, profile, job);
    const application = await applicationService.smartApply(
      req.user!.uid,
      job,
      'Smart Apply — AI cover letter generated for this posting',
      { id: cover.id, content: cover.content },
    );

    res.status(201).json({
      success: true,
      data: {
        application,
        applyUrl: job.applyUrl,
        coverLetter: cover.content,
        coverLetterId: cover.id,
        complianceNote:
          'Smart Apply opens the official job posting and prepares an AI cover letter you can paste on the site.',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Auto outreach apply with AI cover letter:
 * - email → send cover letter
 * - phone → WhatsApp pitch from cover letter
 * - else → Smart Apply URL + cover letter draft
 */
export async function outreachApplyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = outreachApplySchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(body.jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    if (!profile.summary && !(profile.skills?.length > 2) && !profile.title) {
      throw new AppError(
        400,
        'Upload your resume on Profile first so outreach can write your cover letter.',
        'PROFILE_INCOMPLETE',
      );
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

    res.status(201).json({
      success: true,
      data: {
        application,
        outreach,
        applyUrl: job.applyUrl,
        coverLetter: cover.content,
        coverLetterId: cover.id,
        openedExternal: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Batch auto-apply to top resume-matched jobs — each gets an AI cover letter. */
export async function autoApplyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = autoApplySchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const result = await applicationService.autoApplyFromResume(req.user!, profile, {
      minScore: body.minScore,
      limit: body.limit,
      boardOnly: body.boardOnly,
    });
    res.status(201).json({
      success: true,
      data: {
        ...result,
        complianceNote:
          'Each auto-apply generates an AI cover letter from your resume. Emails/WhatsApp when contacts exist; otherwise official apply links open with the letter ready to paste.',
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
    const data = await applicationService.updateStatus(
      req.user!.uid,
      req.params.id,
      body.status,
      body.note,
    );
    res.json({ success: true, data });
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
