import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { applicationService } from '../services/applicationService';
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

    const application = await applicationService.smartApply(req.user!.uid, job);
    res.status(201).json({
      success: true,
      data: {
        application,
        applyUrl: job.applyUrl,
        complianceNote:
          'Smart Apply opens the official job posting. You complete the application on the third-party site.',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Auto outreach apply:
 * - email in job post → send application email (SendGrid)
 * - phone in job post → WhatsApp (Twilio) or wa.me fallback
 * - else → Smart Apply URL (no silent LinkedIn/Naukri submit)
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

    if (!profile.summary && !(profile.skills?.length > 2)) {
      throw new AppError(
        400,
        'Upload your resume on Profile first so outreach can use your details.',
        'PROFILE_INCOMPLETE',
      );
    }

    const outreach = await outreachApply(profile, job);
    const note =
      outreach.channel === 'email'
        ? outreach.sent
          ? 'Emailed recruiter from resume profile'
          : outreach.note
        : outreach.channel === 'whatsapp'
          ? outreach.sent
            ? 'WhatsApp sent from resume profile'
            : outreach.note
          : 'Smart Apply — opened official posting';

    const application = await applicationService.smartApply(req.user!.uid, job);
    await applicationService.updateStatus(req.user!.uid, application.id, 'applied', note);

    res.status(201).json({
      success: true,
      data: {
        application,
        outreach,
        applyUrl: job.applyUrl,
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
