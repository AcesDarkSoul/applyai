import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { auditService } from '../services/auditService';
import { generateAndSaveCoverLetter } from '../services/coverLetterService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';
import { analyzeSkillGap } from '../services/skillGapService';

const coverLetterSchema = z.object({
  jobId: z.string().min(1),
});

const jobIdSchema = z.object({
  jobId: z.string().min(1),
});

export async function generateCoverLetter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { jobId } = coverLetterSchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    if (!profile.summary && !(profile.skills?.length > 1) && !profile.title) {
      throw new AppError(
        400,
        'Upload or complete your resume/profile first so we can draft a cover letter.',
        'PROFILE_INCOMPLETE',
      );
    }

    const cover = await generateAndSaveCoverLetter(req.user!, profile, job);

    res.json({
      success: true,
      data: {
        jobId,
        content: cover.content,
        coverLetterId: cover.id,
        aiAssisted: cover.aiAssisted,
        promptVersion: 'cover-letter@v2',
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Per-job ATS resume variant (Module 6). */
export async function tailorResume(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { jobId } = jobIdSchema.parse(req.body);
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    const result = await resumeService.tailorForJob(req.user!, job);
    await auditService.append(
      req.user!.uid,
      'resume_tailor',
      `Generated ATS resume variant for ${job.title} @ ${job.company}`,
      { jobId: job.id, metadata: { resumeId: result.resume.id, aiAssisted: result.aiAssisted } },
    );

    res.status(201).json({
      success: true,
      data: {
        resume: result.resume,
        tips: result.tips,
        notes: result.notes,
        aiAssisted: result.aiAssisted,
        jobId: job.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Skill-gap + learning roadmap after match (Module 11). */
export async function skillGap(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const jobId = String(req.params.jobId || req.body?.jobId || '');
    if (!jobId) throw new AppError(400, 'jobId required', 'VALIDATION');
    const profile = await profileService.getOrCreate(req.user!);
    const job = await jobService.getById(jobId, profile);
    if (!job) throw new AppError(404, 'Job not found', 'NOT_FOUND');

    const data = await analyzeSkillGap(profile, job);
    res.json({ success: true, data: { jobId, ...data } });
  } catch (err) {
    next(err);
  }
}
